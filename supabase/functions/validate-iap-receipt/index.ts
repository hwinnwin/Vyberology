import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Map RevenueCat product IDs to credit amounts
const PRODUCT_CREDITS: Record<string, number> = {
  'com.vyberology.lyf_path': 1,
  'com.vyberology.full_vybe': 1,
  'com.vyberology.deep_attunement': 1,
};

// Subscription product IDs that grant Lumyn Pro
const SUBSCRIPTION_PRODUCTS = new Set(['com.vyberology.lumyn_pro'])

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await req.json();
    const event = payload.event;
    const eventId = event?.id;
    const eventType = event?.type;

    if (!eventId || !eventType) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Idempotency check
    const { data: existing } = await supabase
      .from('iap_webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Record event
    const appUserId = event.app_user_id;
    await supabase.from('iap_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      user_id: appUserId,
      payload,
    });

    // Only process purchase events for consumables
    if (eventType === 'INITIAL_PURCHASE' || eventType === 'NON_RENEWING_PURCHASE') {
      const productId = event.product_id;
      const credits = PRODUCT_CREDITS[productId] ?? 0;

      if (credits > 0 && appUserId) {
        // Grant credits
        await supabase.rpc('add_reading_credits', {
          p_user_id: appUserId,
          p_credits: credits,
        });

        // Record in credit transaction ledger
        const platform = event.store === 'APP_STORE' ? 'apple' : 'google';
        await supabase.from('credit_transactions').insert({
          user_id: appUserId,
          amount: credits,
          source: platform,
          source_transaction_id: event.transaction_id,
        });

        // Record purchase
        await supabase.from('purchases').insert({
          user_id: appUserId,
          platform,
          platform_transaction_id: event.transaction_id,
          amount: event.price_in_purchased_currency ?? 0,
          currency: event.currency ?? 'USD',
          status: 'completed',
          tier: productId,
        });
      }
    }

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

    // Handle refunds (skip credit deduction for subscription products)
    if (eventType === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT' && !SUBSCRIPTION_PRODUCTS.has(event.product_id)) {
      if (appUserId) {
        await supabase.from('credit_transactions').insert({
          user_id: appUserId,
          amount: -1,
          source: event.store === 'APP_STORE' ? 'apple' : 'google',
          source_transaction_id: event.transaction_id,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('IAP webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
