# Fix: Supabase Token Issue

## Problem
```
Invalid access token format. Must be like `sbp_0102...1920`
```

The deployment requires a **Personal Access Token** (starts with `sbp_`), not a project API key.

---

## Solution: Get the Correct Token

### Step 1: Go to Supabase Settings

1. Open: https://supabase.com/dashboard
2. Click your **avatar** (profile picture in top right)
3. Click **"Access Tokens"** (NOT "API Settings"!)

### Step 2: Generate NEW Token

1. Click **"Generate new token"**
2. **Name**: `Vyberology GitHub Deploy`
3. **Scopes**: Check ALL boxes (or at minimum):
   - `all` (easiest)
   - OR individually: `functions.write`, `sql.write`, `analytics.read`
4. Click **"Generate token"**
5. **COPY THE TOKEN** - it should start with `sbp_`

### Step 3: Update GitHub Secret

From your project root directory, run:

```bash
gh secret set SUPABASE_ACCESS_TOKEN
```

**Paste the token that starts with `sbp_` when prompted!**

### Step 4: Trigger Deployment Again

```bash
gh workflow run deploy.yml
```

### Step 5: Watch It Deploy

```bash
gh run watch
```

---

## How to Verify You Have the Right Token

The correct token should:
- Start with `sbp_` (like `sbp_abc123...xyz789`)
- Be from **Account settings > Access Tokens**
- NOT start with `eyJ` (that's a JWT API key - wrong!)
- NOT be from **Project Settings > API** (that's the project anon/service key - wrong!)

---

## Quick Fix Command Sequence

```bash
# 1. Update the token (from project root)
gh secret set SUPABASE_ACCESS_TOKEN
# [paste the sbp_ token when prompted]

# 2. Deploy again
gh workflow run deploy.yml

# 3. Watch it work
gh run watch
```

---

Once you fix this, deployment should work perfectly!
