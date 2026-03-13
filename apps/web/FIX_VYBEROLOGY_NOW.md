# 🚨 FIX VYBEROLOGY.COM NOW

## Problem

**Site is completely broken** because it's deployed with placeholder environment variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co  ❌
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here  ❌
```

The frontend can't connect to Supabase, so **nothing works**.

---

## Quick Fix (5 minutes)

### Step 1: Get Supabase Anon Key

Go to: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api

Copy the **anon/public** key (starts with `eyJhbGc...`)

### Step 2: Update .env.production

```bash
cd /Users/mrtungsten/Documents/Projects/The-HwinNwin-Pillars/apps/vyberology/apps/web
```

Open `.env.production` and replace this line:
```bash
VITE_SUPABASE_ANON_KEY=REPLACE_WITH_ANON_KEY_FROM_DASHBOARD
```

With your actual key:
```bash
VITE_SUPABASE_ANON_KEY=eyJhbGc...your_actual_key_here
```

### Step 3: Configure Netlify Environment Variables

Go to: https://app.netlify.com (find Vyberology site)

**Site settings** → **Environment variables** → Add these:

```
VITE_SUPABASE_URL = https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY = [paste the key from step 1]
VITE_SUPABASE_PROJECT_ID = qptrlxzyindcohsubidl
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_51SGaypKQHOT2DNgNdJJ0nZNP2zL7iK3Gb4D3ai4L6poMV6CD0mRSvNIfDpdbA3nXhgP0avW4jPlOsUXZKkuBy50s00unH0hCzd
VITE_APP_VERSION = 1.0.0
VITE_APP_ENV = production
VITE_V4_ENABLED = false
```

### Step 4: Rebuild

In Netlify dashboard:
- Click **Deploys** → **Trigger deploy** → **Deploy site**

Or rebuild locally and upload:
```bash
npm run build
# Then drag dist/ folder to Netlify
```

---

## OR: Quick Manual Deploy

If you don't want to configure Netlify env vars:

```bash
# 1. Get the anon key from Supabase dashboard
# 2. Update .env.production with the real key
# 3. Build
npm run build

# 4. Deploy dist/ folder to Netlify (drag & drop)
```

---

## Verify Fix

After deployment:
1. Go to https://vyberology.com
2. Open browser console (F12)
3. Should see no Supabase errors
4. Try clicking around - should work!

---

## What Went Wrong

The production deployment used the default .env file which has placeholders:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co  # ❌ Doesn't exist!
```

**Solution**: Always use .env.production for production builds OR configure environment variables in your deployment platform (Netlify/Vercel).

---

## Files Created

- `.env.production` - Production environment variables (DO NOT commit!)
- This file already has all correct values except `VITE_SUPABASE_ANON_KEY`

---

**Time to fix**: 5 minutes
**Blocker**: Need Supabase anon key from dashboard

Get it here: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api
