# Vyberology Production Polish — Design Spec

**Date:** 2026-03-13
**Status:** Final (v3)
**Scope:** Testing, Mobile Apps (Capacitor), Unified Payments (IAP + Stripe)

---

## 1. Overview

Three workstreams to take Vyberology from "deployed" to "production-polished," executed in order:

0. **Security hotfix** — Restrict `add_reading_credits` to service role only (deploy before anything else)
1. **Testing** — Fix E2E in CI, broaden unit coverage scope and raise to 80%+
2. **Mobile Apps** — Capacitor-wrap the web app for iOS & Android with native UX polish
3. **Payments** — Native IAP (Apple/Google) via RevenueCat + Stripe live for web, unified backend

**Order rationale:** Security fix first because authenticated users can currently grant themselves free credits. Tests second = safety net. Mobile third = polished base for wrapping. Payments last = spans both web and mobile, easiest once the mobile shell is stable.

---

## 2. Security Hotfix (Deploy First)

The existing `add_reading_credits()` function is `SECURITY DEFINER` and callable by any authenticated user via RPC. This must be restricted immediately:

```sql
REVOKE EXECUTE ON FUNCTION add_reading_credits FROM authenticated;
REVOKE EXECUTE ON FUNCTION add_reading_credits FROM anon;
-- Only service_role (used by edge functions) retains access
```

Also verify:
- The function's `search_path` is pinned (e.g., `SET search_path = public`) to prevent search_path hijacking
- No wrapper RPCs or views expose `add_reading_credits` indirectly

Deploy this as a standalone migration before any other payment changes.

---

## 3. Testing Workstream

### 3.1 E2E Test Fix (CI)

**Problem:** Playwright E2E tests are disabled in `ci.yml` due to localStorage access failures in headless Chromium.

**Root cause:** The `clearStorage()` helper in test fixtures calls `page.evaluate(() => localStorage.clear())` before a page is navigated to, meaning there's no browsing context. The `storageState` approach helps with auth pre-seeding but the call ordering issue must also be fixed.

**Solution:**
- Fix `clearStorage()` in test helpers to only call `localStorage.clear()` after navigation (or remove it in favor of fresh browser contexts per test)
- Configure `playwright.config.ts` with a `storageState` file for pre-seeded auth state
- The `webServer` config already exists (runs `npm run preview` in CI) — verify it works, no need to add it
- Re-enable the E2E job in `.github/workflows/ci.yml`
- Add Playwright browser install step to CI

**Files to modify:**
- `apps/web/tests/e2e/helpers.ts` — fix `clearStorage()` call ordering
- `apps/web/playwright.config.ts` — add `storageState` config
- `apps/web/tests/e2e/fixtures/` — create auth fixture with pre-seeded state
- `.github/workflows/ci.yml` — re-enable E2E job

### 3.2 Unit Coverage: Broaden Scope and Raise to 80%

**Current state:** `vitest.config.ts` has 95% thresholds but only covers 5 specific paths (4 components + `src/lib/numerology/**`). This means 95% coverage on a narrow slice, not the full codebase.

**Goal:** Broaden the coverage `include` to cover all application code, then enforce 80% across the broader scope.

**Coverage config changes (`vitest.config.ts`):**
- Replace the narrow `include` list with a broad pattern: `['src/**/*.{ts,tsx}']`
- Keep existing `exclude` list (shadcn/ui, config files, types, etc.)
- Add to exclude: `src/pages/**` (page components are covered by E2E), `src/integrations/**` (auto-generated Supabase types)
- Lower thresholds from 95% to 80% lines, 80% functions, 70% branches, 80% statements
- Also update (or remove) the separate 60% CI gate script in `ci.yml` — vitest's built-in threshold enforcement makes it redundant

**Priority test areas (highest impact first):**

1. **Services layer** (`src/services/`)
   - `reading.ts` — reading generation calls, error handling, depth modes
   - `stripe.ts` — checkout session creation, subscription management
   - Auth flow utilities

2. **Components** (`src/components/`)
   - `ReadingForm.tsx` — input validation, form submission, error states
   - `CompatibilityForm.tsx` — two-person input handling
   - `ReadingCard.tsx` — rendering with various reading data shapes
   - `ReadingActions.tsx` — copy/share behavior

3. **Hooks** (`src/hooks/`)
   - Custom hooks for readings, auth state, credits balance
   - TanStack Query hook wrappers

### 3.3 Edge Function Tests (Separate Scope)

Edge functions live in `supabase/functions/`, outside `src/`. They are **not** included in the `src/**` coverage denominator and should not be.

**Approach:** Test edge functions separately in CI without forcing them into the same coverage threshold:
- `generate-reading-v4/` — handler tests with mocked OpenAI
- `create-checkout-session/` — Stripe session creation
- `stripe-webhook/` — event processing and credit grants
- Run via a separate Deno test step in CI, not the Vitest pipeline

**Testing approach (all unit tests):**
- Use Vitest + Testing Library for component tests
- Use Happy DOM (already configured) for DOM environment
- Mock external APIs (OpenAI, Stripe) at the HTTP boundary, not at the service level
- Use Supabase local emulator for integration tests where possible

**Exclusions:**
- No snapshot testing
- No 100% coverage target
- No mocking Supabase in integration tests

---

## 4. Mobile Apps (Capacitor)

### 4.1 Platform Requirements

- **iOS minimum:** iOS 16+ (Capacitor 7 default)
- **Android minimum:** API 23 (Android 6.0+), target API 34+
- Real-device QA is mandatory — emulators lie with a straight face

### 4.2 Capacitor Configuration

**Current state:** `capacitor.config.ts` already has `webDir: 'dist'` and `server.url` is commented out. Both `ios/` and `android/` platform directories already exist. The `appId` is still the Lovable default and needs changing.

**Changes:**
- Update `capacitor.config.ts`: change `appId` to `com.vyberology.app`, update `appName` to `Vyberology`
- Run `npx cap sync` to update existing iOS and Android projects (NOT `cap add` — platforms already exist)

**App assets (via `@capacitor/assets`):**
- Icon source: at least 1024x1024 PNG (`assets/icon-only.png`)
- Icon foreground/background: for adaptive icons on Android (`assets/icon-foreground.png`, `assets/icon-background.png`)
- Splash source: at least 2732x2732 PNG (`assets/splash.png`) — Capacitor requires this size for proper scaling across all device sizes
- Dark splash variant: `assets/splash-dark.png` (optional)

### 4.3 iOS Configuration

**`ios/App/App/Info.plist` — existing permissions (update wording if needed):**

The following keys already exist in Info.plist. Review and update descriptions:
```xml
<key>NSCameraUsageDescription</key>
<string>Vyberology needs camera access to capture frequency numbers and patterns in photos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Vyberology needs photo library access to select images with frequency numbers.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Vyberology needs permission to save reading images to your photo library.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Vyberology needs microphone access for voice commands like "Hey Lumen".</string>
```

**Signing:** Requires Apple Developer account ($99/year), provisioning profiles, certificates.

### 4.4 Android Configuration

**`android/app/src/main/AndroidManifest.xml` — use modern permissions:**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<!-- Android 13+ (API 33+) granular media permissions -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<!-- Fallback for Android 12 and below -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
```

**Remove:** `WRITE_EXTERNAL_STORAGE` — deprecated, Capacitor camera uses `FileProvider` (already configured in manifest).

**Signing:** Generate release keystore, configure Gradle for signed builds.

### 4.5 Capacitor Plugin Installation

**Already installed:**
- `@capacitor/app`, `@capacitor/camera`, `@capacitor/core`, `@capacitor/cli`
- `@capacitor/ios`, `@capacitor/android`, `@capacitor/screen-reader`
- `@sentry/capacitor` (native Sentry integration — configure DSN in Capacitor plugin setup during mobile workstream)

**Need to install:**
```bash
npm install @capacitor/status-bar @capacitor/haptics @capacitor/splash-screen \
  @capacitor/keyboard @capacitor/share @capacitor/browser
npx cap sync
```

### 4.6 Mobile UX Polish

Changes to the web app CSS/JS to feel native when wrapped:

**Safe areas:**
- Add `viewport-fit=cover` to `index.html` meta viewport tag
- Apply `env(safe-area-inset-*)` padding to header, footer, and bottom nav
- Use CSS custom properties for consistent safe area handling

**Status bar:**
- Use `@capacitor/status-bar` where supported
- Match status bar style to app theme (light/dark)
- Validate Android 15+ edge-to-edge behavior on real devices — `overlaysWebView` may not work as expected on newer Android; treat this as a QA item, not assumed plugin magic

**Navigation:**
- Detect native platform via `Capacitor.isNativePlatform()`
- Show bottom tab bar on native (Home, Reading, Compatibility, History, Settings)
- Keep existing top nav on web
- Implement native back button handling on Android via `@capacitor/app`

**Native interactions:**
- `@capacitor/haptics` — tactile feedback on button taps, reading reveals
- `@capacitor/splash-screen` — branded splash with auto-hide after app load (config already has `SplashScreen` plugin entry)
- `@capacitor/keyboard` — auto-scroll inputs above keyboard on form pages
- `@capacitor/share` — native share sheet for reading results
- `@capacitor/browser` — open external links (terms, privacy) in in-app browser

**Deep links:**
- Configure universal links (iOS) and app links (Android)
- `vyberology.com/reading/:slug` opens the reading in-app if installed
- Serve `apple-app-site-association` JSON file from `vyberology.com/.well-known/` (configure in `netlify.toml`)
- Serve `assetlinks.json` from `vyberology.com/.well-known/` for Android App Links
- Fallback to web if app not installed
- **Deep link test matrix (required before shipping):**
  - iOS cold start deep link
  - iOS warm app deep link
  - Android cold start deep link
  - Android back-stack behavior after deep link
  - Fallback-to-web when app not installed

### 4.7 Build Pipeline

- Add npm scripts: `cap:sync` (`npm run build && npx cap sync`), `cap:ios`, `cap:android`
- Document Xcode and Android Studio build steps in README
- Manual builds for v1 (no CI mobile builds yet)

### 4.8 Distribution

- **iOS:** TestFlight for beta → App Store submission
- **Android:** Google Play internal testing → production track
- App Store listing: screenshots, description, keywords, privacy nutrition labels
- Google Play: data safety form, store listing

### 4.9 Existing Expo App

The `apps/mobile/` Expo app is superseded by Capacitor as the mobile strategy. It remains in the monorepo but is not the shipping mobile path. No changes to it in this workstream.

### 4.10 Exclusions

- No platform-specific UI frameworks (no NativeBase, no React Native components)
- No offline mode for v1 (readings require API calls)
- No CI mobile builds for v1

---

## 5. Payments — Unified IAP + Stripe

### 5.1 Product Tiers (All Platforms)

The app has **4 tiers** — all one-time purchases (not subscriptions):

| Tier | Price | Depth | Web | iOS | Android |
|------|-------|-------|-----|-----|---------|
| Free | $0 | free | ✅ | ✅ | ✅ |
| Lyf-Path | $9.97 | lite (~200 words) | Stripe | Apple IAP | Google Play |
| Full Vybe | $19.97 | standard (~500 words) | Stripe | Apple IAP | Google Play |
| Deep Attunement | $39.97 | deep (~1000 words) | Stripe | Apple IAP | Google Play |

**Payment model:** One-time purchases that grant reading credits. Credits are spendable and depletable — users can buy multiple times. The existing `reading_credits` system stays as-is.

**IAP product type: Consumable.** Because credits are spent on readings and can be repurchased, these are **consumable** products in both stores — NOT non-consumables. Apple defines consumables as "products that are used once and depleted." Non-consumables are permanent and cannot be re-purchased. Using the wrong type would prevent users from buying credits more than once.

**Pricing:** Same across all platforms. Store commission is absorbed — assume it will reduce net mobile revenue materially. Finance should verify exact rates in the actual App Store Connect and Play Console accounts before launch. Apple Small Business Program (15% if under $1M/year) is likely applicable. Google rates vary by product/program; verify in Play Console.

### 5.2 RevenueCat Integration (Mobile IAP)

**Why RevenueCat:**
- Handles StoreKit 2 (Apple) and Google Play Billing complexity
- Receipt validation with Apple/Google servers
- Purchase lifecycle management
- Single webhook endpoint instead of two separate integrations
- Free tier: up to $2,500 MTR

**Capacitor plugin:** Verify the exact package before implementation. Candidates:
- `@revenuecat/purchases-capacitor` (RevenueCat's maintained SDK)
- `@capgo/capacitor-purchases` (Capgo's wrapper)

Pin the chosen package and version consistently across all references. Do not start implementation until the plugin is verified to work with Capacitor 7.

**Setup steps (prerequisites):**

1. **RevenueCat dashboard:**
   - Create RevenueCat account and project
   - Configure Apple App Store app (requires App Store Connect API key)
   - Configure Google Play Store app (requires Play Console service account)
   - Create 3 **consumable** products mapping to the 3 paid tiers
   - Do **not** attach consumable credit packs to entitlements — RevenueCat would report the entitlement as unlocked forever after one purchase, which is wrong for depletable credits. Credit balance is tracked in the backend ledger. Evaluate RevenueCat Virtual Currencies only if we want RevenueCat-managed balances instead.
   - Configure webhook URL pointing to Supabase edge function
   - Note the RevenueCat API key for mobile SDK

2. **App Store Connect:**
   - Create 3 **consumable** IAP products (one per paid tier)
   - Set pricing in all territories
   - Submit for review (can be done alongside app review)

3. **Google Play Console:**
   - Create 3 **one-time consumable** product items (one per paid tier)
   - Set pricing
   - Activate for internal testing

4. **Install plugin:**
   ```bash
   npm install <verified-revenuecat-capacitor-package>
   npx cap sync
   ```

5. **Environment variables:**
   - `VITE_REVENUECAT_API_KEY` — RevenueCat public API key (safe for client)
   - `REVENUECAT_WEBHOOK_SECRET` — stored in Supabase secrets (for webhook validation)

**Mobile payment flow:**
1. User taps "Upgrade" / selects a tier in the native app
2. Detect platform via `Capacitor.isNativePlatform()`
3. If native: present IAP purchase flow via RevenueCat SDK
4. RevenueCat handles the store transaction
5. RevenueCat webhook fires to Supabase edge function `validate-iap-receipt/`
6. Edge function validates webhook signature (RevenueCat uses `Authorization: Bearer <webhook_secret>` header), then calls `add_reading_credits()`
7. On Android, confirm the purchase is acknowledged and consumed so the same SKU can be repurchased
8. App refreshes credit balance from backend

**Web payment flow (unchanged):**
1. User taps "Upgrade" / selects a tier on web
2. Stripe Checkout session created via `create-checkout-session/` edge function
3. User completes payment on Stripe
4. Stripe webhook fires to `stripe-webhook/` edge function
5. Edge function grants credits via `add_reading_credits()`

### 5.3 Backend Changes

**New edge function: `validate-iap-receipt/`**
- Receives webhook payload from RevenueCat
- Validates `Authorization: Bearer <secret>` header against `REVENUECAT_WEBHOOK_SECRET` stored in Supabase secrets
- Returns 401 for missing/invalid signatures (critical security gate)
- Maps RevenueCat event type to internal action:
  - `INITIAL_PURCHASE` / `NON_RENEWING_PURCHASE` → grant credits
  - `CANCELLATION` / `REFUND` → revoke credits if applicable
- Calls `add_reading_credits()` for grants
- Logs to `credit_transactions` for attribution
- Idempotent: uses RevenueCat event ID to prevent duplicate processing via `iap_webhook_events` table

**Stripe webhook idempotency:**
The existing `stripe-webhook/` edge function should also be hardened with an idempotency check on the Stripe event ID before granting credits. Duplicate webhook deliveries are normal — add a guard:
```typescript
// Check if event already processed
const { data: existing } = await supabase
  .from('stripe_webhook_events')
  .select('event_id')
  .eq('event_id', event.id)
  .single();
if (existing) return new Response('Already processed', { status: 200 });
```

Add a `stripe_webhook_events` table (same pattern as `iap_webhook_events`) to the migration.

**Database migration (`supabase/migrations/YYYYMMDD_iap_support.sql`):**

```sql
-- 0. Security hotfix (can also be deployed as separate earlier migration)
REVOKE EXECUTE ON FUNCTION add_reading_credits FROM authenticated;
REVOKE EXECUTE ON FUNCTION add_reading_credits FROM anon;
-- Verify search_path is pinned on the function

-- 1. Track payment platform on purchases
ALTER TABLE purchases ADD COLUMN platform TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE purchases ADD COLUMN platform_transaction_id TEXT;

-- Make stripe_payment_intent_id nullable (IAP purchases have no Stripe intent)
ALTER TABLE purchases ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

-- 2. Credit transaction ledger for per-purchase attribution
-- (reading_credits is a single-row balance per user — not suitable for per-source tracking)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- positive = grant, negative = usage
  source TEXT NOT NULL DEFAULT 'stripe', -- 'stripe', 'apple', 'google'
  source_transaction_id TEXT, -- Stripe payment intent ID, RevenueCat transaction ID, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- 3. Idempotency tables for webhook processing
CREATE TABLE IF NOT EXISTS iap_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  payload JSONB
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);
```

### 5.4 Stripe Goes Live

**Current state:** `tiers.ts` already has what appear to be live Stripe price IDs (`price_1SzVjT...`). Need to verify whether these are test or live mode prices.

**Steps:**
1. Verify existing price IDs in Stripe dashboard — determine if they're test or live
2. If test: create live products/prices for all 4 tiers, update `TIER_PRICE_ID` in `tiers.ts`
3. If already live: no price ID changes needed
4. Update Supabase secrets with live keys:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → `whsec_...` (for live endpoint)
5. Update Netlify env vars:
   - `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
6. Register production webhook endpoint in Stripe dashboard
7. **Switchover procedure:** Deploy the updated webhook secret first, then swap the publishable key. Test with a small real transaction before announcing.

### 5.5 App Store Compliance

**Required UI elements:**

Since we are selling **consumable** credits, the restore story is account-based, not store-based:

- **"Sync Account Balance" in settings** — signs the user back into their Supabase account and refreshes credit balance from the backend. This is the primary recovery mechanism for consumable purchases. The backend ledger is the source of truth, not the store's purchase history.
- **"Restore Purchases" button** — still present for App Review compliance, but for consumables it mainly serves as a user confidence measure. If non-consumable products are added later, this becomes load-bearing.
- Clear purchase terms displayed before IAP (price, what you get, that credits are consumed on use)
- No mention of web pricing or alternative payment methods in-app (store policy for standard distribution)

**App Store review preparation:**
- Privacy nutrition labels (iOS) — declare: name, DOB, email, purchase history
- Data safety form (Android) — equivalent disclosure
- Review guidelines compliance check before submission

**Mobile purchase QA matrix (required before submission):**
- Fresh purchase (each tier)
- Repeat purchase of same tier (verify consumable re-purchase works)
- Refund/revocation handling (webhook triggers credit deduction)
- App reinstall + account sign-in recovery (credits restored via backend)
- Sandbox testing (iOS) and test account testing (Android)

### 5.6 Exclusions

- No subscription model — one-time consumable purchases only (matching existing Stripe model)
- No promotional offers or free trials for v1
- Cross-platform access is account-based, not transaction-based. Remaining credit balance follows the user account.
- No Stripe billing portal changes

---

## 6. Dependencies & Risks

### External Account Requirements
- Apple Developer account ($99/year) — for iOS builds, IAP, and App Store submission
- Google Play Developer account ($25 one-time) — for Android builds, IAP, and Play Store submission
- RevenueCat account (free tier up to $2,500 MTR) — for IAP management
- Stripe live mode activation — identity verification may be required

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| App Store rejection (content policy) | Delays launch 1-2 weeks | Review guidelines pre-submission, prepare appeal |
| Apple rejects IAP product pricing/descriptions | Blocks mobile payments | Submit products early, iterate |
| RevenueCat webhook missed / duplicate | Credits wrong | Idempotent processing via event tables, monitoring |
| Stripe webhook duplicate delivery | Double credit grants | Idempotency table for Stripe events (same pattern as IAP) |
| Capacitor plugin compatibility issues | Blocks native features | Pin plugin versions, test on real devices early |
| Stripe live mode requires business verification | Delays web payments | Start verification process immediately |
| `add_reading_credits` security hole exploited before fix | Free credits for attackers | Deploy the REVOKE migration first, before any other changes |
| Deep links require domain verification files | Links don't open app | Deploy `.well-known/` files to Netlify early and verify |
| Android 15+ edge-to-edge status bar changes | Visual bugs on newest Android | QA on real Android 15 device, don't assume plugin handles it |
| RevenueCat Capacitor plugin version mismatch | IAP broken at build time | Verify plugin compatibility with Capacitor 7 before starting payments work |

---

## 7. Success Criteria

- [ ] `add_reading_credits` restricted to service role only (with `search_path` verified)
- [ ] E2E tests pass in CI (GitHub Actions)
- [ ] Unit test coverage ≥ 80% lines across broadened `src/**` scope
- [ ] Edge function tests pass in CI (separate Deno test step)
- [ ] iOS app runs on physical device with full reading flow
- [ ] Android app runs on physical device with full reading flow
- [ ] Deep link test matrix passes (cold start, warm app, back-stack, fallback-to-web)
- [ ] Android 15+ edge-to-edge QA validated on real device
- [ ] iOS app submitted to App Store review
- [ ] Android app submitted to Google Play review
- [ ] Stripe live payments working on web (real transaction test)
- [ ] Stripe webhook idempotency verified (duplicate events don't double-grant)
- [ ] Apple IAP working in TestFlight (consumable purchase + re-purchase)
- [ ] Google Play IAP working in internal testing (consumable purchase + re-purchase)
- [ ] Credits granted correctly from all 3 payment sources (Stripe, Apple, Google)
- [ ] Account-based credit recovery works after app reinstall
- [ ] `CLAUDE.md` updated to reflect new Capacitor appId, Android permissions, payment architecture
