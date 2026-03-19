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
- `lumyn_messages_used` — monotonic counter, incremented on each free-tier message send, never decremented

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

> Real Stripe product/price IDs replace the placeholders above before deploy.

---

## §3 — Checkout Flow

### Web (`create-checkout-session`)

When `tier === 'lumyn-pro'`, use `mode: 'subscription'` instead of `mode: 'payment'`. All other logic (customer lookup/create, metadata, success/cancel URLs) is unchanged.

```ts
mode: tier === 'lumyn-pro' ? 'subscription' : 'payment',
```

Success URL receives `?session_id={CHECKOUT_SESSION_ID}`. The existing `/payment/success` page handles this. Add `?upgraded=true` param to trigger a Pro welcome toast when the user lands back in the app.

### Native IAP (`iap.ts`)

Add to `TIER_TO_PRODUCT_ID`:
```ts
'lumyn-pro': 'com.vyberology.lumyn_pro'
```

RevenueCat entitlement check after purchase sets `lumyn_pro = true` via the same `setLumynPro` DB helper called by the Stripe webhook.

---

## §4 — Stripe Webhook

### `handleSubscriptionUpdate` addition

After upserting the `subscriptions` row, check if the price is the Lumyn Pro price. If yes, call `setLumynPro(supabase, userId, true, null)`.

### `handleSubscriptionDeleted` addition

Call `setLumynPro(supabase, userId, false, subscription.current_period_end)` — sets `lumyn_pro = false`, `lumyn_pro_until = current_period_end` (grace period until billing cycle ends).

### New DB helper

```ts
async function setLumynPro(
  supabase: SupabaseClient,
  userId: string,
  isPro: boolean,
  proUntil: string | null   // ISO timestamp or null
): Promise<void>
```

Updates `user_profiles` SET `lumyn_pro`, `lumyn_pro_until` WHERE `user_id = userId`.

---

## §5 — Orchestrator Changes

### Step 1 expansion: entitlement check

Before the existing rate limit check, load the user's profile in one query:

```ts
const { lumyn_pro, lumyn_pro_until, lumyn_messages_used } = await getUserEntitlement(supabase, userId)
const is_pro = lumyn_pro && (lumyn_pro_until === null || new Date(lumyn_pro_until) > new Date())
```

**If free and `messages_used >= 10`:**
Return a `ChatResponse` with `paywall: true`. No LLM call, no DB writes beyond the user message insert.

**If free and under limit:**
`UPDATE user_profiles SET lumyn_messages_used = lumyn_messages_used + 1 WHERE user_id = $1`

Then proceed with rate limit check as today.

### `ChatResponse` type addition

```ts
paywall?: true
```

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

**Thread list:**
- Shows up to 10 conversations ordered by `created_at DESC`
- Each row: title (or `"Conversation · {date}"` fallback), mode badge, date
- "New conversation" button at top — clears `conversationId` state, clears `chatMessages` state
- Tapping a thread: fetches its messages from `lumyn_messages` ordered `created_at ASC`, maps to `ChatMessage[]`, sets `conversationId`

**Data source:** direct Supabase client query to `lumyn_conversations` (RLS scopes to `user_id`). No new edge function needed.

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
- "Upgrade to Lumyn Pro" button → `purchaseTier('lumyn-pro', { priceId: LUMYN_PRO_PRICE_ID })`

The card is injected into `chatMessages` state client-side (not stored in DB).

### Thread list Pro banner

Sticky banner at the bottom of the thread drawer for free users:
- "Unlock full conversation history with Pro."
- "Upgrade" CTA button

### Post-purchase flow

- Stripe redirects to `/payment/success?upgraded=true`
- Success page shows toast: "Welcome to Lumyn Pro — enjoy unlimited conversations."
- On next chat open, client re-fetches user profile; `lumyn_pro = true` lifts all gates automatically.

---

## §8 — Client entitlement hook

New hook: `useLumynEntitlement()` — reads `lumyn_pro`, `lumyn_messages_used` from `user_profiles` on mount. Returns `{ isPro, messagesUsed, isLoading }`. Used by `LumynChatFab` to:
- Show/hide Pro upgrade banner in thread list
- Know whether to show the thread switcher in full or restricted mode

---

## §9 — Out of scope

- Trial periods
- Annual billing
- Team/gift subscriptions
- Internationalised pricing
- RevenueCat subscription status sync (beyond setting the DB flag) — deferred

---

## §10 — Implementation order

1. DB migration (`user_profiles` columns + Lumyn Pro product/price seed)
2. `setLumynPro` helper + stripe-webhook additions
3. `create-checkout-session` subscription mode branch
4. IAP product ID addition
5. Orchestrator entitlement check + free-tier gates + `paywall` response field
6. `useLumynEntitlement` hook
7. Thread switcher UI (`LumynChatFab` + thread list drawer)
8. `LumynPaywallCard` component + inline upsell injection
9. Thread list Pro banner
10. Post-purchase toast on `/payment/success`
