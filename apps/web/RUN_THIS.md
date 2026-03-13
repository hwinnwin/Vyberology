# Deploy Vyberology Now

## Copy/Paste These Commands

```bash
cd /Users/mrtungsten/Documents/Projects/The-HwinNwin-Pillars/apps/vyberology/apps/web

# Step 1: Authenticate (30 seconds)
supabase login  # Opens browser
bw unlock       # Enter password, then copy/paste the export command

# Step 2: Deploy everything (5 minutes)
./deploy-now.sh

# Done! Now just configure Stripe products and test.
```

## That's It

The script will:
1. ✅ Get credentials from Bitwarden
2. ✅ Set secrets in Supabase
3. ✅ Deploy database schema (products, prices, purchases, credits, feedback)
4. ✅ Deploy edge functions (checkout + webhook)
5. ✅ Build frontend
6. ✅ Verify deployment

Then you just need to:
- Configure Stripe products (see [DEPLOY_QUICKSTART.md](./DEPLOY_QUICKSTART.md))
- Test a payment
- Deploy the frontend build

**Total time: ~15 minutes**

---

Having issues? See [DEPLOY_QUICKSTART.md](./DEPLOY_QUICKSTART.md) for detailed steps.
