# 🚨 FIX VYBEROLOGY.COM (It's on Netlify!)

**Confirmed**: vyberology.com is hosted on **Netlify** (server headers show "Netlify Edge")

## Problem

Site is broken because it has placeholder environment variables and can't connect to Supabase.

---

## Quick Fix (3 Minutes)

### Step 1: Get Supabase Anon Key

https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api

Copy the **anon public** key (starts with `eyJhbGc...`)

### Step 2: Update Netlify Environment Variables

1. Go to: https://app.netlify.com
2. Find **Vyberology** site (or search for vyberology.com)
3. **Site settings** → **Environment variables**
4. Click **Add a variable** and add these:

```
VITE_SUPABASE_URL = https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY = [paste the key from step 1]
VITE_SUPABASE_PROJECT_ID = qptrlxzyindcohsubidl
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_51SGaypKQHOT2DNgNdJJ0nZNP2zL7iK3Gb4D3ai4L6poMV6CD0mRSvNIfDpdbA3nXhgP0avW4jPlOsUXZKkuBy50s00unH0hCzd
VITE_APP_VERSION = 1.0.0
VITE_APP_ENV = production
VITE_V4_ENABLED = false
```

**Important**: Make sure to add them for **All scopes** or at minimum **Production**

### Step 3: Trigger Redeploy

Still in Netlify:
- Go to **Deploys** tab
- Click **Trigger deploy** → **Deploy site**

Done! Site will be live in ~2 minutes.

---

## OR: Quick Local Build + Upload (5 Minutes)

If you want to test locally first:

```bash
cd /Users/mrtungsten/Documents/Projects/The-HwinNwin-Pillars/apps/vyberology/apps/web

# 1. Create .env.production with the real anon key
cat > .env.production <<EOF
VITE_SUPABASE_URL=https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_key_here
VITE_SUPABASE_PROJECT_ID=qptrlxzyindcohsubidl
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SGaypKQHOT2DNgNdJJ0nZNP2zL7iK3Gb4D3ai4L6poMV6CD0mRSvNIfDpdbA3nXhgP0avW4jPlOsUXZKkuBy50s00unH0hCzd
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_V4_ENABLED=false
EOF

# 2. Build
npm run build

# 3. Deploy to Netlify
# Either:
# - Drag 'dist' folder to Netlify dashboard
# - Or use Netlify CLI:
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

---

## Verify Fix

After deployment:
1. Go to https://vyberology.com
2. Open browser console (F12)
3. Should see no Supabase connection errors
4. Try navigating:
   - https://vyberology.com/pricing
   - https://vyberology.com/landing
   - https://vyberology.com/numerology

Everything should work!

---

## Finding Your Netlify Site

If you can't find it in the dashboard:
1. Go to https://app.netlify.com/teams
2. Check all teams/accounts you have access to
3. Search for "vyberology" or "vyberology.com"
4. Or check DNS: The IP `75.2.60.5` is Netlify

---

## What Went Wrong

The site was built with the default `.env` file that has placeholders like:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
```

These don't exist, so the entire frontend fails to connect to Supabase.

**Solution**: Set real environment variables in Netlify.

---

**Time to fix**: 3 minutes
**Blocker**: Need Supabase anon key

Get it here: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api

Then update Netlify env vars and redeploy! 🚀
