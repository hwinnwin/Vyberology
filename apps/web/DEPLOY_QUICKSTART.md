# Vyberology Deployment Quickstart

**Status**: Ready to deploy
**Time**: 15-20 minutes
**Location**: `/apps/vyberology/apps/web`

## Quick Deploy (3 Steps)

### Step 1: Authenticate (2 minutes)

```bash
cd /Users/mrtungsten/Documents/Projects/The-HwinNwin-Pillars/apps/vyberology/apps/web

# Login to Supabase (opens browser)
supabase login

# Unlock Bitwarden
bw unlock
# Copy the BW_SESSION export command it gives you and run it
# Should look like: export BW_SESSION="..."
```

### Step 2: Get Credentials & Deploy (5 minutes)

```bash
# Get credentials from Bitwarden and deploy everything
./get-credentials.sh

# Or if you prefer manual:
# 1. Get Stripe secret key
STRIPE_KEY=$(bw list items --search "stripe" | jq -r '.[0].login.password // .[0].notes')
echo "Stripe key: ${STRIPE_KEY:0:20}..."

# 2. Get OpenAI key
OPENAI_KEY=$(bw list items --search "openai" | jq -r '.[0].login.password // .[0].notes')
echo "OpenAI key: ${OPENAI_KEY:0:20}..."

# 3. Get webhook secret from Stripe Dashboard
# Go to: https://dashboard.stripe.com/webhooks
# Create webhook pointing to: https://qptrlxzyindcohsubidl.supabase.co/functions/v1/stripe-webhook
# Copy the webhook secret (whsec_...)
```

### Step 3: Deploy (8-10 minutes)

```bash
# Set secrets in Supabase
supabase secrets set \
  STRIPE_SECRET_KEY="$STRIPE_KEY" \
  OPENAI_API_KEY="$OPENAI_KEY" \
  STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET" \
  --project-ref qptrlxzyindcohsubidl

# Deploy database migrations
supabase db push --linked --project-ref qptrlxzyindcohsubidl

# Deploy edge functions
supabase functions deploy create-checkout-session --project-ref qptrlxzyindcohsubidl
supabase functions deploy stripe-webhook --project-ref qptrlxzyindcohsubidl

# Verify deployment
supabase functions list --project-ref qptrlxzyindcohsubidl

# Build frontend
npm run build
```

## What Gets Deployed

✅ **Database**:
- `products` - 6 pricing tiers
- `prices` - Stripe price IDs
- `customers` - User-Stripe mapping
- `purchases` - Transaction history
- `reading_credits` - Credit balances
- `feedback` - User feedback system

✅ **Edge Functions**:
- `create-checkout-session` - Handles payment initiation
- `stripe-webhook` - Processes Stripe events, adds credits

✅ **Frontend**:
- `/pricing` - 6 pricing tiers
- `/payment/success` - Confirmation page
- `/payment/cancel` - Cancellation handling
- `/landing` - Marketing page
- Feedback button on all pages

## After Deployment

### 1. Configure Stripe Products (5 minutes)

Go to [Stripe Dashboard](https://dashboard.stripe.com/products) and create 6 products:

**Individual Readings:**
- Lite Reading - $9.97 (1 credit)
- Standard Reading - $19.97 (2 credits)
- Deep Reading - $39.97 (5 credits)

**Credit Packages:**
- 5 Credits - $49.97
- 10 Credits - $89.97
- 25 Credits - $199.97

For each product:
1. Create product
2. Add price ($X.XX one-time payment)
3. Copy the price ID (starts with `price_`)
4. Update database:
   ```sql
   UPDATE prices
   SET stripe_price_id = 'price_YOUR_ID_HERE'
   WHERE id = 'lite' -- or standard, deep, credits_5, credits_10, credits_25
   ```

### 2. Configure Stripe Webhook (2 minutes)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://qptrlxzyindcohsubidl.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy signing secret (whsec_...)
6. Update Supabase secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..." --project-ref qptrlxzyindcohsubidl
   ```

### 3. Update Frontend .env (1 minute)

Create `/apps/web/.env.local`:

```bash
VITE_SUPABASE_URL=https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

Get Stripe publishable key from: https://dashboard.stripe.com/apikeys

### 4. Test Payment Flow (3 minutes)

```bash
npm run dev
```

1. Go to http://localhost:5173/pricing
2. Click "Get Started" on any tier
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Should redirect to /payment/success
6. Check your credits are added:
   ```sql
   SELECT * FROM reading_credits WHERE user_id = 'YOUR_USER_ID';
   ```

## Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

Any future date, any CVC, any ZIP.

## Verification Checklist

- [ ] Supabase authenticated
- [ ] Bitwarden unlocked
- [ ] Secrets set in Supabase
- [ ] Database migrations deployed
- [ ] Edge functions deployed
- [ ] Frontend builds without errors
- [ ] Stripe products created with price IDs
- [ ] Stripe webhook configured
- [ ] .env.local updated with publishable key
- [ ] Test payment successful
- [ ] Credits added automatically
- [ ] Feedback button visible on all pages

## Troubleshooting

**"Cannot find project ref"**
- Run: `supabase link --project-ref qptrlxzyindcohsubidl`

**"Your account does not have necessary privileges"**
- Check you're logged into the correct Supabase account
- Verify project access in Supabase dashboard

**"Invalid master password" (Bitwarden)**
- Run: `bw unlock` and enter password manually
- Copy/paste the export command it gives you

**Functions not deploying**
- Check Docker is running: `docker ps`
- Try: `supabase functions deploy --debug`

**Credits not added after payment**
- Check webhook is receiving events in Stripe Dashboard
- Check Supabase Edge Function logs
- Verify STRIPE_WEBHOOK_SECRET is set correctly

## Quick Commands Reference

```bash
# Check deployment status
supabase functions list --project-ref qptrlxzyindcohsubidl
supabase db remote shell --project-ref qptrlxzyindcohsubidl

# View logs
supabase functions logs create-checkout-session --project-ref qptrlxzyindcohsubidl
supabase functions logs stripe-webhook --project-ref qptrlxzyindcohsubidl

# Test database connection
supabase db remote shell --project-ref qptrlxzyindcohsubidl
\dt products prices customers purchases reading_credits feedback
\q

# Rebuild and deploy
npm run build
# Then deploy build to your hosting platform
```

## Support

- Stripe Docs: https://stripe.com/docs/payments/checkout
- Supabase Docs: https://supabase.com/docs/guides/functions
- Vyberology Setup: [PAYMENT_SETUP.md](./PAYMENT_SETUP.md)

---

**Ready to receive payments!** Follow these 3 steps and Vyberology will be live.
