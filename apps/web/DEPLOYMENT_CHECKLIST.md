# 🚀 Vyberology Deployment Checklist

## Pre-Deployment Security Checks

### ✅ Verify No Secrets in Code
```bash
# Should return nothing (no matches)
grep -r "sk-proj" src/
grep -r "sk-" supabase/functions/
git log --all --full-history --source -- "*.env"
```

### ✅ Verify `.env` is Gitignored
```bash
# Should output: .env
git check-ignore .env

# Should return nothing (not tracked)
git ls-files | grep "^\\.env"
```

## Supabase Edge Function Deployment

### Step 1: Install & Login
```bash
npm install -g supabase
supabase login
```

### Step 2: Link Project
```bash
supabase link --project-ref qptrlxzyindcohsubidl
```

### Step 3: Set Secrets
```bash
# REQUIRED: Set your OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key

# Verify secrets are set
supabase secrets list
```

### Step 4: Deploy Functions
```bash
# Option A: Use deployment script (recommended)
./deploy-functions.sh

# Option B: Manual deployment
supabase functions deploy
```

### Step 5: Test Deployment
```bash
# Test the generate-reading function
curl -X POST \
  https://qptrlxzyindcohsubidl.supabase.co/functions/v1/generate-reading \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "inputs": [{"label": "test", "value": "123"}]
  }'
```

Expected response:
```json
{
  "reading": "Your numerology reading..."
}
```

## Frontend Deployment

### Build & Deploy
```bash
# Install dependencies
npm install

# Run tests
npx vitest run

# Build production bundle
npm run build

# Verify no secrets in bundle
grep -r "sk-proj" dist/  # Should return nothing
```

### Deploy to Platform

**Lovable:**
1. Push changes to Lovable project
2. Click "Share → Publish"

**Self-Hosting (Vercel/Netlify):**
1. Deploy `dist/` folder
2. Set environment variables:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

## Post-Deployment Verification

### ✅ Security Checks
- [ ] No API keys visible in browser DevTools → Network tab
- [ ] No API keys in view-source of production site
- [ ] Edge Function returns readings successfully
- [ ] Frontend calls Edge Function (not OpenAI directly)

### ✅ Functional Tests
- [ ] Generate a personal reading
- [ ] Generate a compatibility reading
- [ ] Voice assistant captures screenshots
- [ ] Share/copy buttons work
- [ ] Mobile app functions (if deployed)

### ✅ Monitoring Setup
- [ ] OpenAI usage dashboard reviewed
- [ ] Set up cost alerts in OpenAI dashboard
- [ ] Supabase function logs accessible
- [ ] Error tracking configured (Sentry, etc.)

## Emergency Response

### If API Key is Compromised:

1. **Immediate Action:**
   ```bash
   # Revoke the old key in OpenAI dashboard immediately
   # Generate new key
   # Update Supabase secret
   supabase secrets set OPENAI_API_KEY=new-key-here

   # Redeploy
   supabase functions deploy generate-reading
   ```

2. **Review Usage:**
   - Check OpenAI usage for anomalies
   - Review Supabase function logs for suspicious activity

3. **Prevention:**
   - Rotate keys quarterly
   - Never commit keys to git
   - Use environment-specific keys

## Common Issues & Solutions

### Issue: "OpenAI API key not configured"
**Solution:** Set the Supabase secret:
```bash
supabase secrets set OPENAI_API_KEY=your-key
```

### Issue: Edge Function not found
**Solution:** Deploy the function:
```bash
supabase functions deploy generate-reading
```

### Issue: CORS errors
**Solution:** Check that the Edge Function includes CORS headers (already configured in index.ts)

### Issue: "Failed to generate reading"
**Solution:** Check function logs:
```bash
supabase functions logs generate-reading
```

## Rollback Plan

If issues arise after deployment:

1. **Revert Frontend:**
   - Deploy previous version from git
   - Or rollback in Lovable/Vercel dashboard

2. **Revert Edge Function:**
   ```bash
   git checkout previous-version
   supabase functions deploy generate-reading
   ```

3. **Emergency Fallback:**
   - Temporarily disable AI features via feature flags
   - Display numerology calculations only (no AI text)

## Success Criteria

- ✅ All tests passing
- ✅ No secrets in frontend bundle
- ✅ Edge Functions deployed and responding
- ✅ Readings generate successfully
- ✅ No errors in browser console
- ✅ Mobile app functional (if applicable)
- ✅ Monitoring and alerts configured

## Resources

- **Security Guide:** `SECURITY.md`
- **Audit Summary:** `SECURITY_AUDIT_SUMMARY.md`
- **Project Docs:** `CLAUDE.md`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/qptrlxzyindcohsubidl
- **OpenAI Dashboard:** https://platform.openai.com/usage

---

**Last Updated:** 2025-10-10
**Status:** Ready for Production ✅
