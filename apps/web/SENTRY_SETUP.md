# Sentry Error Tracking Setup Guide

This guide will walk you through setting up Sentry for error tracking in Vyberology.

## What You Get

- **Real-time error alerts** when users encounter bugs
- **Detailed error reports** with stack traces and user context
- **Performance monitoring** to identify slow pages/API calls
- **Session replay** to see what users saw when errors occurred
- **Release tracking** to know when new bugs are introduced

## Step 1: Create Sentry Account

1. Go to [https://sentry.io/signup/](https://sentry.io/signup/)
2. Sign up with your email or GitHub account
3. Choose the **Free Plan** (5,000 errors/month - perfect for starting out)

## Step 2: Create a Project

1. After signing up, click **"Create Project"**
2. Choose **"React"** as the platform
3. Set **Alert Frequency**: "Alert me on every new issue"
4. Name your project: `vyberology` or `vyberology-production`
5. Click **"Create Project"**

## Step 3: Get Your DSN

After creating the project, you'll see a setup page with your **DSN (Data Source Name)**.

**It looks like this:**
```
https://abc123def456@o123456.ingest.sentry.io/7891011
```

**Copy this DSN** - you'll need it in the next step.

## Step 4: Add DSN to Environment Variables

### For Local Development:

1. Open your `.env` file (create it if it doesn't exist by copying `.env.example`)
2. Add your Sentry DSN:

```env
VITE_SENTRY_DSN=https://your-actual-dsn-here@o123456.ingest.sentry.io/7891011
```

3. Restart your development server:
```bash
npm run dev
```

### For Production (Lovable/Vercel/Netlify):

1. Go to your hosting platform's environment variables settings
2. Add a new variable:
   - **Name**: `VITE_SENTRY_DSN`
   - **Value**: Your DSN from Sentry
3. Redeploy your app

## Step 5: Test Sentry Integration

Let's verify that Sentry is working by triggering a test error.

### Option A: Use Browser Console

1. Open your app in a browser
2. Open the browser console (F12 or right-click → Inspect)
3. Run this command:
```javascript
throw new Error("Test error for Sentry - ignore this!");
```

4. Go to your Sentry dashboard at [sentry.io](https://sentry.io)
5. You should see a new error appear within ~10 seconds

### Option B: Create a Test Button (Temporary)

Add this to any page temporarily:

```typescript
import { captureError } from '@/lib/sentry';

// In your component:
<button onClick={() => {
  captureError(new Error('Test error from button'), {
    context: 'Sentry Test',
    level: 'info',
    tags: { test: 'true' }
  });
}}>
  Test Sentry
</button>
```

Click the button, then check your Sentry dashboard.

## Step 6: Configure Alerts

By default, Sentry emails you on every error. You can customize this:

1. Go to **Settings → Projects → vyberology → Alerts**
2. Create custom alert rules:
   - "Alert me when an error occurs more than 10 times in 1 hour"
   - "Alert me for errors with 'CRITICAL' tag"
   - "Alert me for errors on production environment only"

### Recommended Alert Setup:

- **High Priority**: Email + Slack for errors in production
- **Medium Priority**: Email only for new errors
- **Low Priority**: Dashboard only for known issues

## Step 7: Integrate with Slack (Optional)

1. Go to **Settings → Integrations**
2. Search for **Slack**
3. Click **Add Installation**
4. Choose your Slack workspace
5. Select the channel where you want error alerts (e.g., `#vyberology-errors`)
6. Configure which alerts go to Slack

## Understanding Your Sentry Dashboard

### Issues Tab
- Shows all errors grouped by type
- Click any error to see:
  - Full stack trace
  - User context (browser, OS, device)
  - Breadcrumbs (what user did before error)
  - Number of users affected
  - First/last seen timestamps

### Performance Tab
- Shows slow pages and API calls
- Identifies bottlenecks
- Tracks page load times

### Releases Tab
- Associates errors with code versions
- Shows if new version introduced bugs
- Tracks error trends over time

## What Data Gets Sent to Sentry?

Sentry collects:
- ✅ Error messages and stack traces
- ✅ Browser info (type, version, OS)
- ✅ Page URLs where errors occurred
- ✅ User actions leading to error (breadcrumbs)

Sentry **DOES NOT** collect (PII is scrubbed):
- ❌ User names
- ❌ Dates of birth
- ❌ Email addresses
- ❌ Form input values

**See `src/lib/sentry.ts` for PII scrubbing logic.**

## Real-World Example Alerts

### Example 1: OpenAI API Timeout
```
[Sentry] New error in vyberology

Error: Request timed out. Please try again.
Context: Reading Generation - Edge Function
Tags: service=supabase-edge-function, function=generate-reading
User: iPhone 12, iOS 17, Safari

Breadcrumbs:
1. User clicked "Generate Reading" button
2. Reading generation started (depth: standard)
3. Supabase Edge Function called
4. Error: timeout after 30s
```

**Action**: You know OpenAI is slow, can add retry logic or increase timeout.

### Example 2: React Component Crash
```
[Sentry] New error in vyberology

Error: Cannot read property 'value' of undefined
Location: ReadingCard.tsx:42
Context: React Error Boundary
User: Android, Chrome 118

Component Stack:
  at ReadingCard
  at NumerologyReader
  at App
```

**Action**: You know exactly which component and line crashed, can fix null check.

## Mobile-Specific Setup

Sentry is already configured for Capacitor (iOS/Android). When you build the mobile app:

1. **iOS**: Errors from iOS devices will be captured automatically
2. **Android**: Errors from Android devices will be captured automatically

No additional setup required! The `@sentry/capacitor` package handles it.

## Monitoring After Launch

### Week 1-2: Watch Closely
- Check Sentry daily
- Fix critical errors immediately
- Create GitHub issues for non-critical bugs

### Week 3+: Set Up Thresholds
- Ignore known issues (e.g., browser extension errors)
- Set up weekly digest emails
- Monitor error rate trends

## Cost Management

**Free Tier Limits:**
- 5,000 errors/month
- 10,000 performance transactions/month

**If You Exceed:**
- Sentry stops accepting new events (doesn't charge you)
- Upgrade to paid plan (~$26/month) for more volume

**Tips to Stay Under Limit:**
- Use `tracesSampleRate: 0.1` (only monitor 10% of transactions)
- Ignore common errors (browser extensions, network timeouts)
- Use `ignoreErrors` array in `src/lib/sentry.ts`

## Privacy & GDPR Compliance

Sentry is GDPR-compliant:
- Hosted in US and EU data centers (you can choose)
- Data Processing Agreement available
- User data can be deleted on request

**For GDPR compliance:**
1. Update Privacy Policy to mention Sentry (already done in `PRIVACY_POLICY.md`)
2. If using EU users, select EU data center in Sentry settings
3. Ensure PII scrubbing is working (it is - see `src/lib/sentry.ts`)

## Disabling Sentry

To disable Sentry temporarily:

1. Remove `VITE_SENTRY_DSN` from your `.env` file
2. Restart dev server

Or set it to empty string:
```env
VITE_SENTRY_DSN=
```

Sentry will log a warning but won't send errors.

## Troubleshooting

### Sentry Not Capturing Errors

**Check 1**: Is DSN set in environment variables?
```bash
echo $VITE_SENTRY_DSN
```

**Check 2**: Is Sentry initialized?
Open browser console, run:
```javascript
console.log(window.Sentry);
```
Should show Sentry object, not `undefined`.

**Check 3**: Check browser network tab
Look for requests to `sentry.io` - if none, Sentry isn't sending.

**Check 4**: Is environment production?
Sentry only sends errors in production by default. For dev testing, set:
```typescript
// In src/lib/sentry.ts, change:
tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1
```

### Too Many Errors

If you're getting flooded with errors:

1. **Ignore Browser Extension Errors**
   - Already configured in `src/lib/sentry.ts` under `ignoreErrors`

2. **Adjust Sample Rate**
   ```typescript
   // In src/lib/sentry.ts
   tracesSampleRate: 0.05 // Only 5% of transactions
   ```

3. **Filter by Environment**
   - In Sentry, create filter: `environment:production`
   - Ignores dev/staging errors

## Next Steps

1. ✅ Create Sentry account
2. ✅ Add DSN to `.env`
3. ✅ Test with deliberate error
4. ✅ Set up Slack alerts
5. ✅ Monitor for first week
6. ✅ Update alert rules based on volume

---

**Questions?**
- Sentry Docs: [docs.sentry.io](https://docs.sentry.io)
- React Integration: [docs.sentry.io/platforms/javascript/guides/react/](https://docs.sentry.io/platforms/javascript/guides/react/)
- Support: support@sentry.io

**Need Help?**
- Check `src/lib/sentry.ts` for configuration
- See `CLAUDE.md` for Vyberology-specific notes
- Contact team if errors are unclear
