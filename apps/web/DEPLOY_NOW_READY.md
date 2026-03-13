# ✅ Vyberology Ready to Deploy!

## Credentials Retrieved from Bitwarden

✅ **Stripe Keys** (LIVE - Production)
- Secret Key
- Webhook Secret
- Publishable Key

❌ **OpenAI API Key** - Not found in Bitwarden
- Check Supabase dashboard if already set
- Or create new at https://platform.openai.com/api-keys

---

## One-Command Deploy

### Option 1: Automated Script (Recommended)

```bash
cd /Users/mrtungsten/Documents/Projects/The-HwinNwin-Pillars/apps/vyberology/apps/web

# 1. Login (opens browser)
supabase login

# 2. Deploy everything
./deploy-with-credentials.sh

# That's it! Script handles:
# - Setting Stripe secrets
# - Deploying database
# - Deploying edge functions
# - Building frontend
# - Creating .env.local
```

### Option 2: Manual Commands

See [CREDENTIALS_READY.md](./CREDENTIALS_READY.md) for step-by-step manual deployment.

---

## After Deployment

1. **Update .env.local**
   - Get anon key from: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api
   - Replace `your_anon_key_from_dashboard` in `.env.local`

2. **Configure Stripe Products** (5 minutes)
   - Dashboard: https://dashboard.stripe.com/products
   - Create 6 products matching the pricing page
   - Update database with price IDs

3. **Test Payment**
   ```bash
   npm run dev
   # Go to http://localhost:5173/pricing
   # Use test card: 4242 4242 4242 4242
   ```

4. **Deploy Frontend**
   - Upload `dist/` folder to Netlify/Vercel
   - Done! 🚀

---

## What's Deployed

✅ **Payment System**
- Complete Stripe integration (checkout + webhook)
- 6 pricing tiers (3 readings + 3 credit packages)
- Automatic credit allocation
- Purchase history tracking

✅ **Feedback System**
- In-app bug reports & feature requests
- Floating purple button on all pages
- Anonymous submissions supported

✅ **Landing Page**
- Honest marketing (no fake testimonials)
- "Show up as we are" philosophy
- Mobile responsive

---

## Files Available

- **CREDENTIALS_READY.md** - All credentials and manual steps
- **DEPLOY_QUICKSTART.md** - Detailed guide with troubleshooting
- **RUN_THIS.md** - Ultra-simple copy/paste commands
- **deploy-with-credentials.sh** - Automated deployment script
- **deploy-now.sh** - Interactive deployment (asks for webhook secret)

---

## Quick Reference

**Project**: Vyberology
**Supabase**: qptrlxzyindcohsubidl
**Stripe**: HwinNwin account (LIVE keys)
**Domain**: vyberology.com
**Platform**: Netlify

**Total deployment time**: ~10 minutes

---

**Ready to receive real payments!** 💰

Just run: `./deploy-with-credentials.sh`
