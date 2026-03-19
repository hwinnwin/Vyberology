# Lumyn Pro Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a $14.97/month Lumyn Pro subscription that gates memory persistence, all four modes, reading history context, and full thread history behind a paywall, with a 10-message free tier and thread switcher UI.

**Architecture:** Entitlement lives on `user_profiles` (`lumyn_pro`, `lumyn_pro_until`, `lumyn_messages_used`). Stripe webhook maintains it server-side. The orchestrator enforces it atomically using a DB RPC before any LLM call. Client reads entitlement once on mount via `useLumynEntitlement` hook; server is the real enforcement point.

**Tech Stack:** Supabase (Postgres migrations, Edge Functions / Deno), Stripe (subscription checkout + webhook), RevenueCat (native IAP — web-first release, native hidden until tested), React + TypeScript (hooks, components), shadcn/ui, Tailwind CSS.

---

## File Map

**New files:**
- `supabase/migrations/20260319000000_lumyn_pro.sql` — user_profiles columns, `lumyn_increment_free_messages` RPC, product/price seed
- `apps/web/src/hooks/useLumynEntitlement.ts` — client entitlement hook
- `apps/web/src/components/LumynPaywallCard.tsx` — inline upsell component
- `apps/web/src/components/LumynThreadList.tsx` — thread drawer component

**Modified files:**
- `supabase/functions/stripe-webhook/index.ts` — add `isLumynProPrice`, `setLumynPro`, customer lookup in `handleSubscriptionDeleted`, entitlement update in `handleSubscriptionUpdate`
- `supabase/functions/create-checkout-session/index.ts` — subscription mode branch
- `supabase/functions/validate-iap-receipt/index.ts` — handle `INITIAL_PURCHASE` / `RENEWAL` for `lumyn_pro` product
- `supabase/functions/lumyn-chat/db.ts` — add `getUserEntitlement`, `resolveLumynEntitlement`
- `supabase/functions/lumyn-chat/types.ts` — add `paywall?: true` to `ChatResponse`, add `LumynSafetyEvent` union member
- `apps/web/src/types/lumyn.ts` — add `paywall?: true` to `ChatResponse`, add `LumynConversation` export
- `supabase/functions/lumyn-chat/orchestrator.ts` — entitlement gate, free-tier feature gates, paywall event logging
- `apps/web/src/services/iap.ts` — add `lumyn-pro` product ID, add `purchaseSubscription`
- `apps/web/src/components/LumynChatFab.tsx` — wire entitlement hook, thread switcher, paywall card, message counter
- `apps/web/src/pages/PaymentSuccess.tsx` — lumyn-pro case, immediate entitlement re-fetch, welcome toast

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260319000000_lumyn_pro.sql`

> Before writing, verify the existing `user_profiles` columns: `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'` via Supabase dashboard or `supabase db execute`.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260319000000_lumyn_pro.sql

-- Add Lumyn Pro entitlement columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS lumyn_pro            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lumyn_pro_until      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lumyn_messages_used  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lumyn_last_message_at TIMESTAMPTZ;

-- Atomic free-message increment
-- Returns new count, or NULL if limit already hit (0 rows updated)
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
  RETURN v_new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION lumyn_increment_free_messages(UUID) TO authenticated;

-- Seed Lumyn Pro product + price
-- Replace placeholder IDs with real Stripe IDs before deploy
INSERT INTO products (stripe_product_id, name, description, active)
VALUES ('prod_lumyn_pro', 'Lumyn Pro', 'Unlimited Lumyn conversations with full memory and all modes', true)
ON CONFLICT (stripe_product_id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO prices (product_id, stripe_price_id, currency, unit_amount, interval, interval_count, active)
VALUES (
  (SELECT id FROM products WHERE stripe_product_id = 'prod_lumyn_pro'),
  'price_lumyn_pro_monthly',
  'usd',
  1497,
  'month',
  1,
  true
)
ON CONFLICT (stripe_price_id) DO UPDATE SET unit_amount = EXCLUDED.unit_amount, active = EXCLUDED.active;
```

- [ ] **Step 2: Apply migration**

```bash
supabase db push
```

Expected: migration applies cleanly, no errors.

- [ ] **Step 3: Verify**

Run via Supabase SQL editor or CLI:
```sql
SELECT lumyn_pro, lumyn_pro_until, lumyn_messages_used, lumyn_last_message_at
FROM user_profiles LIMIT 1;
```
Expected: columns exist, all values are defaults (`false`, `null`, `0`, `null`).

```sql
SELECT lumyn_increment_free_messages('<any-real-user-uuid>');
```
Expected: returns `1` (first increment).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260319000000_lumyn_pro.sql
git commit -m "feat(lumyn-pro): add user_profiles entitlement columns and free-message RPC"
```

---

## Task 2: Stripe Webhook — entitlement helpers

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts`

This task adds `isLumynProPrice`, `setLumynPro`, and wires both into `handleSubscriptionUpdate` and `handleSubscriptionDeleted`.

- [ ] **Step 1: Add `isLumynProPrice` helper**

Add after the existing `calculateCreditsFromAmount` function at the bottom of the file:

```ts
/**
 * Returns true if any subscription line item matches the Lumyn Pro price.
 * Checks all items (not just [0]) for robustness.
 */
function isLumynProPrice(subscription: Stripe.Subscription): boolean {
  const lumynProPriceId = Deno.env.get('LUMYN_PRO_STRIPE_PRICE_ID')
  if (!lumynProPriceId) return false
  return subscription.items.data.some(item => item.price.id === lumynProPriceId)
}

/**
 * Set or clear Lumyn Pro entitlement on user_profiles.
 * Uses upsert so it is safe if the profile row doesn't exist yet.
 * Only touches lumyn_pro and lumyn_pro_until — other columns are unaffected.
 */
async function setLumynPro(
  supabase: any,
  userId: string,
  isPro: boolean,
  proUntil: string | null
): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    lumyn_pro: isPro,
    lumyn_pro_until: proUntil,
  }, { onConflict: 'user_id' })
  if (error) console.error('setLumynPro failed:', error.message)
}
```

- [ ] **Step 2: Update `handleSubscriptionUpdate`**

At the end of `handleSubscriptionUpdate`, after the existing `await supabase.from('subscriptions').upsert(...)` call, add:

```ts
  // Grant/confirm Lumyn Pro if this is the Pro subscription
  if (isLumynProPrice(subscription) && subscription.status === 'active') {
    await setLumynPro(supabase, userId, true, null)
  }
```

- [ ] **Step 3: Update `handleSubscriptionDeleted`**

Replace the existing `handleSubscriptionDeleted` function body with:

```ts
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  // Update subscription status in database (existing logic)
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  console.log(`Deleted subscription ${subscription.id}`)

  // Resolve userId via customer lookup (mirrors handleSubscriptionUpdate)
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  if (!userId) {
    console.error('No supabase_user_id in customer metadata on deletion')
    return
  }

  // Revoke Lumyn Pro if this is the Pro subscription
  if (isLumynProPrice(subscription)) {
    const proUntil = new Date(subscription.current_period_end * 1000).toISOString()
    await setLumynPro(supabase, userId, false, proUntil)
    console.log(`Revoked Lumyn Pro for user ${userId}, until ${proUntil}`)
  }
}
```

- [ ] **Step 4: Set the secret**

```bash
supabase secrets set LUMYN_PRO_STRIPE_PRICE_ID=price_REAL_ID_HERE
```

(Use the real Stripe price ID once created in the Stripe dashboard.)

- [ ] **Step 5: Deploy**

```bash
supabase functions deploy stripe-webhook
```

- [ ] **Step 6: Smoke test**

In Stripe dashboard → Developers → Webhooks → send a test `customer.subscription.updated` event. Check Supabase logs for `stripe-webhook`:
```bash
supabase functions logs stripe-webhook --tail
```
Expected: no errors, "Updated subscription..." logged.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat(lumyn-pro): add setLumynPro and Lumyn Pro price guard to stripe webhook"
```

---

## Task 3: Checkout — subscription mode branch

**Files:**
- Modify: `supabase/functions/create-checkout-session/index.ts`

- [ ] **Step 1: Replace the session creation block**

Find the `const session = await stripe.checkout.sessions.create({...})` block (lines 98–122 in the current file). Replace it with:

```ts
    const isSubscription = tier === 'lumyn-pro'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl || `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}${isSubscription ? '&upgraded=true&tier=lumyn-pro' : ''}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/payment/cancel`,
      metadata: {
        user_id: user.id,
        ...(tier && { tier }),
        ...(fullName && { full_name: fullName }),
        ...(dob && { dob }),
      },
      billing_address_collection: 'auto',
      ...(isSubscription
        ? { subscription_data: { metadata: { user_id: user.id, tier } } }
        : {
            payment_intent_data: {
              metadata: {
                user_id: user.id,
                ...(tier && { tier }),
              },
            },
          }),
    })
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy create-checkout-session
```

- [ ] **Step 3: Smoke test (local)**

Trigger a subscription checkout from the browser dev console (or use Stripe's test mode). Check that:
- The Stripe checkout page shows recurring billing ($14.97/month), not one-time
- Success URL includes `upgraded=true&tier=lumyn-pro`

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts
git commit -m "feat(lumyn-pro): add subscription mode branch to create-checkout-session"
```

---

## Task 4: IAP — native subscription path

**Files:**
- Modify: `apps/web/src/services/iap.ts`
- Modify: `supabase/functions/validate-iap-receipt/index.ts`

> **Note:** The native Lumyn Pro purchase UI is hidden until device-tested. These changes wire the backend path — the UI (in `LumynPaywallCard`) will keep the native path disabled via `isNative()` guard.

- [ ] **Step 1: Add product ID and `purchaseSubscription` to `iap.ts`**

In `apps/web/src/services/iap.ts`, update `TIER_TO_PRODUCT_ID`:

```ts
export const TIER_TO_PRODUCT_ID: Record<string, string> = {
  'lyf-path': 'com.vyberology.lyf_path',
  'full-vybe': 'com.vyberology.full_vybe',
  deep: 'com.vyberology.deep_attunement',
  'lumyn-pro': 'com.vyberology.lumyn_pro',  // subscription product
}
```

Add after `purchaseProduct`:

```ts
/**
 * Purchase a subscription product via RevenueCat offering.
 * Returns true if purchase succeeded, false if cancelled.
 * NOTE: Lumyn Pro subscription UI is web-first — this function exists
 * for future native enablement only.
 */
export async function purchaseSubscription(productId: string): Promise<boolean> {
  if (!isNative()) return false

  const { Purchases } = await import('@revenuecat/purchases-capacitor')

  try {
    const { offerings } = await Purchases.getOfferings()
    const currentOffering = offerings.current
    if (!currentOffering) throw new Error('No current offering available')

    const pkg = currentOffering.availablePackages.find(
      p => p.product.identifier === productId
    )
    if (!pkg) throw new Error(`Package ${productId} not found in offering`)

    await Purchases.purchasePackage({ aPackage: pkg })
    return true
  } catch (error: any) {
    if (error.userCancelled) return false
    throw error
  }
}
```

- [ ] **Step 2: Update `validate-iap-receipt` to handle Lumyn Pro subscription events**

In `supabase/functions/validate-iap-receipt/index.ts`:

1. Add the constant **at module level** (outside `serve()`), after the `PRODUCT_CREDITS` map:

```ts
// Subscription product IDs that grant Lumyn Pro
const SUBSCRIPTION_PRODUCTS = new Set(['com.vyberology.lumyn_pro'])
```

2. Add the subscription handling blocks **inside `serve()`** as **top-level sibling `if` blocks** — i.e., at the same nesting level as the existing `if (eventType === 'INITIAL_PURCHASE' || ...)` block, NOT inside it. Place them after that existing block, before the `CANCELLATION` refund block:

```ts
// Handle Lumyn Pro subscription grants
if (
  (eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL' || eventType === 'REACTIVATION') &&
  SUBSCRIPTION_PRODUCTS.has(event.product_id) &&
  appUserId
) {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: appUserId,
    lumyn_pro: true,
    lumyn_pro_until: null,
  }, { onConflict: 'user_id' })
  if (error) console.error('Failed to grant Lumyn Pro (IAP):', error.message)
  else console.log(`Granted Lumyn Pro to user ${appUserId} via ${eventType}`)
}

// Handle Lumyn Pro subscription cancellations
if (
  eventType === 'EXPIRATION' &&
  SUBSCRIPTION_PRODUCTS.has(event.product_id) &&
  appUserId
) {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: appUserId,
    lumyn_pro: false,
    lumyn_pro_until: event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) console.error('Failed to revoke Lumyn Pro (IAP):', error.message)
}
```

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy validate-iap-receipt
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services/iap.ts supabase/functions/validate-iap-receipt/index.ts
git commit -m "feat(lumyn-pro): add native subscription IAP path (web-first, native hidden)"
```

---

## Task 5: Types — add `paywall` field

**Files:**
- Modify: `supabase/functions/lumyn-chat/types.ts`
- Modify: `apps/web/src/types/lumyn.ts`

- [ ] **Step 1: Update edge function types**

In `supabase/functions/lumyn-chat/types.ts`, update the `LumynSafetyEvent` type and `ChatResponse`:

```ts
// Line 60 — extend LumynSafetyEvent union
export type LumynSafetyEvent = 'crisis_detected' | 'overreach_blocked' | 'escalation' | 'paywall_hit'

// Line 248 — add paywall field to ChatResponse
export type ChatResponse = {
  conversationId: string
  message: {
    id: string
    role: 'assistant'
    content: string
    created_at: string
  }
  mode: LumynMode
  classification: {
    intent: LumynIntent
    emotion: string
    domain: LumynDomain
  }
  client_directives: {
    crisis_banner: boolean
    anchor_active: boolean
  }
  paywall?: true
}
```

- [ ] **Step 2: Update client types**

In `apps/web/src/types/lumyn.ts`, add `paywall` to `ChatResponse` and export `LumynConversation` (needed by thread list):

```ts
export type LumynConversation = {
  id: string
  user_id: string
  title?: string
  mode: 'reflect' | 'illuminate' | 'anchor' | 'silent'
  status: string
  created_at: string
  ended_at?: string
}

export type ChatResponse = {
  conversationId: string
  message: {
    id: string
    role: 'assistant'
    content: string
    created_at: string
  }
  mode: LumynMode
  classification: {
    intent: LumynIntent
    emotion: string
    domain: LumynDomain
  }
  client_directives: {
    crisis_banner: boolean
    anchor_active: boolean
  }
  paywall?: true
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/lumyn-chat/types.ts apps/web/src/types/lumyn.ts
git commit -m "feat(lumyn-pro): add paywall field to ChatResponse types"
```

---

## Task 6: Orchestrator — entitlement gate + free-tier gates

**Files:**
- Modify: `supabase/functions/lumyn-chat/db.ts`
- Modify: `supabase/functions/lumyn-chat/orchestrator.ts`

### 6a: DB helpers

- [ ] **Step 1: Add `getUserEntitlement` and `resolveLumynEntitlement` to `db.ts`**

Add after the `createSupabaseClient` function:

```ts
// ─────────────────────────────────────────────
// Lumyn Pro entitlement
// ─────────────────────────────────────────────

export type LumynEntitlement = {
  lumyn_pro: boolean
  lumyn_pro_until: string | null
  lumyn_messages_used: number
}

export async function getUserEntitlement(
  supabase: SupabaseClient,
  userId: string
): Promise<LumynEntitlement> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('lumyn_pro, lumyn_pro_until, lumyn_messages_used')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    // No profile row → treat as free tier, 0 messages used
    return { lumyn_pro: false, lumyn_pro_until: null, lumyn_messages_used: 0 }
  }

  return {
    lumyn_pro: data.lumyn_pro ?? false,
    lumyn_pro_until: data.lumyn_pro_until ?? null,
    lumyn_messages_used: data.lumyn_messages_used ?? 0,
  }
}

/**
 * Single entitlement resolver — use everywhere, never duplicate this logic.
 */
export function resolveLumynEntitlement(entitlement: LumynEntitlement): boolean {
  return (
    entitlement.lumyn_pro &&
    (entitlement.lumyn_pro_until === null ||
      new Date(entitlement.lumyn_pro_until) > new Date())
  )
}
```

### 6b: Orchestrator changes

- [ ] **Step 2: Add imports to `orchestrator.ts`**

At the top of `orchestrator.ts`, find the existing `import { ... } from './db.ts'` block and add `getUserEntitlement` and `resolveLumynEntitlement` to it. The full updated import must enumerate all existing named exports — do not use a truncated `// ... existing imports ...` placeholder. The complete import after editing:

```ts
import {
  getOrCreateConversation,
  getOrCreateUserModel,
  getSessionHistory,
  getClaims,
  getRecentPatterns,
  getGuidingPrinciples,
  getMemorableMoments,
  insertMessage,
  logSafetyEvent,
  logMemoryOps,
  upsertRateLimit,
  closeStaleConversations,
  upsertClaim,
  deprecateClaim,
  getUserEntitlement,
  resolveLumynEntitlement,
} from './db.ts'
```

- [ ] **Step 3: Add entitlement gate before Step 1 (rate limit) in `runOrchestrator`**

Insert this block before the rate limit check at line 121:

```ts
  // ── Entitlement check ─────────────────────────────────────
  const entitlement = await getUserEntitlement(supabase, userId)
  const isPro = resolveLumynEntitlement(entitlement)

  if (!isPro) {
    // Atomic free-message increment — returns null if limit hit
    const { data: newCount } = await supabase.rpc('lumyn_increment_free_messages', {
      p_user_id: userId,
    })

    if (newCount === null) {
      // Paywall hit — log event and return paywall response
      await logSafetyEvent(supabase, {
        user_id: userId,
        event_type: 'paywall_hit',
        trigger_source: 'policy',
        details: {
          messages_used: entitlement.lumyn_messages_used,
          mode_requested: params.mode ?? 'reflect',
        },
      })

      return {
        conversationId: params.conversationId ?? 'no-conversation',
        message: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
        },
        mode: 'reflect',
        classification: { intent: 'explore', emotion: 'neutral', domain: 'general' },
        client_directives: { crisis_banner: false, anchor_active: false },
        paywall: true,
      }
    }
  }

  // ── Coerce mode for free users ─────────────────────────────
  // IMPORTANT: The orchestrator already declares `let effectiveMode` at line 279
  // for the crisis anchor override. We must also update the `mode` binding at line 118
  // (see note below) rather than introducing a second variable.
```

**Also edit line 118** — replace:
```ts
const mode: LumynMode = params.mode ?? 'reflect'
```
with:
```ts
// For free users, coerce to reflect mode regardless of what was requested
const mode: LumynMode = !isPro ? 'reflect' : (params.mode ?? 'reflect')
```

This ensures the coerced mode flows through all downstream uses of `mode` in the function:
- `getOrCreateConversation(supabase, userId, params.conversationId, mode)` — conversation stored with correct mode
- `buildFallbackResponse(RATE_LIMIT_MESSAGE, mode, conversationId)` — fallback uses correct mode
- `let effectiveMode = mode` at line 279 — crisis anchor override starts from the coerced mode

After making this edit, remove the `requestedMode` variable from Step 3 — the `mode` binding itself now carries the coercion:

```ts
  // (no separate requestedMode needed — mode is already coerced above)
```

- [ ] **Step 4: Strip context for free users**

The orchestrator currently destructures `vyberologyContext` from `params` at line 117:
```ts
const { supabase, userId, message, vyberologyContext } = params
```

**Edit line 117** to remove `vyberologyContext` from the destructure (to avoid a duplicate `const` binding error):
```ts
const { supabase, userId, message } = params
```

Then, after the entitlement gate block, declare the filtered version:

```ts
  // Strip reading history and user profile for free users
  const vyberologyContext = isPro
    ? params.vyberologyContext
    : params.vyberologyContext.filter(
        (i) => i.label !== 'ReadingHistory' && i.label !== 'UserProfile'
      )
```

This single `const vyberologyContext` is then used everywhere in the function body where `params.vyberologyContext` was previously referenced.

- [ ] **Step 5: Skip memory writes for free users**

In Step 8 (memory write), wrap the `processMemorableMoments` call and the memory suggestions loop:

```ts
  // Memory writes — Pro only
  if (isPro) {
    await processMemorableMoments(
      userId,
      conversationId,
      llmData.memorable_moments,
      [...sessionHistory, userMsg, assistantMsg],
      supabase
    )

    // ... existing memory suggestions loop ...
    if (memoryOps.length > 0) {
      await logMemoryOps(supabase, memoryOps)
    }
  }
```

Also skip `generateConversationSummary` for free users (already inside a `conversation.status === 'closed'` check — add `&& isPro` condition).

- [ ] **Step 6: Deploy**

```bash
supabase functions deploy lumyn-chat
```

- [ ] **Step 7: Smoke test**

Use curl or the live app as a free user. Send 11 messages. On the 11th:
```bash
curl -X POST <SUPABASE_URL>/functions/v1/lumyn-chat \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","vyberologyContext":[]}'
```
Expected response includes `"paywall": true`.

Also verify `lumyn_safety_events` has a row with `event_type = 'paywall_hit'`.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/lumyn-chat/db.ts supabase/functions/lumyn-chat/orchestrator.ts
git commit -m "feat(lumyn-pro): add entitlement gate and free-tier feature gates to orchestrator"
```

---

## Task 7: `useLumynEntitlement` hook

**Files:**
- Create: `apps/web/src/hooks/useLumynEntitlement.ts`

- [ ] **Step 1: Write the hook**

```ts
// apps/web/src/hooks/useLumynEntitlement.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type LumynEntitlement = {
  isPro: boolean
  messagesUsed: number
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useLumynEntitlement(): LumynEntitlement {
  const [isPro, setIsPro] = useState(false)
  const [messagesUsed, setMessagesUsed] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsPro(false)
        setMessagesUsed(0)
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('lumyn_pro, lumyn_pro_until, lumyn_messages_used')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error || !data) {
        setIsPro(false)
        setMessagesUsed(0)
        return
      }

      const resolvedPro =
        data.lumyn_pro &&
        (data.lumyn_pro_until === null || new Date(data.lumyn_pro_until) > new Date())

      setIsPro(resolvedPro)
      setMessagesUsed(data.lumyn_messages_used ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { isPro, messagesUsed, isLoading, refetch: fetch }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/useLumynEntitlement.ts
git commit -m "feat(lumyn-pro): add useLumynEntitlement hook"
```

---

## Task 8: Thread list component

**Files:**
- Create: `apps/web/src/components/LumynThreadList.tsx`

- [ ] **Step 1: Write the component**

```tsx
// apps/web/src/components/LumynThreadList.tsx
import { useEffect, useState, useCallback } from 'react'
import { Plus, MessageSquare, Crown } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import type { LumynConversation } from '@/types/lumyn'

interface Props {
  currentConversationId: string | undefined
  isPro: boolean
  onSelectThread: (conversation: LumynConversation) => void
  onNewThread: () => void
  onUpgrade: () => void
}

export function LumynThreadList({
  currentConversationId,
  isPro,
  onSelectThread,
  onNewThread,
  onUpgrade,
}: Props) {
  const [threads, setThreads] = useState<LumynConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const query = supabase
        .from('lumyn_conversations')
        .select('id, title, mode, status, created_at, ended_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!isPro) {
        query.limit(1)
      } else {
        query.limit(10)
      }

      const { data, error } = await query
      if (!error && data) setThreads(data as LumynConversation[])
    } finally {
      setIsLoading(false)
    }
  }, [isPro])

  useEffect(() => { loadThreads() }, [loadThreads])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="flex flex-col h-full">
      {/* New conversation button */}
      <button
        onClick={onNewThread}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-vy-charcoal hover:bg-vy-charcoal/5 transition-colors border-b border-vy-charcoal/10"
      >
        <Plus className="w-4 h-4" />
        New conversation
      </button>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-vy-charcoal/40">Loading…</div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-xs text-vy-charcoal/40">No conversations yet.</div>
        ) : (
          threads.map((thread) => {
            const title = thread.title || `Conversation · ${formatDate(thread.created_at)}`
            const isActive = thread.id === currentConversationId
            return (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`w-full text-left px-4 py-3 border-b border-vy-charcoal/[0.06] transition-colors hover:bg-vy-charcoal/5 ${
                  isActive ? 'bg-vy-gold/10' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <MessageSquare className="w-3 h-3 text-vy-charcoal/30 shrink-0" />
                  <span className="text-sm font-medium text-vy-charcoal truncate">{title}</span>
                </div>
                <div className="flex items-center gap-2 pl-5">
                  <span className="text-[10px] uppercase tracking-wide text-vy-charcoal/30">
                    {thread.mode}
                  </span>
                  <span className="text-[10px] text-vy-charcoal/30">·</span>
                  <span className="text-[10px] text-vy-charcoal/30">
                    {formatDate(thread.created_at)}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Pro upgrade banner — free users only */}
      {!isPro && (
        <div className="border-t border-vy-charcoal/10 p-4">
          <p className="text-xs text-vy-charcoal/50 mb-2">
            Unlock full conversation history with Pro.
          </p>
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 w-full justify-center py-2 rounded-lg bg-gradient-to-r from-vy-gold to-amber-500 text-white text-xs font-semibold"
          >
            <Crown className="w-3 h-3" />
            Upgrade to Lumyn Pro
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/LumynThreadList.tsx
git commit -m "feat(lumyn-pro): add LumynThreadList drawer component"
```

---

## Task 9: `LumynPaywallCard` component

**Files:**
- Create: `apps/web/src/components/LumynPaywallCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// apps/web/src/components/LumynPaywallCard.tsx
import { Crown } from 'lucide-react'
import { purchaseTier } from '@/services/purchase'
import { isNative } from '@/lib/platform'

const LUMYN_PRO_PRICE_ID = import.meta.env.VITE_LUMYN_PRO_PRICE_ID ?? ''

interface Props {
  onUpgradeStart?: () => void
}

export function LumynPaywallCard({ onUpgradeStart }: Props) {
  const handleUpgrade = async () => {
    onUpgradeStart?.()

    if (isNative()) {
      // Native subscription path is not yet enabled for Lumyn Pro
      // Show a message directing users to web
      alert('Please visit vyberology.com to upgrade to Lumyn Pro.')
      return
    }

    const result = await purchaseTier('lumyn-pro', {
      priceId: LUMYN_PRO_PRICE_ID,
      fullName: '',
      dob: '',
    })

    if (result.redirectUrl) {
      window.location.href = result.redirectUrl
    }
  }

  return (
    <div className="mx-2 my-1 rounded-2xl border border-vy-gold/30 bg-gradient-to-br from-vy-gold/5 to-amber-50/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-4 h-4 text-vy-gold shrink-0" />
        <span className="text-sm font-semibold text-vy-charcoal">
          You've used your 10 free messages with Lumyn.
        </span>
      </div>
      <p className="text-xs text-vy-charcoal/60 mb-3 pl-6">
        Upgrade to Pro for unlimited conversations, full memory, and all four modes — $14.97/month.
      </p>
      <button
        onClick={handleUpgrade}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vy-gold to-amber-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Upgrade to Lumyn Pro
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/LumynPaywallCard.tsx
git commit -m "feat(lumyn-pro): add LumynPaywallCard inline upsell component"
```

---

## Task 10: `LumynChatFab` — wire everything together

**Files:**
- Modify: `apps/web/src/components/LumynChatFab.tsx`

This is the largest UI change. Read the current file before editing (it's ~142 lines).

- [ ] **Step 1: Add imports**

Add at the top of `LumynChatFab.tsx`:

```tsx
import { MessageSquare } from 'lucide-react'
import { useLumynEntitlement } from '@/hooks/useLumynEntitlement'
import { LumynThreadList } from '@/components/LumynThreadList'
import { LumynPaywallCard } from '@/components/LumynPaywallCard'
import { supabase } from '@/integrations/supabase/client'
import { isNative } from '@/lib/platform'
import type { LumynConversation } from '@/types/lumyn'
```

- [ ] **Step 2: Add state for thread drawer and entitlement**

Inside `LumynChatFab`, add after the existing state declarations:

```tsx
  const { isPro, messagesUsed, refetch: refetchEntitlement } = useLumynEntitlement()
  const [showThreadList, setShowThreadList] = useState(false)
```

- [ ] **Step 3: Add thread-switching handler**

```tsx
  const handleSelectThread = async (conversation: LumynConversation) => {
    setShowThreadList(false)
    setIsProcessing(true)
    try {
      const { data: messages } = await supabase
        .from('lumyn_messages')
        .select('role, content')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (messages) {
        setChatMessages(messages as ChatMessage[])
      }
      setConversationId(conversation.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNewThread = () => {
    setShowThreadList(false)
    setChatMessages([])
    setConversationId(undefined)
    setShowCrisisBanner(false)
  }

  const handleUpgrade = async () => {
    const { purchaseTier } = await import('@/services/purchase')
    const priceId = import.meta.env.VITE_LUMYN_PRO_PRICE_ID ?? ''
    if (isNative()) {
      alert('Please visit vyberology.com to upgrade to Lumyn Pro.')
      return
    }
    const result = await purchaseTier('lumyn-pro', { priceId, fullName: '', dob: '' })
    if (result.redirectUrl) window.location.href = result.redirectUrl
  }
```

- [ ] **Step 4: Add `paywallHit` boolean state — do NOT use a sentinel string in `chatMessages`**

The `chatMessages` array is persisted to `localStorage`. Injecting a `__paywall__` sentinel string into it would survive page reload and reappear even after the user upgrades. Instead, track the paywall state separately:

Add new state:
```tsx
  const [paywallHit, setPaywallHit] = useState(false)
```

In `handleSend`, after `setConversationId(response.conversationId)`, add:

```tsx
      if (response.paywall) {
        setPaywallHit(true)
        return  // Do not append any message to chatMessages
      }
      // Clear paywall state if it was previously set and user is now Pro
      setPaywallHit(false)
```

The `LumynPaywallCard` is rendered conditionally based on `paywallHit` — see Step 5.

- [ ] **Step 5: Update the JSX**

Replace the chat panel header close button section with a version that includes the thread switcher:

```tsx
            {/* Panel header */}
            <div className="absolute -top-3 right-0 left-0 flex justify-between items-center px-1">
              {/* Thread list toggle */}
              <button
                onClick={() => setShowThreadList((prev) => !prev)}
                className="w-7 h-7 rounded-full bg-vy-charcoal text-vy-parchment flex items-center justify-center shadow-lg hover:bg-vy-charcoal/80 transition-colors"
                title="Conversations"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>

              {/* Free message counter */}
              {!isPro && (
                <span className="text-[10px] text-vy-charcoal/40 font-sans">
                  {messagesUsed} / 10 free messages
                </span>
              )}

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-vy-charcoal text-vy-parchment flex items-center justify-center shadow-lg hover:bg-vy-charcoal/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
```

In the `LumenChat` render, update the `messages` prop to render paywall cards for `__paywall__` content:

Pass `messages` through a mapper before handing to `LumenChat`, or handle it inside the LumenChat component. The simplest approach: filter paywall messages out of `LumenChat` and render `LumynPaywallCard` after the message list, outside `LumenChat`.

Add below `<LumenChat .../>`:

```tsx
            {/* Inline paywall card — shown when server returns paywall:true */}
            {paywallHit && (
              <LumynPaywallCard />
            )}
```

Add below the `LumenChat` block, the thread list overlay:

```tsx
            {/* Thread list drawer */}
            {showThreadList && (
              <div className="absolute inset-0 z-10 bg-vy-parchment rounded-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-vy-charcoal/10">
                  <span className="text-sm font-semibold text-vy-charcoal">Conversations</span>
                  <button
                    onClick={() => setShowThreadList(false)}
                    className="text-vy-charcoal/40 hover:text-vy-charcoal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <LumynThreadList
                  currentConversationId={conversationId}
                  isPro={isPro}
                  onSelectThread={handleSelectThread}
                  onNewThread={handleNewThread}
                  onUpgrade={handleUpgrade}
                />
              </div>
            )}
```

- [ ] **Step 6: Build and check types**

```bash
cd apps/web && npm run build 2>&1 | tail -30
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/LumynChatFab.tsx
git commit -m "feat(lumyn-pro): wire entitlement hook, thread switcher, paywall card into LumynChatFab"
```

---

## Task 11: PaymentSuccess page — Lumyn Pro flow

**Files:**
- Modify: `apps/web/src/pages/PaymentSuccess.tsx`

- [ ] **Step 1: Add `useLumynEntitlement` import and immediate re-fetch**

Add import:
```tsx
import { useLumynEntitlement } from '@/hooks/useLumynEntitlement'
```

Inside `PaymentSuccess`, add:
```tsx
  const { refetch: refetchEntitlement } = useLumynEntitlement()
  const upgraded = searchParams.get('upgraded') === 'true'

  useEffect(() => {
    if (upgraded) {
      refetchEntitlement()
    }
  }, [upgraded, refetchEntitlement])
```

- [ ] **Step 2: Add `lumyn-pro` tier label and Lumyn-specific UI**

Update `tierLabel`:
```tsx
  const tierLabel =
    tier === 'full-vybe'
      ? 'Full VYBE Reading'
      : tier === 'lyf-path'
        ? 'Lyf Path Reading'
        : tier === 'lumyn-pro'
          ? 'Lumyn Pro'
          : null
```

For the Lumyn Pro case, show subscription-appropriate copy instead of credits. Add a conditional block in the JSX:

```tsx
          {tier === 'lumyn-pro' ? (
            <>
              <p className="font-sans text-base font-light text-vy-charcoal/50 mb-8">
                Welcome to <span className="font-medium text-vy-charcoal/70">Lumyn Pro</span> — unlimited conversations, full memory, and all four modes are now active.
              </p>
              {/* What's Next — Lumyn Pro */}
              <div className="p-6 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-8 text-left">
                <h3 className="font-display text-lg font-semibold text-vy-charcoal mb-4">What's Next</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">Unlimited Lumyn conversations with full memory</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">All four modes: reflect, illuminate, anchor, silent</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">Reading history integrated into every conversation</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/vybe')}
                  className="flex-1 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all duration-200 cursor-pointer border-none"
                >
                  Open Lumyn
                </button>
              </div>
            </>
          ) : (
            // ... existing credit-based JSX blocks ...
          )}
```

- [ ] **Step 3: Add welcome toast**

Import `useToast`:
```tsx
import { useToast } from '@/components/ui/use-toast'
```

Add inside component:
```tsx
  const { toast } = useToast()

  useEffect(() => {
    if (upgraded && tier === 'lumyn-pro') {
      // Wait for entitlement re-fetch to settle
      const timer = setTimeout(() => {
        toast({
          title: 'Welcome to Lumyn Pro',
          description: 'Enjoy unlimited conversations.',
        })
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [upgraded, tier, toast])
```

- [ ] **Step 4: Build check**

```bash
cd apps/web && npm run build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/PaymentSuccess.tsx
git commit -m "feat(lumyn-pro): add Lumyn Pro upgrade flow to PaymentSuccess page"
```

---

## Task 12: Deploy and end-to-end verification

- [ ] **Step 1: Deploy all edge functions**

```bash
supabase functions deploy lumyn-chat stripe-webhook create-checkout-session validate-iap-receipt
```

- [ ] **Step 2: Set env vars**

In Vercel/hosting dashboard, set:
```
VITE_LUMYN_PRO_PRICE_ID=price_REAL_ID_HERE
```

In Supabase secrets:
```bash
supabase secrets set LUMYN_PRO_STRIPE_PRICE_ID=price_REAL_ID_HERE
```

- [ ] **Step 3: Replace placeholder Stripe IDs in migration**

Create a new migration or run directly:
```sql
UPDATE products SET stripe_product_id = 'prod_REAL_ID' WHERE stripe_product_id = 'prod_lumyn_pro';
UPDATE prices SET stripe_price_id = 'price_REAL_ID' WHERE stripe_price_id = 'price_lumyn_pro_monthly';
```

- [ ] **Step 4: Manual test — free tier**

1. Log in as a free user
2. Send 10 messages to Lumyn
3. On message 11: verify paywall card appears inline
4. Verify `lumyn_safety_events` has a `paywall_hit` row
5. Verify `user_profiles.lumyn_messages_used = 10`
6. Verify free message counter shows "10 / 10 free messages" in header

- [ ] **Step 5: Manual test — thread switcher**

1. Open Lumyn, send a message
2. Click the conversations icon (top-left of chat panel)
3. Verify thread list appears with current conversation
4. Click "New conversation" — verify chat clears
5. Send a message in new thread — verify new conversationId
6. Switch back to original thread — verify messages load

- [ ] **Step 6: Manual test — subscription checkout (Stripe test mode)**

1. Click "Upgrade to Lumyn Pro" from paywall card
2. Verify Stripe checkout shows recurring billing at $14.97/month
3. Complete with test card `4242 4242 4242 4242`
4. Verify redirect to `/payment/success?upgraded=true&tier=lumyn-pro`
5. Verify welcome toast appears
6. Verify `user_profiles.lumyn_pro = true`
7. Return to Lumyn chat — verify paywall is gone, memory features work

- [ ] **Step 7: Final commit and push**

```bash
git push origin feat/lumyn-intelligence-layer
```

Update the open PR (#26) to include this work, or create a new PR for the Pro subscription branch.
