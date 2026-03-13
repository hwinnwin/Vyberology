# 🚨 FIX VYBEROLOGY.COM (Vercel)

## Problem

**Site is completely broken** because it's deployed with placeholder environment variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co  ❌
VITE_SUPABASE_ANON_KEY=your_publishable_key_here  ❌
```

The frontend can't connect to Supabase, so **nothing works**.

---

## Option 1: Automated Fix (CLI - 2 minutes)

### Step 1: Get Supabase Anon Key

Go to: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api

Copy the **anon/public** key (starts with `eyJhbGc...`)

### Step 2: Run Fix Script

```bash
cd /Users/mrtungsten/Documents/Projects/The-HwinNwin-Pillars/apps/vyberology/apps/web

# Set the anon key
export SUPABASE_ANON_KEY='paste_your_key_here'

# Run the fix
./VERCEL_QUICKFIX.sh
```

**Done!** The script will:
1. Set all environment variables in Vercel
2. Deploy the site with correct config
3. Site should be working in ~2 minutes

---

## Option 2: Manual Fix via Vercel Dashboard (5 minutes)

### Step 1: Get Supabase Anon Key

Go to: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api

Copy the **anon/public** key (starts with `eyJhbGc...`)

### Step 2: Configure Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Find **Vyberology** project
3. Click **Settings** → **Environment Variables**
4. Add these variables (for **Production** environment):

```
VITE_SUPABASE_URL = https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY = [paste from dashboard]
VITE_SUPABASE_PROJECT_ID = qptrlxzyindcohsubidl
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_51SGaypKQHOT2DNgNdJJ0nZNP2zL7iK3Gb4D3ai4L6poMV6CD0mRSvNIfDpdbA3nXhgP0avW4jPlOsUXZKkuBy50s00unH0hCzd
VITE_APP_VERSION = 1.0.0
VITE_APP_ENV = production
VITE_V4_ENABLED = false
```

### Step 3: Redeploy

In Vercel dashboard:
- Go to **Deployments** tab
- Find the latest deployment
- Click **⋯** → **Redeploy**

Or via CLI:
```bash
vercel --prod
```

---

## Option 3: Quick Manual Deploy (3 minutes)

```bash
cd /Users/mrtungsten/Documents/Projects/The-HwinNwin-Pillars/apps/vyberology/apps/web

# 1. Get anon key from Supabase dashboard
# 2. Create .env.production
cat > .env.production <<EOF
VITE_SUPABASE_URL=https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_key_here
VITE_SUPABASE_PROJECT_ID=qptrlxzyindcohsubidl
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SGaypKQHOT2DNgNdJJ0nZNP2zL7iK3Gb4D3ai4L6poMV6CD0mRSvNIfDpdbA3nXhgP0avW4jPlOsUXZKkuBy50s00unH0hCzd
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_V4_ENABLED=false
EOF

# 3. Build and deploy
npm run build
vercel --prod
```

---

## Verify Fix

After deployment:
1. Go to https://vyberology.com
2. Open browser console (F12)
3. Should see no Supabase errors
4. Try clicking around - should work!
5. Test pricing page: https://vyberology.com/pricing
6. Test landing page: https://vyberology.com/landing

---

## What Went Wrong

Vercel deployed the site using the default `.env` file which has placeholders:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co  # ❌ Doesn't exist!
```

**Solution**: Set environment variables in Vercel dashboard or use `.env.production` for builds.

---

## Troubleshooting

### "vercel: command not found"
```bash
npm install -g vercel
vercel login
```

### Environment variables not updating
- After adding variables in Vercel dashboard, you MUST redeploy
- Variables are only applied on new builds, not retroactively

### Still seeing errors after deploy
- Check Vercel build logs for errors
- Verify environment variables are set for "Production" environment
- Try a force redeploy (not just rebuild)

---

## Quick Reference

**Supabase Dashboard**: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api

**Vercel Dashboard**: https://vercel.com/dashboard

**Vercel CLI Commands**:
```bash
vercel env ls                    # List environment variables
vercel env add NAME production   # Add environment variable
vercel --prod                    # Deploy to production
vercel logs                      # View deployment logs
```

---

**Recommended**: Use Option 1 (automated script) - fastest and least error-prone!

```bash
export SUPABASE_ANON_KEY='your_key_here'
./VERCEL_QUICKFIX.sh
```

**Time to fix**: 2 minutes
**Site will be live**: ~2 minutes after deployment starts

🚀 Let's fix this!
