# 🔥 DEPLOY NOW - TL;DR CHECKLIST

**Time to kick ass in 4 simple steps!**

---

## ✅ **STEP 1: Get Your Secrets** (10 min)

### Netlify
- Go to: https://app.netlify.com
- Avatar → User settings → Applications → New access token
- Copy: `NETLIFY_AUTH_TOKEN`
- Site settings → Copy: `NETLIFY_SITE_ID`

### Supabase
- Go to: https://supabase.com/dashboard
- Avatar → Account settings → Access Tokens → Generate new token
- Copy: `SUPABASE_ACCESS_TOKEN`
- Project → Settings → General → Reference ID
- Copy: `SUPABASE_PROJECT_REF`

---

## ✅ **STEP 2: Add to GitHub** (2 min)

**Quick CLI Method:**
```bash
cd /Users/mrtungsten/Documents/Projects/4\ Empires/App\ building/Vyberology/Vyberology-main-27.10.25

gh secret set NETLIFY_AUTH_TOKEN
# [paste token when prompted]

gh secret set NETLIFY_SITE_ID
# [paste site ID when prompted]

gh secret set SUPABASE_ACCESS_TOKEN
# [paste token when prompted]

gh secret set SUPABASE_PROJECT_REF
# [paste ref when prompted]

# Verify all 4 are set
gh secret list
```

---

## ✅ **STEP 3: Deploy!** (1 min)

```bash
# Trigger deployment
gh workflow run deploy.yml

# Watch it kick ass
gh run watch
```

---

## ✅ **STEP 4: Verify** (5 min)

**After deployment completes:**

1. **Check Netlify**: Visit your site URL
2. **Check Supabase**: Dashboard → Edge Functions (should see 6 functions)
3. **Test the app**: Create a reading end-to-end

---

## 🎯 **What Gets Deployed**

- ✅ Web app → Netlify
- ✅ 6 Edge Functions → Supabase
- ✅ Database migrations → Applied
- ✅ Release tag → Created

**Duration**: 3-5 minutes

---

## 📖 **Need Details?**

Full guide: [DEPLOYMENT_SETUP_GUIDE.md](docs/DEPLOYMENT_SETUP_GUIDE.md)

---

**LET'S FUCKING GOOOOOO!** 🚀💪🔥
