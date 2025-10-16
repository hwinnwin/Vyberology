# Security Configuration Guide

## Overview

This application has been configured to keep API keys secure by using Supabase Edge Functions instead of exposing them in the frontend.

## ⚠️ CRITICAL: Never Commit API Keys

The `.env` file contains sensitive API keys and **MUST NEVER** be committed to version control.

### Current Status
- ✅ `.gitignore` updated to exclude `.env` files
- ✅ `.env.example` created as a template
- ✅ OpenAI API calls moved to Supabase Edge Function

## Required Supabase Secrets

To deploy the Edge Functions, you need to set the following secrets in your Supabase project:

### 1. OpenAI API Key

```bash
# Set the OpenAI API key as a Supabase secret
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key-here
```

This secret is used by the `generate-reading` Edge Function to call OpenAI's API securely from the backend.

## Deploying Edge Functions

1. **Install Supabase CLI** (if not already installed):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link your project**:
```bash
supabase link --project-ref qptrlxzyindcohsubidl
```

4. **Set the OpenAI secret**:
```bash
supabase secrets set OPENAI_API_KEY=your-actual-openai-api-key
```

5. **Deploy all Edge Functions**:
```bash
supabase functions deploy
```

Or deploy a specific function:
```bash
supabase functions deploy generate-reading
```

## Environment Variables for Local Development

Create a `.env` file based on `.env.example`:

```env
# Supabase Configuration (public - safe to use in frontend)
VITE_SUPABASE_PROJECT_ID=qptrlxzyindcohsubidl
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=https://qptrlxzyindcohsubidl.supabase.co

# OpenAI API Key - DEPRECATED for frontend use
# This should only be used for local testing
# In production, the key is stored as a Supabase secret
# VITE_OPENAI_KEY=your_openai_key_here
```

## Testing Edge Functions Locally

To test Edge Functions locally:

```bash
# Start Supabase locally
supabase start

# Serve functions locally with environment variables
supabase functions serve --env-file .env.local
```

Create `.env.local` for local Edge Function testing:
```env
OPENAI_API_KEY=your-openai-api-key
```

## Security Best Practices

### ✅ DO:
- Store sensitive API keys in Supabase secrets
- Use environment variables for configuration
- Use `.env.example` to document required variables
- Keep `.env` in `.gitignore`
- Use Supabase Edge Functions for server-side API calls
- Rotate API keys if they're ever exposed

### ❌ DON'T:
- Commit `.env` files to git
- Expose API keys in frontend code
- Use `VITE_` prefix for sensitive keys that will be in the frontend bundle
- Share API keys in public repositories or documentation
- Use the same API keys across development and production

## Verifying Security

After deployment, verify that:

1. **No API keys in frontend bundle**:
```bash
npm run build
grep -r "sk-proj" dist/  # Should return nothing
grep -r "OPENAI" dist/assets/*.js  # Should only show variable names, not actual keys
```

2. **Edge Function is working**:
```bash
curl -X POST https://qptrlxzyindcohsubidl.supabase.co/functions/v1/generate-reading \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Test User", "inputs": []}'
```

## What Changed?

### Before (Insecure) ❌
```typescript
// Frontend directly calling OpenAI
const res = await fetch("https://api.openai.com/v1/chat/completions", {
  headers: {
    "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,  // ❌ Exposed in bundle!
  }
});
```

### After (Secure) ✅
```typescript
// Frontend calls Supabase Edge Function
const { data, error } = await supabase.functions.invoke('generate-reading', {
  body: input  // ✅ API key stays on server
});
```

## Incident Response

If you discover that API keys were committed to git:

1. **Immediately revoke the exposed keys** in the OpenAI dashboard
2. **Generate new API keys**
3. **Update Supabase secrets**:
   ```bash
   supabase secrets set OPENAI_API_KEY=new-key-here
   ```
4. **Remove sensitive data from git history**:
   ```bash
   # Use BFG Repo-Cleaner or git-filter-repo
   git filter-repo --path .env --invert-paths
   ```
5. **Force push** (only if repository is private and you coordinate with team)

## Monitoring

Monitor your API usage in:
- OpenAI dashboard: https://platform.openai.com/usage
- Supabase dashboard: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl

Set up usage alerts to detect unauthorized access.

## Questions?

Contact your team lead or refer to:
- Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
- Supabase Secrets management: https://supabase.com/docs/guides/functions/secrets
