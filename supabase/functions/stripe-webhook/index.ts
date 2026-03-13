/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment and subscription updates
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );

    console.log(`Received event: ${event.type}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent, supabase);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent, supabase);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  console.log(`Checkout completed for user ${userId}`);

  // If this was a subscription checkout, the subscription webhook will handle it
  // For one-time payments, we handle it in payment_intent.succeeded
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  const userId = paymentIntent.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in payment intent metadata');
    return;
  }

  console.log(`Payment succeeded for user ${userId}, amount: ${paymentIntent.amount}`);

  // Idempotency check — skip if this payment was already processed
  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (existingPurchase) {
    console.log(`Payment ${paymentIntent.id} already processed, skipping`);
    return;
  }

  const credits = calculateCreditsFromAmount(paymentIntent.amount);

  // Record the purchase
  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: userId,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: paymentIntent.customer,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: 'succeeded',
    metadata: paymentIntent.metadata,
  });

  if (purchaseError) {
    console.error('Error recording purchase:', purchaseError);
    return;
  }

  // Add reading credits to the user's account
  if (credits > 0) {
    const { error: creditsError } = await supabase.rpc('add_reading_credits', {
      p_user_id: userId,
      p_credits: credits,
    });

    if (creditsError) {
      console.error('Error adding credits:', creditsError);
    } else {
      console.log(`Added ${credits} credits to user ${userId}`);
    }
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  const userId = paymentIntent.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in payment intent metadata');
    return;
  }

  console.log(`Payment failed for user ${userId}`);

  // Record the failed purchase
  await supabase.from('purchases').insert({
    user_id: userId,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: paymentIntent.customer,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: 'failed',
    metadata: paymentIntent.metadata,
  });
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: any
) {
  // Get user_id from customer metadata
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;

  if (!userId) {
    console.error('No supabase_user_id in customer metadata');
    return;
  }

  // Get the price info
  const priceId = subscription.items.data[0]?.price.id;

  // Find our internal price record
  const { data: priceData } = await supabase
    .from('prices')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single();

  // Upsert subscription
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    price_id: priceData?.id,
    quantity: subscription.items.data[0]?.quantity || 1,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    metadata: subscription.metadata,
  });

  console.log(`Updated subscription ${subscription.id} for user ${userId}`);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  // Update subscription status in database
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Deleted subscription ${subscription.id}`);
}

/**
 * Calculate reading credits based on payment amount
 * Customize this based on your pricing tiers
 */
function calculateCreditsFromAmount(amountCents: number): number {
  // $9.97 = 1 lite reading (no credits, direct use)
  // $19.97 = 1 standard reading (no credits, direct use)
  // $39.97 = 1 deep reading (no credits, direct use)
  // $49.97 = 5 credits
  // $89.97 = 10 credits
  // $199.97 = 25 credits

  const amounts: Record<number, number> = {
    997: 1,    // $9.97 = 1 credit (lite)
    1997: 1,   // $19.97 = 1 credit (standard)
    3997: 1,   // $39.97 = 1 credit (deep)
    4997: 5,   // $49.97 = 5 credits
    8997: 10,  // $89.97 = 10 credits
    19997: 25, // $199.97 = 25 credits
  };

  return amounts[amountCents] || 0;
}
