# Before Production Deployment Checklist

**CRITICAL: Complete ALL items before deploying to production!**

---

## 1. Update CORS Headers in Edge Functions 🔴 CRITICAL

**Risk:** Security vulnerability - allows any website to call your API
**Impact:** HIGH - potential API abuse and unauthorized access

### Files to Update:

All 8 Edge Functions have wildcard CORS (`*`) that must be changed:

1. `supabase/functions/generate-reading/index.ts` ✅ (has TODO comment)
2. `supabase/functions/compare/index.ts`
3. `supabase/functions/ocr/index.ts`
4. `supabase/functions/read/index.ts`
5. `supabase/functions/reading/index.ts`
6. `supabase/functions/readings/index.ts`
7. `supabase/functions/seed-archetypes/index.ts`
8. `supabase/functions/vybe-reading/index.ts`

### What to Change:

**Before (INSECURE):**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ⚠️ ALLOWS ALL DOMAINS
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**After (SECURE):**
```typescript
// Option 1: Single production domain
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vyberology.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Option 2: Environment-based (recommended)
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || 'https://vyberology.app';
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Option 3: Multiple domains (staging + production)
const allowedOrigins = [
  'https://vyberology.app',
  'https://staging.vyberology.app',
  'http://localhost:8080', // for local testing
];

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
```

### How to Update:

```bash
# Set environment variable in Supabase (Option 2)
supabase secrets set ALLOWED_ORIGIN=https://vyberology.app

# Then update all Edge Functions to use it
# (Find/replace in all 8 files)
```

---

## 2. Update Capacitor Config for Production 🔴 CRITICAL

**Risk:** Hardcoded dev server IP will break in production
**Impact:** HIGH - app won't work

### File: `capacitor.config.ts`

**Current (DEVELOPMENT):**
```typescript
server: {
  url: 'http://192.168.0.24:8080',  // ⚠️ LOCAL DEV SERVER
  cleartext: true
},
```

**Fix: Comment out for production builds:**
```typescript
// Comment out server config for production builds
// Uncomment for local development with hot reload
// server: {
//   url: 'http://192.168.0.24:8080',
//   cleartext: true
// },
```

**Or use environment-based config:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'app.lovable.eebd950946e542d89b5f15154caa7b65',
  appName: 'vyberology',
  webDir: 'dist',
  ...(isDev && {
    server: {
      url: 'http://192.168.0.24:8080',
      cleartext: true
    }
  }),
  // ... rest of config
};

export default config;
```

---

## 3. Add Mobile Permission Descriptions ⚠️ REQUIRED

**Risk:** App Store rejection
**Impact:** HIGH - can't publish to App Store without this

### iOS: Update `ios/App/App/Info.plist`

Add these keys **before the final `</dict></plist>`**:

```xml
<key>NSCameraUsageDescription</key>
<string>Vyberology needs camera access to capture frequency numbers and patterns in photos for numerology readings.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Vyberology needs photo library access to select images containing frequency numbers for analysis.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Vyberology would like to save your reading screenshots to your photo library.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Vyberology needs microphone access for "Hey Lumen" voice commands and voice-activated frequency capture.</string>
```

### Android: Verify `android/app/src/main/AndroidManifest.xml`

Permissions already declared (verify they're present):

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## 4. Set Production Environment Variables

### Supabase Secrets:

```bash
# OpenAI API Key (CRITICAL - required for AI readings)
supabase secrets set OPENAI_API_KEY=your-production-key

# Optional: CORS origin
supabase secrets set ALLOWED_ORIGIN=https://vyberology.app
```

### Frontend Environment Variables:

Create `.env.production`:

```env
VITE_SUPABASE_PROJECT_ID=your-production-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-publishable-key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

---

## 5. Build and Test

### Web Build:

```bash
npm run build

# Test production build locally
npm run preview
```

### iOS Build:

```bash
# Sync latest code to iOS
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios

# Before building:
# 1. Update Info.plist with permission descriptions
# 2. Comment out dev server in capacitor.config.ts
# 3. Bump version number in Info.plist
# 4. Build and test on real device
```

### Android Build:

```bash
# Sync latest code to Android
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android

# Before building:
# 1. Comment out dev server in capacitor.config.ts
# 2. Update versionCode and versionName in build.gradle
# 3. Build and test on real device
```

---

## 6. Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to production project
supabase link --project-ref your-production-ref

# Deploy all Edge Functions
supabase functions deploy

# Or deploy individually:
supabase functions deploy generate-reading
supabase functions deploy compare
# ... etc
```

---

## 7. Run Database Migrations

```bash
# Verify migrations are ready
supabase migration list

# Apply to production
supabase db push --linked
```

---

## 8. Final Pre-Launch Checklist

- [ ] All CORS headers updated to production domain
- [ ] Capacitor config dev server commented out
- [ ] iOS Info.plist has all permission descriptions
- [ ] Android permissions verified in manifest
- [ ] OPENAI_API_KEY set in Supabase secrets
- [ ] Production environment variables configured
- [ ] Edge Functions deployed to production
- [ ] Database migrations applied
- [ ] Privacy Policy and Terms of Service dates updated
- [ ] Legal contact email verified (legal@hwinnwin.com)
- [ ] Test widgets on real iOS device
- [ ] Test widgets on real Android device
- [ ] Test voice permissions on mobile
- [ ] Test camera permissions on mobile
- [ ] Test cloud sync flow with real user account
- [ ] Load test AI reading generation (simulate 100+ requests)
- [ ] Verify error tracking is working (Sentry or equivalent)
- [ ] App Store screenshots prepared
- [ ] Play Store screenshots prepared

---

## 9. Monitoring Setup (Recommended)

### Add Error Tracking:

```bash
npm install @sentry/react @sentry/vite-plugin
```

Update `main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Add Analytics (Optional):

- Google Analytics
- Plausible (privacy-friendly)
- PostHog (open-source)

---

## 10. Post-Deployment Verification

### Immediately After Deploy:

1. **Test critical flows:**
   - [ ] User registration
   - [ ] AI reading generation
   - [ ] Cloud sync (if opted in)
   - [ ] Widget deep links
   - [ ] Voice commands

2. **Monitor errors:**
   - [ ] Check Sentry dashboard
   - [ ] Check Supabase Edge Function logs: `supabase functions logs generate-reading`
   - [ ] Check browser console for errors

3. **Performance check:**
   - [ ] Run Lighthouse audit
   - [ ] Check Core Web Vitals
   - [ ] Test on slow network (3G)

4. **Security verify:**
   - [ ] Test CORS from unauthorized domain (should be blocked)
   - [ ] Verify API keys not exposed in client
   - [ ] Test RLS policies with different user accounts

---

## Emergency Rollback Plan

If critical issues discovered after deployment:

### Web App:
```bash
# Revert to previous deployment
git revert HEAD
npm run build
# Redeploy
```

### Mobile Apps:
- iOS: Submit expedited review for bug fix
- Android: Pause rollout in Play Console
- Emergency: Use kill switch to direct users to web app

### Edge Functions:
```bash
# Deploy previous version
git checkout previous-commit
supabase functions deploy function-name
```

---

## Support Contacts

- **Technical Issues:** [Your Dev Team]
- **Legal/Privacy:** legal@hwinnwin.com
- **Sentry Alerts:** [Your Alert Email]
- **Supabase Support:** https://supabase.com/support

---

**Generated:** January 2025
**Last Updated:** Before first production deployment
**Owner:** Vyberology Dev Team

---

## Quick Reference

### Production URLs
- **Web App:** https://vyberology.app (to be configured)
- **Supabase:** https://your-project.supabase.co
- **Edge Functions:** https://your-project.supabase.co/functions/v1/

### Version Numbers
- **Web App:** 1.0.0
- **iOS App:** 1.0 (Build 1)
- **Android App:** 1.0 (versionCode 1)

### Important Files
- `.env.production` - Production environment variables
- `capacitor.config.ts` - Mobile app configuration
- `supabase/functions/*/index.ts` - Edge Functions with CORS
- `ios/App/App/Info.plist` - iOS permissions
- `android/app/src/main/AndroidManifest.xml` - Android permissions
