# Lumyn Pro Subscription — Design Spec

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Lumyn Pro is a $14.97/month recurring subscription that unlocks the full Lumyn experience. Free users get 10 lifetime messages in reflect mode only, with stateless context. Pro users get unlimited conversations, persistent memory (claims, moments, summaries), all four modes, reading history in every conversation, and full thread history.

---

## §1 — Data Model

### `user_profiles` additions (migration)

```sql
ALTER TABLE user_profiles
  ADD COLUMN lumyn_pro           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN lumyn_pro_until     TIMESTAMPTZ,
  ADD COLUMN lumyn_messages_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN lumyn_last_message_at TIMESTAMPTZ;  -- maintained on each message insert
```

- `lumyn_pro` — live entitlement gate, set by Stripe webhook
- `lumyn_pro_until` — NULL for active managed subscriptions; set to `current_period_end` on cancellation
- `lumyn_messages_used` — monotonic counter, incremented atomically on each free-tier message send, never decremented
- `lumyn_last_message_at` — updated on every message send (used for thread ordering, see §6)

**Existing users:** the migration adds `lumyn_messages_used = 0` for all existing rows. Historical messages in `lumyn_messages` are not counted toward the free limit — everyone starts fresh post-migration.

### Entitlement rule

The entitlement check is centralised in one place and called everywhere — not duplicated:

**Server-side (orchestrator):** `resolveLumynEntitlement(profile)` helper in `db.ts`:

```ts
export function resolveLumynEntitlement(profile: {
  lumyn_pro: boolean
  lumyn_pro_until: string | null
}): boolean {
  return profile.lumyn_pro &&
    (profile.lumyn_pro_until === null || new Date(profile.lumyn_pro_until) > new Date())
}
```

Used in the orchestrator, `setLumynPro`, and any future server path. No hand-rolled entitlement logic elsewhere.

**Client-side:** `useLumynEntitlement` hook derives `isPro` using the same rule from the fetched profile row.

### Free tier limits

| Limit | Value |
|---|---|
| Total messages (lifetime) | 10 |
| Mode | `reflect` only |
| Memory persistence | None (claims/moments/summaries skipped) |
| Reading history in context | Stripped |
| Thread history | Most recent conversation only (by last activity) |

### Free message counter — UI display

Free users see a message counter in the `LumynChatFab` header: **"3 / 10 free messages"**. This reduces surprise at the paywall. `useLumynEntitlement` returns `messagesUsed` for this.

### Atomic free-message increment (DB function — part of §1 migration)

```sql
CREATE OR REPLACE FUNCTION lumyn_increment_free_messages(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_new_count INTEGER;
BEGIN
  UPDATE user_profiles
    SET lumyn_messages_used = lumyn_messages_used + 1
    WHERE user_id = p_user_id
      AND lumyn_messages_used < 10
      AND lumyn_pro = false
    RETURNING lumyn_messages_used INTO v_new_count;
  RETURN v_new_count; -- NULL if 0 rows updated (limit hit or now Pro)
END;
$$;
```

A NULL return means the paywall is hit. The orchestrator calls this instead of a read-then-update.

**Idempotency note:** client retries and double-submits are a known risk. For alpha, this is accepted. A future iteration can add an optional `client_message_id` idempotency key — if the same user sends the same key within a short window, the increment is skipped.

---

## §2 — Stripe Product & Seeding

New migration seeds one product and one recurring price:

```sql
INSERT INTO products (stripe_product_id, name, description, active)
VALUES ('prod_lumyn_pro', 'Lumyn Pro', 'Unlimited Lumyn conversations with full memory and all modes', true);

INSERT INTO prices (product_id, stripe_price_id, currency, unit_amount, interval, interval_count, active)
VALUES (
  (SELECT id FROM products WHERE stripe_product_id = 'prod_lumyn_pro'),
  'price_lumyn_pro_monthly',
  'usd',
  1497,      -- $14.97
  'month',
  1,
  true
);
```

> Real Stripe product/price IDs replace the placeholders above before deploy. The real `stripe_price_id` is also set in Vercel/hosting env as `VITE_LUMYN_PRO_PRICE_ID` (used client-side by `LumynPaywallCard`), and in Supabase secrets as `LUMYN_PRO_STRIPE_PRICE_ID` (used server-side by the webhook).

---

## §3 — Checkout Flow

### Web (`create-checkout-session`)

When `tier === 'lumyn-pro'`, use `mode: 'subscription'` instead of `mode: 'payment'`. **`payment_intent_data` is invalid in subscription mode** — it must be conditionally omitted. Use `subscription_data` for metadata instead:

```ts
const isSubscription = tier === 'lumyn-pro'

const sessionParams = {
  customer: customerId,
  line_items: [{ price: priceId, quantity }],
  mode: isSubscription ? 'subscription' : 'payment',
  success_url: ...,
  cancel_url: ...,
  metadata: { user_id, tier, ... },
  billing_address_collection: 'auto',
  ...(isSubscription
    ? { subscription_data: { metadata: { user_id, tier } } }
    : { payment_intent_data: { metadata: { user_id, tier } } }),
}
```

Success URL: `/payment/success?session_id={CHECKOUT_SESSION_ID}&upgraded=true&tier=lumyn-pro`

**`/payment/success` page changes:**
- Add a `lumyn-pro` case to the tier label switch (subscription copy, not reading credits)
- On mount, if `upgraded=true` param is present: re-fetch `useLumynEntitlement` immediately before showing the toast — this ensures the Pro state is reflected in the UI without waiting for the next page load
- Toast: "Welcome to Lumyn Pro — enjoy unlimited conversations."

### `purchaseTier` signature

`purchaseTier` requires `{ fullName, dob, priceId }`. For `lumyn-pro`, pass empty strings for `fullName`/`dob`:

```ts
purchaseTier('lumyn-pro', { priceId: LUMYN_PRO_PRICE_ID, fullName: '', dob: '' })
```

### Native IAP (`iap.ts`)

Add to `TIER_TO_PRODUCT_ID`:
```ts
'lumyn-pro': 'com.vyberology.lumyn_pro'
```

**Native subscription is web-first for the initial rollout.** The native purchase path for `lumyn-pro` must use RevenueCat's subscription offering (`Purchases.purchasePackage`), not the existing consumable `purchaseProduct` flow. A separate `purchaseSubscription(productId)` function is required. The `validate-iap-receipt` webhook must be updated to call `setLumynPro` on `INITIAL_PURCHASE` and `RENEWAL` entitlement events for the `lumyn_pro` entitlement identifier. This work is included in §10 step 4 but the native Lumyn Pro purchase UI should remain hidden/disabled until fully tested on device.

---

## §4 — Stripe Webhook

### Price match helper

Both `handleSubscriptionUpdate` and `handleSubscriptionDeleted` use the same price check. Extract to a shared helper to avoid duplication:

```ts
function isLumynProPrice(subscription: Stripe.Subscription): boolean {
  const lumynProPriceId = Deno.env.get('LUMYN_PRO_STRIPE_PRICE_ID')
  if (!lumynProPriceId) return false
  return subscription.items.data.some(item => item.price.id === lumynProPriceId)
}
```

Note: checks **any** line item, not just `[0]`, for robustness against multi-item subscriptions.

### `handleSubscriptionUpdate` addition

After upserting the `subscriptions` row:

```ts
if (isLumynProPrice(subscription)) {
  await setLumynPro(supabase, userId, true, null)
}
```

`userId` is already resolved via `stripe.customers.retrieve(subscription.customer)` → `customer.metadata.supabase_user_id`.

### `handleSubscriptionDeleted` addition

`handleSubscriptionDeleted` currently has no customer lookup — it must add one (mirrors `handleSubscriptionUpdate`):

```ts
const customer = await stripe.customers.retrieve(subscription.customer as string)
const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
if (!userId) { console.error('No supabase_user_id on customer'); return }

if (isLumynProPrice(subscription)) {
  await setLumynPro(
    supabase,
    userId,
    false,
    new Date(subscription.current_period_end * 1000).toISOString()
  )
}
```

**Cancellation grace period:** user cancels → `customer.subscription.updated` fires with `cancel_at_period_end: true` → `lumyn_pro` stays `true`. At period end → `customer.subscription.deleted` fires → `setLumynPro(false, period_end)` → `period_end` is now past → `is_pro` resolves false immediately. Grace period is zero at deletion time. Intentional.

### `setLumynPro` DB helper

Uses upsert (not plain UPDATE) so it is safe if the `user_profiles` row doesn't exist. **Only touches `lumyn_pro` and `lumyn_pro_until` columns** — all other profile fields are left untouched via the upsert merge:

```ts
async function setLumynPro(
  supabase: SupabaseClient,
  userId: string,
  isPro: boolean,
  proUntil: string | null
): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    lumyn_pro: isPro,
    lumyn_pro_until: proUntil,
  }, { onConflict: 'user_id' })
  if (error) console.error('setLumynPro failed:', error)
}
```

Supabase upsert with `onConflict` only updates the specified columns on conflict — existing columns not in the object are preserved.

---

## §5 — Orchestrator Changes

### Entitlement check (before Step 1 rate limit)

```ts
const entitlement = await getUserEntitlement(supabase, userId)
// Safe defaults if no row: { lumyn_pro: false, lumyn_pro_until: null, lumyn_messages_used: 0 }
const is_pro = resolveLumynEntitlement(entitlement)
```

**If free tier:**

Call `lumyn_increment_free_messages(userId)` atomically:
- Returns `null` → paywall hit → return `ChatResponse` with `paywall: true`. No LLM call, no message insert.
- Returns a number → proceed (counter incremented).

Then proceed with existing rate limit check (60/hr, 500/day).

**Counter drift (accepted):** counter increments at this step; message insert happens at Step 3. A transient error between steps causes drift of ±1. Accepted — this is a UX soft limit, not billing-critical.

### Paywall event logging

When `paywall: true` is returned, log a row to `lumyn_safety_events` with `event_type = 'paywall_hit'` and `details = { messages_used, mode_requested }`. This provides funnel analytics and "did we block too early?" signal.

### `ChatResponse` type addition

```ts
paywall?: true
```

Add to both `apps/web/src/types/lumyn.ts` and `supabase/functions/lumyn-chat/types.ts`.

### Free-tier feature gates

| Gate | Free behaviour |
|---|---|
| Mode | Coerce any non-`reflect` mode to `reflect` silently |
| `vyberologyContext` | Strip `ReadingHistory` and `UserProfile` inputs before prompt assembly |
| Memory write (steps 7–8) | Skip `processMemorableMoments` and `generateConversationSummary` entirely |
| Claims/patterns | Not written or read for free users |

---

## §6 — Thread UI

### Thread ordering

Threads are ordered by **last activity** — `MAX(lumyn_messages.created_at)` per conversation, falling back to `lumyn_conversations.created_at`. The `lumyn_last_message_at` column on `user_profiles` (§1) is updated on each message insert and used as the sort key for the single-thread free view. For the thread list, order by `lumyn_conversations.created_at DESC` (sufficient for alpha; a `last_message_at` column on `lumyn_conversations` can be added later if needed).

### Thread switcher

The `LumynChatFab` panel header gains a "Conversations" icon button (left side). Tapping it slides open a thread list drawer within the chat panel.

**Data source:** direct Supabase JS client query to `lumyn_conversations` (RLS: `FOR ALL USING (auth.uid() = user_id)`). No new edge function needed.

**Thread list:**
- Shows up to 10 conversations ordered by `created_at DESC`
- Each row: title (or `"Conversation · {date}"` fallback), mode badge, date
- "New conversation" button at top — clears `conversationId` state, clears `chatMessages` state
- Tapping a thread: fetches `lumyn_messages` for that `conversation_id` ordered `created_at ASC`, maps to `ChatMessage[]`, sets `conversationId`

**Pro gate on threads:**
- Free: thread list shows only the single most recent conversation (by `created_at DESC LIMIT 1`). "New conversation" creates a new one; old one becomes inaccessible in UI, not deleted.
- Pro: full history up to 10 shown, unlimited new conversations.

### State additions to `LumynChatFab`

```ts
const [showThreadList, setShowThreadList] = useState(false)
const [threads, setThreads] = useState<LumynConversation[]>([])
const [isLoadingThreads, setIsLoadingThreads] = useState(false)
```

---

## §7 — Upsell UI

### Free message counter

Displayed in the `LumynChatFab` panel header for free users: **"3 / 10 free messages"**. Hidden for Pro users.

### Inline paywall card (`LumynPaywallCard`)

Injected into the conversation thread as a synthetic `ChatMessage` when `response.paywall === true`. Styled as an assistant bubble but not stored in DB.

Content:
- "You've used your 10 free messages with Lumyn."
- "Upgrade to Pro for unlimited conversations, full memory, and all four modes — $14.97/month."
- "Upgrade to Lumyn Pro" button → `purchaseTier('lumyn-pro', { priceId: VITE_LUMYN_PRO_PRICE_ID, fullName: '', dob: '' })`

### Thread list Pro banner

Sticky banner at bottom of the thread drawer for free users:
- "Unlock full conversation history with Pro."
- "Upgrade" CTA → same `purchaseTier` call.

### Post-purchase flow

1. Stripe redirects to `/payment/success?upgraded=true&tier=lumyn-pro`
2. On mount, `/payment/success` detects `upgraded=true` → immediately re-fetches `useLumynEntitlement` (not deferred to next page load)
3. After re-fetch resolves: show toast "Welcome to Lumyn Pro — enjoy unlimited conversations."
4. Display subscription-appropriate copy (not reading credits) via `lumyn-pro` case in tier label switch

---

## §8 — Client entitlement hook

`useLumynEntitlement()` — fetches `lumyn_pro`, `lumyn_pro_until`, `lumyn_messages_used` from `user_profiles` on mount. Returns `{ isPro, messagesUsed, isLoading, refetch }`.

`refetch` is exposed so `/payment/success` can trigger an immediate re-fetch after upgrade (§7).

**Staleness (accepted):** fetches once on mount. Mid-session cancellation leaves UI stale until remount. Server enforces — stale client state is a UX gap, not a security gap. Supabase Realtime on `user_profiles` deferred to a future iteration.

---

## §9 — Out of scope

- Trial periods
- Annual billing
- Team/gift subscriptions
- Internationalised pricing
- Client-side idempotency keys for message sends
- Supabase Realtime entitlement sync
- Native Lumyn Pro purchase UI (code-ready but hidden pending device testing)

---

## §10 — Implementation order

1. DB migration: `user_profiles` columns (`lumyn_pro`, `lumyn_pro_until`, `lumyn_messages_used`, `lumyn_last_message_at`) + `lumyn_increment_free_messages` RPC + Lumyn Pro product/price seed
2. `resolveLumynEntitlement` shared helper + `setLumynPro` upsert helper + stripe-webhook additions (`isLumynProPrice`, `handleSubscriptionUpdate` guard, `handleSubscriptionDeleted` customer lookup + guard)
3. `create-checkout-session` subscription mode branch (conditional `payment_intent_data` / `subscription_data`)
4. IAP: `TIER_TO_PRODUCT_ID` entry + `purchaseSubscription` native path + `validate-iap-receipt` entitlement update (native UI hidden until tested)
5. `ChatResponse` type update (both `types.ts` files: add `paywall?: true`)
6. Orchestrator: `getUserEntitlement`, `resolveLumynEntitlement`, atomic free-message gate, paywall event logging, free-tier feature gates
7. `useLumynEntitlement` hook (with `refetch`)
8. Thread switcher UI (`LumynChatFab` + thread list drawer + free message counter in header)
9. `LumynPaywallCard` component + inline upsell injection
10. Thread list Pro banner + `/payment/success` upgrade flow (`lumyn-pro` tier label, immediate entitlement re-fetch, welcome toast)
