# Vyberology Deployment - Manual Steps

**Issue**: Both Supabase and Stripe CLIs require browser authentication
**Solution**: Manual deployment with copy/paste commands
**Time**: 15 minutes

---

## ✅ What We Have

From Bitwarden:
- ✅ Stripe Secret Key (LIVE)
- ✅ Stripe Webhook Secret (LIVE)
- ✅ Stripe Publishable Key (LIVE)
- ✅ Webhook already configured at vyberology.com
- ❌ OpenAI API Key (needs creation or check Supabase dashboard)

---

## Step 1: Login to Supabase (2 minutes)

Open your browser and login:
1. Go to https://supabase.com/dashboard/project/qptrlxzyindcohsubidl
2. Click **Settings** → **Functions** → **Manage secrets**

---

## Step 2: Set Secrets in Supabase Dashboard (3 minutes)

Add these environment variables for Edge Functions:

### Required Secrets

```
STRIPE_SECRET_KEY
<your-stripe-secret-key-from-bitwarden>

STRIPE_WEBHOOK_SECRET
<your-stripe-webhook-secret-from-bitwarden>
```

### Optional (if you have it)

```
OPENAI_API_KEY
sk-proj-YOUR_KEY_HERE
```

**Or create new OpenAI key**: https://platform.openai.com/api-keys

---

## Step 3: Deploy Database Migrations (CLI Required)

Open terminal:

```bash
cd /Users/mrtungsten/Documents/Projects/The-HwinNwin-Pillars/apps/vyberology/apps/web

# Login to Supabase (opens browser - do this once)
supabase login

# Deploy database schema
supabase db push --linked --project-ref qptrlxzyindcohsubidl
```

**What this deploys**:
- `products` - 6 pricing tiers
- `prices` - Stripe price IDs
- `customers` - User-Stripe mapping
- `purchases` - Transaction history
- `reading_credits` - Credit balances
- `feedback` - Bug reports & feature requests

---

## Step 4: Deploy Edge Functions (5 minutes)

Still in terminal:

```bash
# Deploy checkout session creator
supabase functions deploy create-checkout-session --project-ref qptrlxzyindcohsubidl

# Deploy webhook handler
supabase functions deploy stripe-webhook --project-ref qptrlxzyindcohsubidl

# Verify deployment
supabase functions list --project-ref qptrlxzyindcohsubidl
```

---

## Step 5: Update Frontend .env (1 minute)

Create `.env.local` in the web app directory:

```bash
# Get anon key from: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api

cat > .env.local <<'EOF'
VITE_SUPABASE_URL=https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_from_dashboard
VITE_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
EOF
```

Replace `your_anon_key_from_dashboard` with the real value.

---

## Step 6: Build Frontend (1 minute)

```bash
npm run build
```

---

## Step 7: Configure Stripe Products (5 minutes)

### Option A: Use Existing Products (if already created)

1. Go to https://dashboard.stripe.com/products
2. Copy price IDs for each product
3. Update database:

```sql
-- In Supabase SQL Editor
UPDATE prices SET stripe_price_id = 'price_XXX' WHERE id = 'lite';
UPDATE prices SET stripe_price_id = 'price_XXX' WHERE id = 'standard';
UPDATE prices SET stripe_price_id = 'price_XXX' WHERE id = 'deep';
UPDATE prices SET stripe_price_id = 'price_XXX' WHERE id = 'credits_5';
UPDATE prices SET stripe_price_id = 'price_XXX' WHERE id = 'credits_10';
UPDATE prices SET stripe_price_id = 'price_XXX' WHERE id = 'credits_25';
```

### Option B: Create New Products

Go to https://dashboard.stripe.com/products and create:

**Individual Readings**:
1. **Lite Reading** - $9.97 one-time (1 credit)
2. **Standard Reading** - $19.97 one-time (2 credits)
3. **Deep Reading** - $39.97 one-time (5 credits)

**Credit Packages**:
4. **5 Credits** - $49.97 one-time
5. **10 Credits** - $89.97 one-time
6. **25 Credits** - $199.97 one-time

Then update database with price IDs (see Option A).

---

## Step 8: Verify Webhook Configuration

According to Bitwarden, webhook is already configured at:
- **URL**: `https://vyberology.com/api/webhooks/stripe`
- **Secret**: `<your-stripe-webhook-secret>`

**But** our Supabase edge function is at:
- `https://qptrlxzyindcohsubidl.supabase.co/functions/v1/stripe-webhook`

### Update Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Find existing webhook for vyberology.com
3. **Update URL to**: `https://qptrlxzyindcohsubidl.supabase.co/functions/v1/stripe-webhook`
4. Or create new webhook with:
   - URL: `https://qptrlxzyindcohsubidl.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy new webhook secret
6. Update in Supabase: Settings → Functions → Secrets → `STRIPE_WEBHOOK_SECRET`

---

## Step 9: Test Payment (2 minutes)

```bash
npm run dev
```

1. Open http://localhost:5173/pricing
2. Click "Get Started" on any tier
3. Use test card: **4242 4242 4242 4242**
4. Complete checkout
5. Verify redirect to `/payment/success`
6. Check credits added:

```sql
-- In Supabase SQL Editor
SELECT * FROM reading_credits WHERE user_id = 'YOUR_USER_ID';
```

---

## Step 10: Deploy Frontend

Deploy the `dist/` folder to your hosting platform:

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## Verification Checklist

- [ ] Supabase secrets set (Stripe + OpenAI)
- [ ] Database migrations deployed
- [ ] Edge functions deployed (create-checkout-session, stripe-webhook)
- [ ] `.env.local` created with correct values
- [ ] Frontend builds without errors
- [ ] Stripe products created with price IDs
- [ ] Price IDs updated in database
- [ ] Webhook endpoint updated to Supabase function URL
- [ ] Test payment successful
- [ ] Credits automatically added after payment
- [ ] Feedback button visible on all pages
- [ ] Frontend deployed to production

---

## Quick Commands Summary

```bash
# Step 1: Supabase login
supabase login

# Step 3: Deploy database
supabase db push --linked --project-ref qptrlxzyindcohsubidl

# Step 4: Deploy functions
supabase functions deploy create-checkout-session --project-ref qptrlxzyindcohsubidl
supabase functions deploy stripe-webhook --project-ref qptrlxzyindcohsubidl

# Step 6: Build
npm run build

# Step 9: Test locally
npm run dev

# Step 10: Deploy (choose one)
netlify deploy --prod --dir=dist
# or
vercel --prod
```

---

## Troubleshooting

### "Cannot find project ref"
```bash
supabase link --project-ref qptrlxzyindcohsubidl
```

### "Your account does not have necessary privileges"
- Verify you're logged into the correct Supabase account
- Check project access in dashboard

### Webhook not receiving events
- Verify URL is correct in Stripe dashboard
- Check edge function logs: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/functions
- Verify `STRIPE_WEBHOOK_SECRET` matches in Supabase

### Credits not added after payment
- Check Stripe webhook events: https://dashboard.stripe.com/webhooks
- Check edge function logs in Supabase
- Verify metadata is being passed in checkout session

---

## Support Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Webhooks**: https://dashboard.stripe.com/webhooks
- **Stripe Products**: https://dashboard.stripe.com/products

---

**Total Time**: ~15 minutes
**Status**: Ready to deploy!

Once completed, Vyberology will be live and accepting payments! 💰
