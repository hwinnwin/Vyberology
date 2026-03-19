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
  ADD COLUMN lumyn_messages_used INTEGER NOT NULL DEFAULT 0;
```

- `lumyn_pro` — live entitlement gate, set by Stripe webhook
- `lumyn_pro_until` — NULL for active managed subscriptions; set to `current_period_end` on cancellation (grace period support)
- `lumyn_messages_used` — monotonic counter, incremented atomically on each free-tier message send via a DB function, never decremented

**Existing users:** the migration adds `lumyn_messages_used = 0` for all existing rows. Historical messages in `lumyn_messages` are not counted toward the free limit — everyone starts fresh post-migration.

### Entitlement rule (server-side)

```
is_pro = lumyn_pro AND (lumyn_pro_until IS NULL OR lumyn_pro_until > now())
```

### Free tier limits

| Limit | Value |
|---|---|
| Total messages (lifetime) | 10 |
| Mode | `reflect` only |
| Memory persistence | None (claims/moments/summaries skipped) |
| Reading history in context | Stripped |
| Thread history | Most recent conversation only |

### Atomic free-message increment (DB function — part of §1 migration)

To prevent race conditions (two concurrent requests both passing the 10-message guard), the increment is handled by a single SQL function:

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
  RETURN v_new_count; -- NULL if 0 rows updated (limit already hit or now Pro)
END;
$$;
```

The orchestrator calls this function instead of a read-then-update. A NULL return means the paywall is hit.

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

> Real Stripe product/price IDs replace the placeholders above before deploy. The real `stripe_price_id` is also set in Vercel/hosting env as `VITE_LUMYN_PRO_PRICE_ID` (used client-side by `LumynPaywallCard` to call `purchaseTier`).

---

## §3 — Checkout Flow

### Web (`create-checkout-session`)

When `tier === 'lumyn-pro'`, use `mode: 'subscription'` instead of `mode: 'payment'`. **Critically:** `payment_intent_data` is invalid in subscription mode — it must be conditionally omitted. Use `subscription_data` instead for metadata in the subscription case:

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

Success URL: `/payment/success?session_id={CHECKOUT_SESSION_ID}&upgraded=true&tier=lumyn-pro` — the `upgraded=true` param triggers the Pro welcome toast; `tier=lumyn-pro` is read by the existing tier label switch in `PaymentSuccess.tsx`.

**`/payment/success` page:** add a `lumyn-pro` case to the tier label switch so the page shows subscription-appropriate copy (not "reading credits"). The `tier` param must be included in the success URL (above) — it is not derived from the Stripe session server-side.

### `purchaseTier` signature

`purchaseTier` requires `{ fullName, dob, priceId }`. For `lumyn-pro`, `fullName` and `dob` are irrelevant — pass empty strings. The `create-checkout-session` function only uses them as metadata, and they are not required by Stripe:

```ts
purchaseTier('lumyn-pro', { priceId: LUMYN_PRO_PRICE_ID, fullName: '', dob: '' })
```

### Native IAP (`iap.ts`)

Add to `TIER_TO_PRODUCT_ID`:
```ts
'lumyn-pro': 'com.vyberology.lumyn_pro'
```

Native subscription support requires the `validate-iap-receipt` edge function (RevenueCat webhook handler) to be updated to call `setLumynPro` when it receives a subscription entitlement grant for `lumyn_pro`. This is included in §10 step 4. The existing `purchaseProduct` flow is for consumables only — `lumyn-pro` on native uses RevenueCat's subscription offering and entitlement, not the consumable purchase path. The `purchaseProduct` function must be extended or a separate `purchaseSubscription` path added for native subscription products.

---

## §4 — Stripe Webhook

### `handleSubscriptionUpdate` addition

After upserting the `subscriptions` row, check if the price is the Lumyn Pro price using the `LUMYN_PRO_STRIPE_PRICE_ID` env var (set in Supabase secrets, matches the real `stripe_price_id` from §2):

```ts
const stripePriceId = subscription.items.data[0]?.price.id
const lumynProPriceId = Deno.env.get('LUMYN_PRO_STRIPE_PRICE_ID')
if (stripePriceId && lumynProPriceId && stripePriceId === lumynProPriceId) {
  await setLumynPro(supabase, userId, true, null)
}
```

`userId` is already resolved in this function via `stripe.customers.retrieve(subscription.customer)` → `customer.metadata.supabase_user_id`.

### `handleSubscriptionDeleted` addition

`handleSubscriptionDeleted` currently only updates the `subscriptions` row — it does **not** resolve a `userId`. It must be updated to perform the same customer lookup that `handleSubscriptionUpdate` already does:

```ts
const customer = await stripe.customers.retrieve(subscription.customer as string)
const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
if (!userId) { console.error('No supabase_user_id on customer'); return }
```

Also check the Lumyn Pro price guard (same as in `handleSubscriptionUpdate`) before calling `setLumynPro`, so other subscription types are not affected:

```ts
const stripePriceId = subscription.items.data[0]?.price.id
const lumynProPriceId = Deno.env.get('LUMYN_PRO_STRIPE_PRICE_ID')
if (stripePriceId && lumynProPriceId && stripePriceId === lumynProPriceId) {
  await setLumynPro(
    supabase,
    userId,
    false,
    new Date(subscription.current_period_end * 1000).toISOString()  // Unix → ISO
  )
}
```

**Cancellation grace period behaviour:** when a user cancels via the Stripe portal with "cancel at period end", Stripe fires `customer.subscription.updated` (not `deleted`) with `cancel_at_period_end: true`. The user remains `lumyn_pro = true` until the period ends, at which point `customer.subscription.deleted` fires and `setLumynPro(false, period_end)` runs. Because `period_end` is now in the past, `is_pro` becomes false immediately. This is intentional — the grace period window is zero at deletion time.

### `setLumynPro` DB helper

```ts
async function setLumynPro(
  supabase: SupabaseClient,
  userId: string,
  isPro: boolean,
  proUntil: string | null   // ISO timestamp or null
): Promise<void>
```

Uses **upsert** (not plain UPDATE) to handle the edge case where `user_profiles` row doesn't exist yet:

```ts
await supabase.from('user_profiles').upsert({
  user_id: userId,
  lumyn_pro: isPro,
  lumyn_pro_until: proUntil,
}, { onConflict: 'user_id' })
```

---

## §5 — Orchestrator Changes

### Step 1 expansion: entitlement check

Before the existing rate limit check, call `getUserEntitlement`:

```ts
const entitlement = await getUserEntitlement(supabase, userId)
// Returns { lumyn_pro: false, lumyn_pro_until: null, lumyn_messages_used: 0 } if no row exists
const is_pro = entitlement.lumyn_pro &&
  (entitlement.lumyn_pro_until === null || new Date(entitlement.lumyn_pro_until) > new Date())
```

`getUserEntitlement` selects from `user_profiles` and returns safe defaults if the row doesn't exist (no row = free tier, 0 messages used).

**If free tier:**

Call `lumyn_increment_free_messages(userId)` atomically:
- Returns `null` → paywall hit → return `ChatResponse` with `paywall: true`. No LLM call.
- Returns a number → proceed (messages_used is now incremented).

Then proceed with existing rate limit check (60/hr, 500/day).

**Note:** the `paywall: true` response is returned before inserting the user's message into `lumyn_messages` (Step 3), so no DB record is created for the blocked message.

**Counter drift trade-off (accepted):** `lumyn_messages_used` is incremented atomically at Step 1, before the message is inserted at Step 3. If a transient error occurs between Step 1 and Step 3, the counter advances without a corresponding `lumyn_messages` row. This is accepted — the counter is a soft limit for UX gating, not a billing-critical value. Drift of ±1 is tolerable.

### `ChatResponse` type addition

```ts
paywall?: true
```

Add to both `apps/web/src/types/lumyn.ts` and `supabase/functions/lumyn-chat/types.ts`.

### Free-tier feature gates (applied throughout orchestrator)

| Gate | Free behaviour |
|---|---|
| Mode | Coerce any non-`reflect` mode to `reflect` silently |
| `vyberologyContext` | Strip `ReadingHistory` and `UserProfile` inputs before prompt assembly |
| Memory write (step 7–8) | Skip `processMemorableMoments` and `generateConversationSummary` entirely |
| Claims/patterns | Not written or read for free users |

---

## §6 — Thread UI

### Thread switcher

The `LumynChatFab` panel header gains a "Conversations" icon button (left side). Tapping it slides open a thread list drawer within the chat panel (not a new page).

**Data source:** direct Supabase JS client query (anon key + user JWT) to `lumyn_conversations` and `lumyn_messages`. Both tables have RLS `FOR ALL USING (auth.uid() = user_id)` — SELECT is permitted for the authenticated user's own rows. No new edge function is needed.

**Thread list:**
- Shows up to 10 conversations ordered by `created_at DESC`
- Each row: title (or `"Conversation · {date}"` fallback), mode badge, date
- "New conversation" button at top — clears `conversationId` state, clears `chatMessages` state
- Tapping a thread: fetches its messages from `lumyn_messages` ordered `created_at ASC`, maps to `ChatMessage[]`, sets `conversationId`

**Pro gate on threads:**
- Free: thread list shows only the single most recent conversation. "New conversation" replaces it (old one becomes inaccessible in UI, not deleted in DB).
- Pro: full history up to 10 shown, unlimited new conversations.

### State additions to `LumynChatFab`

```ts
const [showThreadList, setShowThreadList] = useState(false)
const [threads, setThreads] = useState<LumynConversation[]>([])
const [isLoadingThreads, setIsLoadingThreads] = useState(false)
```

---

## §7 — Upsell UI

### Inline paywall card

Rendered in the conversation thread when `response.paywall === true`. Styled as an assistant message bubble but implemented as a dedicated `LumynPaywallCard` component.

Content:
- "You've used your 10 free messages with Lumyn."
- "Upgrade to Pro for unlimited conversations, full memory, and all four modes — $14.97/month."
- "Upgrade to Lumyn Pro" button → `purchaseTier('lumyn-pro', { priceId: VITE_LUMYN_PRO_PRICE_ID, fullName: '', dob: '' })`

The card is injected into `chatMessages` state client-side (not stored in DB).

### Thread list Pro banner

Sticky banner at the bottom of the thread drawer for free users:
- "Unlock full conversation history with Pro."
- "Upgrade" CTA button → same `purchaseTier` call as above.

### Post-purchase flow

- Stripe redirects to `/payment/success?upgraded=true`
- Success page shows toast: "Welcome to Lumyn Pro — enjoy unlimited conversations." (triggered by `upgraded=true` query param)
- Success page displays subscription copy, not reading credits (requires a `lumyn-pro` case in the existing tier label switch)
- On next chat open, `useLumynEntitlement` re-fetches; `lumyn_pro = true` lifts all gates automatically

---

## §8 — Client entitlement hook

New hook: `useLumynEntitlement()` — reads `lumyn_pro`, `lumyn_messages_used` from `user_profiles` on mount via direct Supabase client query. Returns `{ isPro, messagesUsed, isLoading }`. Used by `LumynChatFab` to:
- Show/hide Pro upgrade banner in thread list
- Know whether to show the thread switcher in full or restricted mode

**Staleness (accepted):** the hook fetches once on mount. If a subscription is cancelled mid-session, the client UI remains in Pro state until the user remounts or reloads. The server-side orchestrator is the true enforcement point — a cancelled user cannot send messages even if the client UI doesn't update. Stale client state is a UX gap, not a security gap, and is accepted for this release. A Supabase Realtime subscription on `user_profiles` is deferred to a future iteration.

---

## §9 — Out of scope

- Trial periods
- Annual billing
- Team/gift subscriptions
- Internationalised pricing
- RevenueCat subscription status sync (beyond setting the DB flag) — deferred

---

## §10 — Implementation order

1. DB migration: `user_profiles` columns + `lumyn_increment_free_messages` RPC + Lumyn Pro product/price seed
2. `setLumynPro` helper (upsert) + stripe-webhook additions (`handleSubscriptionUpdate` + `handleSubscriptionDeleted` with customer lookup)
3. `create-checkout-session` subscription mode branch (conditional `payment_intent_data` / `subscription_data`, `lumyn-pro` case in `/payment/success`)
4. IAP: add product ID to `TIER_TO_PRODUCT_ID`; add `purchaseSubscription` native path for subscription products; update `validate-iap-receipt` to call `setLumynPro` on entitlement grant
5. Orchestrator: `getUserEntitlement`, atomic free-message gate, free-tier feature gates, `paywall` response field
6. `ChatResponse` type update (both `types.ts` files)
7. `useLumynEntitlement` hook
8. Thread switcher UI (`LumynChatFab` + thread list drawer)
9. `LumynPaywallCard` component + inline upsell injection
10. Thread list Pro banner + post-purchase toast on `/payment/success`
