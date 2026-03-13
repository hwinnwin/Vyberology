# 🚀 Deployment Setup Guide - Ready to KICK ASS

## 🎯 Mission: Configure Secrets and Deploy to Staging

**Time Required**: 15-20 minutes
**Difficulty**: Easy (just copy-paste)

---

## 📋 **STEP 1: Get Netlify Secrets** (5-7 minutes)

### A. Get NETLIFY_AUTH_TOKEN

1. **Go to Netlify**: https://app.netlify.com
2. **Login** to your account
3. **Click your avatar** (top right) → **User settings**
4. **Click "Applications"** in left sidebar
5. **Scroll to "Personal access tokens"**
6. **Click "New access token"**
7. **Description**: "Vyberology GitHub Deploy"
8. **Expiration**: Set to 1 year (or never)
9. **Click "Generate token"**
10. **COPY THE TOKEN** (you can't see it again!)

### B. Get NETLIFY_SITE_ID

**Option 1: Create New Site**
1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub (if not already)
4. Select **Vyberology** repository
5. **Build settings**:
   - Build command: `pnpm --filter ./apps/web run build`
   - Publish directory: `apps/web/dist`
6. Click **"Deploy site"**
7. After deployment, go to **Site settings**
8. Copy the **Site ID** (under "Site details")

**Option 2: Use Existing Site**
1. Go to https://app.netlify.com
2. Click on your Vyberology site
3. Click **"Site settings"**
4. Copy the **Site ID** (under "Site details")

---

## 📋 **STEP 2: Get Supabase Secrets** (5-7 minutes)

### A. Get SUPABASE_ACCESS_TOKEN

1. **Go to Supabase**: https://supabase.com/dashboard
2. **Login** to your account
3. **Click your avatar** (top right)
4. **Click "Account settings"**
5. **Click "Access Tokens"** tab
6. **Click "Generate new token"**
7. **Name**: "Vyberology GitHub Deploy"
8. **Scopes**: Select all (or at minimum: `functions.write`, `migrations.write`)
9. **Click "Generate token"**
10. **COPY THE TOKEN** immediately!

### B. Get SUPABASE_PROJECT_REF

1. Go to https://supabase.com/dashboard
2. Click on your **Vyberology project**
3. Click **"Settings"** (gear icon in sidebar)
4. Click **"General"**
5. Find **"Reference ID"** under "Project Details"
6. **COPY THE REF** (looks like: `abcdefghijklmno`)

---

## 📋 **STEP 3: Add Secrets to GitHub** (3-5 minutes)

### Option A: Using GitHub Web UI

1. **Go to your repository**: https://github.com/hwinnwin/Vyberology
2. **Click "Settings"** tab
3. **Click "Secrets and variables"** → **"Actions"**
4. **Click "New repository secret"** for each:

   - **Name**: `NETLIFY_AUTH_TOKEN`
     **Value**: [paste token from Step 1A]

   - **Name**: `NETLIFY_SITE_ID`
     **Value**: [paste site ID from Step 1B]

   - **Name**: `SUPABASE_ACCESS_TOKEN`
     **Value**: [paste token from Step 2A]

   - **Name**: `SUPABASE_PROJECT_REF`
     **Value**: [paste ref from Step 2B]

### Option B: Using GitHub CLI (Faster!)

```bash
# From your local terminal
cd /Users/mrtungsten/Documents/Projects/4\ Empires/App\ building/Vyberology/Vyberology-main-27.10.25

# Set secrets (you'll be prompted to enter values)
gh secret set NETLIFY_AUTH_TOKEN
gh secret set NETLIFY_SITE_ID
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_PROJECT_REF
```

**Verify secrets are set:**
```bash
gh secret list
```

You should see all 4 secrets listed.

---

## 📋 **STEP 4: Trigger Deployment** (2 minutes)

### Option A: Manual Workflow Trigger

```bash
cd /Users/mrtungsten/Documents/Projects/4\ Empires/App\ building/Vyberology/Vyberology-main-27.10.25

# Trigger deploy workflow
gh workflow run deploy.yml

# Watch the deployment
gh run watch
```

### Option B: Push to Main (Auto-triggers)

The deploy workflow is configured to auto-trigger on push to `main`. Since all changes are already committed, you can just push:

```bash
git push origin main
```

---

## 📋 **STEP 5: Monitor Deployment** (5-10 minutes)

### Watch GitHub Actions

**In Terminal:**
```bash
# Watch latest workflow run
gh run watch

# Or list recent runs
gh run list --workflow=deploy.yml
```

**In Browser:**
1. Go to: https://github.com/hwinnwin/Vyberology/actions
2. Click on the latest "Deploy (Web + Supabase)" workflow
3. Watch the progress

### What Gets Deployed

The workflow will:
1. ✅ Install dependencies
2. ✅ Build analytics-adapter package
3. ✅ Build web app
4. ✅ Login to Supabase
5. ✅ Push database migrations
6. ✅ Deploy 6 Edge Functions:
   - `vybe-reading`
   - `ocr`
   - `read`
   - `compare`
   - `log-error`
   - `error-digest`
7. ✅ Deploy web app to Netlify
8. ✅ Create release tag

**Expected Duration**: 3-5 minutes

---

## 📋 **STEP 6: Verify Deployment** (5 minutes)

### A. Check Netlify Deployment

1. Go to https://app.netlify.com
2. Click on your Vyberology site
3. You should see a new deployment (green checkmark)
4. Click **"Open production deploy"** or copy the URL
5. **Test the site**:
   - Can you load the homepage?
   - Does the time capture work?
   - Can you create a reading?

### B. Check Supabase Edge Functions

1. Go to https://supabase.com/dashboard
2. Open your Vyberology project
3. Click **"Edge Functions"** in sidebar
4. You should see **6 functions** deployed:
   - vybe-reading
   - ocr
   - read
   - compare
   - log-error
   - error-digest
5. Click on each function → **"Logs"** tab
6. Verify no errors

### C. Check Database Migrations

1. In Supabase dashboard
2. Click **"Database"** → **"Migrations"**
3. All migrations should show as "Applied"

---

## 📋 **STEP 7: Save Deployment URLs** (2 minutes)

After successful deployment, save these URLs for validation:

```bash
# Create a deployment info file
cat > DEPLOYMENT_INFO.md << 'EOF'
# Deployment URLs

**Deployed**: $(date)

## Staging Environment

- **Web App**: https://[your-site-name].netlify.app
- **Supabase Functions**: https://[your-project-ref].functions.supabase.co
- **Supabase Database**: postgresql://postgres:[password]@db.[your-project-ref].supabase.co:5432/postgres

## Next Steps

- [ ] Run staging validation suite
- [ ] Test all 6 Edge Functions
- [ ] Run integration tests (149 tests)
- [ ] Run E2E tests (18 tests)
- [ ] Setup monitoring (Sentry)
- [ ] Performance audit (Lighthouse)
- [ ] Production deployment

EOF

git add DEPLOYMENT_INFO.md
git commit -m "docs: add deployment URLs for staging validation"
git push origin main
```

---

## 🎯 **Success Criteria**

### ✅ Deployment Successful When:

- [x] GitHub Actions workflow completes (green checkmark)
- [x] Netlify shows new deployment
- [x] Web app loads at Netlify URL
- [x] All 6 Edge Functions deployed to Supabase
- [x] Database migrations applied
- [x] No errors in Netlify logs
- [x] No errors in Supabase logs
- [x] Can create a test reading end-to-end

---

## 🚨 **Troubleshooting**

### If Deployment Fails

**1. Check Secrets**
```bash
# List secrets to verify they're set
gh secret list

# Should show:
# NETLIFY_AUTH_TOKEN
# NETLIFY_SITE_ID
# SUPABASE_ACCESS_TOKEN
# SUPABASE_PROJECT_REF
```

**2. Check Workflow Logs**
```bash
# View failed run logs
gh run view --log-failed
```

**3. Common Issues**

**Error: "Invalid Netlify token"**
- Solution: Regenerate token in Netlify → User settings → Applications → Personal access tokens

**Error: "Supabase project not found"**
- Solution: Verify SUPABASE_PROJECT_REF is correct (Settings → General → Reference ID)

**Error: "Edge function deployment failed"**
- Solution: Check Supabase access token has `functions.write` scope

**Error: "Migration failed"**
- Solution: Check database is accessible, no manual schema changes conflict

---

## 📞 **Need Help?**

**Check These First:**
1. GitHub Actions logs: `gh run view --log-failed`
2. Netlify deploy logs: Netlify dashboard → Site → Deploys → Click latest
3. Supabase logs: Supabase dashboard → Edge Functions → Logs

**Still Stuck?**
- Review `.github/workflows/deploy.yml` for workflow details
- Check `docs/DEPLOYMENT_HANDOFF.md` for technical context
- Verify all secrets are set correctly

---

## 🎉 **After Successful Deployment**

**Next Phase: Validation**

Run the staging validation suite:

```bash
cd scripts/staging-validation

# Update URLs in validate-staging.sh
./validate-staging.sh \
  https://[your-site].netlify.app \
  https://[your-ref].functions.supabase.co \
  postgresql://postgres:[pass]@db.[your-ref].supabase.co:5432/postgres
```

This will:
- ✅ Test error logging (11 tests)
- ✅ Run integration tests (149 tests)
- ✅ Run E2E tests (18 tests)
- ✅ Generate coverage report
- ✅ Capture screenshots

---

## 🔥 **THE ASS KICKING BEGINS NOW!**

**Ready to deploy?**

1. ✅ Get all secrets (Steps 1-2)
2. ✅ Add to GitHub (Step 3)
3. ✅ Trigger deployment (Step 4)
4. ✅ Watch it kick ass (Step 5)
5. ✅ Verify success (Step 6)
6. ✅ Run validation (Step 7)

**Time to DOMINATE staging!** 🚀💪

---

*Generated by Claude, the Divine Ass Kicker of Deployment* 🔥
