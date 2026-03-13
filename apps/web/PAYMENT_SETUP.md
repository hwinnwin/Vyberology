# Vyberology Payment Setup Guide

Complete guide for setting up Stripe payments in Vyberology.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Stripe Account Setup](#stripe-account-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Migration](#database-migration)
5. [Edge Function Deployment](#edge-function-deployment)
6. [Product & Pricing Configuration](#product--pricing-configuration)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

---

## Prerequisites

- Stripe account (free to create at [stripe.com](https://stripe.com))
- Supabase project with database access
- Node.js and npm installed
- Supabase CLI installed (`npm install -g supabase`)

---

## Stripe Account Setup

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete business verification (for production)
3. Navigate to **Developers → API keys**

### 2. Get API Keys

You'll need two types of keys:

**Test Mode** (for development):
- **Publishable key**: `pk_test_...`
- **Secret key**: `sk_test_...`

**Live Mode** (for production):
- **Publishable key**: `pk_live_...`
- **Secret key**: `sk_live_...`

### 3. Create Webhook Endpoint

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your Supabase function URL:
   ```
   https://[your-project-ref].supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook signing secret** (starts with `whsec_...`)

---

## Environment Configuration

### Frontend Environment Variables

Update `/apps/web/.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# Stripe Configuration (Frontend - Publishable Key Only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Optional
VITE_SENTRY_DSN=your_sentry_dsn
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

### Backend Secrets (Supabase)

Set these secrets in Supabase (NEVER commit to git):

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
supabase secrets set OPENAI_API_KEY=sk-proj-your_openai_key

# Verify secrets are set
supabase secrets list
```

---

## Database Migration

### Apply Payment Schema

The payment schema is located at `/apps/web/supabase/migrations/20250111_payments_schema.sql`

**Apply migration:**

```bash
cd /apps/web

# Apply to local development
supabase db reset

# Apply to remote production
supabase db push --linked
```

### Verify Tables Created

Check that these tables exist:
- `products`
- `prices`
- `customers`
- `subscriptions`
- `purchases`
- `reading_credits`

```bash
# Connect to database
supabase db remote shell

# List tables
\dt

# Exit
\q
```

---

## Edge Function Deployment

### Deploy Payment Functions

Deploy the two payment-related edge functions:

```bash
cd /apps/web

# Deploy create-checkout-session function
supabase functions deploy create-checkout-session

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook

# Verify deployment
supabase functions list
```

### Test Functions

**Test checkout session creation:**

```bash
curl -X POST \
  https://[your-project].supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer [your-supabase-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_test_12345",
    "quantity": 1
  }'
```

**Test webhook (use Stripe CLI):**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local function
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

---

## Product & Pricing Configuration

### Option 1: Use Default Seed Data

The migration includes default products and prices. Update them in Stripe:

1. Go to **Stripe Dashboard → Products**
2. Create products matching the seed data:
   - Lite Reading ($9.97)
   - Standard Reading ($19.97)
   - Deep Reading ($39.97)
   - 5 Reading Credits ($49.97)
   - 10 Reading Credits ($89.97)
   - 25 Reading Credits ($199.97)

3. Copy the Stripe `price_id` for each product
4. Update the database:

```sql
-- Update price IDs in Supabase SQL Editor
UPDATE prices
SET stripe_price_id = 'price_1ABC...'
WHERE stripe_price_id = 'price_lite';

-- Repeat for all prices
```

### Option 2: Create Products via Stripe API

Use the Stripe dashboard or API to create products, then update your database to match.

---

## Testing

### Test Mode Workflow

1. **Use Test Cards**:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/34)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```

2. **Test Payment Flow**:
   - Navigate to `/pricing`
   - Click "Get Reading" or "Buy Credits"
   - Complete checkout with test card
   - Verify redirect to `/payment/success`
   - Check credits added to account

3. **Verify Webhook Events**:
   ```bash
   # View Stripe webhook logs
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

   # View Supabase function logs
   supabase functions logs stripe-webhook
   ```

4. **Check Database**:
   ```sql
   -- View customers
   SELECT * FROM customers;

   -- View purchases
   SELECT * FROM purchases ORDER BY created_at DESC;

   -- View credits
   SELECT * FROM reading_credits;
   ```

### Test Failed Payments

Use Stripe test cards for specific scenarios:

- **Declined**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **3D Secure**: `4000 0027 6000 3184`

---

## Production Deployment

### Checklist

- [ ] Switch to Stripe **Live Mode** API keys
- [ ] Update `STRIPE_SECRET_KEY` secret to live key
- [ ] Update `VITE_STRIPE_PUBLISHABLE_KEY` to live key
- [ ] Update webhook endpoint to production URL
- [ ] Set `STRIPE_WEBHOOK_SECRET` to live webhook secret
- [ ] Update product prices in Stripe dashboard
- [ ] Update `stripe_price_id` in database to match live prices
- [ ] Test one live transaction (use real card or refund immediately)
- [ ] Enable Stripe fraud detection
- [ ] Set up Stripe email receipts
- [ ] Configure tax collection (if applicable)

### Production Environment Variables

```env
# Production .env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_production_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
VITE_APP_ENV=production
```

### Production Secrets

```bash
# Set production secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_live_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
supabase secrets set OPENAI_API_KEY=sk-proj-your_openai_key

# Deploy functions to production
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

---

## Monitoring & Maintenance

### Monitor Payments

1. **Stripe Dashboard**:
   - Monitor payments in real-time
   - View failed payments
   - Check dispute/chargeback alerts

2. **Supabase Dashboard**:
   - Monitor edge function invocations
   - Check function logs for errors
   - Review database growth

3. **Error Tracking**:
   - Use Sentry for frontend errors
   - Monitor webhook delivery in Stripe
   - Set up alerts for failed payments

### Troubleshooting

**Issue: Checkout session creation fails**
- Check that user is authenticated
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Supabase function logs

**Issue: Webhook not receiving events**
- Verify webhook URL is correct
- Check webhook signing secret
- Review Stripe webhook logs
- Ensure edge function is deployed

**Issue: Credits not added after payment**
- Check webhook event was received
- Verify `add_reading_credits` function executed
- Check database triggers
- Review Supabase function logs

---

## Security Best Practices

1. **Never expose secret keys**:
   - Keep `STRIPE_SECRET_KEY` in Supabase secrets only
   - Never commit secrets to git
   - Use environment variables for configuration

2. **Validate webhook signatures**:
   - Always verify webhook signatures (already implemented)
   - Reject unsigned requests

3. **Use Row Level Security (RLS)**:
   - RLS policies are already configured
   - Users can only see their own data

4. **Monitor for fraud**:
   - Enable Stripe Radar
   - Set up alerts for suspicious activity
   - Review chargebacks regularly

5. **Test regularly**:
   - Test payment flow monthly
   - Verify webhook delivery
   - Check credit allocation

---

## Support Resources

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe CLI**: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Supabase Functions**: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **Test Cards**: [stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## Quick Reference

### Pricing Overview

| Product | Price | Credits | Type |
|---------|-------|---------|------|
| Lite Reading | $9.97 | 1 | One-time |
| Standard Reading | $19.97 | 1 | One-time |
| Deep Reading | $39.97 | 1 | One-time |
| 5 Credits | $49.97 | 5 | One-time |
| 10 Credits | $89.97 | 10 | One-time |
| 25 Credits | $199.97 | 25 | One-time |

### Key Files

- **Migration**: `/apps/web/supabase/migrations/20250111_payments_schema.sql`
- **Checkout Function**: `/apps/web/supabase/functions/create-checkout-session/index.ts`
- **Webhook Function**: `/apps/web/supabase/functions/stripe-webhook/index.ts`
- **Pricing Page**: `/apps/web/src/pages/Pricing.tsx`
- **Stripe Service**: `/apps/web/src/services/stripe.ts`
- **Success Page**: `/apps/web/src/pages/PaymentSuccess.tsx`
- **Cancel Page**: `/apps/web/src/pages/PaymentCancel.tsx`

### Useful Commands

```bash
# View function logs
supabase functions logs stripe-webhook --tail

# Test webhook locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# View database
supabase db remote shell

# Deploy all functions
supabase functions deploy
```

---

**Last Updated**: 2025-01-11
**Version**: 1.0.0
**Status**: Ready for Testing
