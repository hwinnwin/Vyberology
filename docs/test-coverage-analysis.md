# Test Coverage Analysis & Improvements

**Date:** 2026-03-28
**Status:** All coverage thresholds PASSING

## Coverage Summary (After Improvements)

### apps/web (main application)

| Metric     | Before | After  | Threshold | Status |
|------------|--------|--------|-----------|--------|
| Statements | 55.84% | 90.37% | 80%       | PASS   |
| Branches   | 88.76% | 89.52% | 70%       | PASS   |
| Functions  | 73.84% | 86.93% | 80%       | PASS   |
| Lines      | 55.84% | 90.37% | 80%       | PASS   |

### Test Suite: 46 files, 409 tests, all passing

---

## What Was Done

### New Test Files Created (13)

| File | Module Tested | Coverage Result |
|------|--------------|-----------------|
| `src/lib/__tests__/readingInsights.test.ts` | Reading pattern intelligence (analyseReadingPatterns, buildLumynGreeting) | 0% → 99.5% |
| `src/lib/__tests__/generateReflection.test.ts` | AI reflection generation via vybeApi | 0% → 100% |
| `src/lib/__tests__/lumynEntitlement.test.ts` | Client-side subscription entitlement resolver | 0% → 100% |
| `src/lib/__tests__/lumynContext.test.ts` | Chat context builder (history, patterns, profile) | 0% → 62.2% |
| `src/lib/__tests__/native.test.ts` | Haptic, share, browser, back button utils | 0% → 86.7% |
| `src/services/__tests__/lumynApi.test.ts` | SSE streaming chat client | 0% → 93.5% |
| `src/services/__tests__/lumynTts.test.ts` | Text-to-speech service | 0% → 76.6% |
| `src/hooks/__tests__/useLumynEntitlement.test.ts` | Entitlement hook (auth + Supabase query) | 0% → 100% |
| `src/hooks/__tests__/useSpeechInput.test.ts` | Web Speech API voice input hook | 0% → 79.2% |
| `src/components/__tests__/LumynChatFab.test.tsx` | Chat FAB component (open/close, send, threads) | 0% → 70.6% |
| `src/components/__tests__/LumynPaywallCard.test.tsx` | Paywall upgrade card | 0% → 100% |
| `src/components/__tests__/LumynThreadList.test.tsx` | Conversation thread list | 0% → 100% |
| `src/components/__tests__/NativeTabBar.test.tsx` | Mobile tab bar navigation | 0% → 100% |

### Existing Test Files Expanded (7)

| File | Changes | Coverage Result |
|------|---------|-----------------|
| `src/lib/__tests__/readingHistory.test.ts` | Added: `updateReadingReflection`, `clearHistory` error path, `deleteReading` error path | 78% → 82.2% |
| `src/services/__tests__/reading.test.ts` | Added: SERVICE_UNAVAILABLE, TIMEOUT, RATE_LIMIT, UNKNOWN_ERROR error mapping | 71.1% → 100% |
| `src/services/__tests__/purchase.test.ts` | Added: native IAP path, unknown tier, Stripe error, IAP error, cancellation | 62.1% → 100% |
| `src/services/__tests__/iap.test.ts` | Added: initIAP, setIAPUserId, purchaseProduct, purchaseSubscription (all paths) | 31.8% → 100% |
| `src/hooks/__tests__/useNavigation.test.ts` | Added: goBack with history, goBack without history, navigation logging | 56.1% → 100% |
| `src/hooks/__tests__/use-toast.test.ts` | Added: toast() function, useToast hook integration, dismiss all/specific | 53.6% → 90.4% |
| `src/components/__tests__/ReadingActions.test.tsx` | Added: navigator.share, abort fallback, clipboard fallback, className | 40.4% → 88.5% |

---

## Current Coverage by Module

### Fully Covered (100%)

- `lib/numerology/*` (99.8% overall, most files at 100%)
- `lib/utils.ts`, `lib/tiers.ts`, `lib/navigationLogger.ts`
- `lib/lumynEntitlement.ts`, `lib/generateReflection.ts`
- `components/ReadingForm.tsx`, `components/ReadingCard.tsx`, `components/CompatibilityForm.tsx`
- `components/NativeTabBar.tsx`, `components/LumynPaywallCard.tsx`, `components/LumynThreadList.tsx`
- `hooks/useNavigation.ts`, `hooks/useLumynEntitlement.ts`
- `services/iap.ts`, `services/purchase.ts`, `services/reading.ts`

### Well Covered (80-99%)

| Module | Stmts | Notes |
|--------|-------|-------|
| `lib/readingInsights.ts` | 99.5% | 1 uncovered line |
| `lib/analytics.ts` | 95.2% | |
| `services/lumynApi.ts` | 93.5% | Buffer flush edge case |
| `hooks/use-toast.ts` | 90.4% | Internal update/onOpenChange |
| `components/ReadingActions.tsx` | 88.5% | Analytics error callback |
| `hooks/use-mobile.tsx` | 86.7% | |
| `lib/native.ts` | 86.7% | Android back button handler |
| `lib/readingHistory.ts` | 82.2% | Sentry error path |

### Remaining Gaps (below 80%)

| Module | Stmts | Why | Suggested Action |
|--------|-------|-----|-----------------|
| `hooks/useSpeechInput.ts` | 79.2% | Desktop restart loop, mobile path | Minor — edge case restart logic |
| `services/lumynTts.ts` | 76.6% | Audio playback, abort signal combining | Needs Audio/Blob mocking |
| `components/LumynChatFab.tsx` | 70.6% | Complex stateful component, handleSend error paths | Add error/paywall flow tests |
| `lib/featureFlags.ts` | 71.9% | Environment-specific logic | |
| `lib/platform.ts` | 66.7% | `initPlatform()` | Needs Capacitor mock toggle |
| `lib/lumynContext.ts` | 62.2% | Supabase reads (fetchSupabaseReadings, fetchUserProfile) | Mock auth user + DB |
| `lib/i18n.ts` | 0% | Config-only file (i18next init) | Low value — exclude from coverage |
| `stubs/purchases-capacitor.ts` | 0% | Stub file | Exclude from coverage |
| `types/lumyn.ts` | 0% | Type-only file | Exclude from coverage |

---

## Running Tests

```bash
# Run all tests
pnpm --filter vite_react_shadcn_ts test:run

# Run with coverage
pnpm --filter vite_react_shadcn_ts test:coverage

# Run specific test file
pnpm --filter vite_react_shadcn_ts test:run -- src/lib/__tests__/readingInsights.test.ts
```

## Test Architecture

- **Framework:** Vitest + happy-dom
- **Component Testing:** @testing-library/react + userEvent
- **Coverage Provider:** V8
- **Global Setup:** `src/test/setup.ts` provides mocks for localStorage, Supabase, Capacitor, RevenueCat, Web Speech API, and mediaDevices
- **E2E:** Playwright (3 tests in `tests/e2e/`)

## Completed Recommendations

1. ~~Exclude type-only/config files from coverage~~ — Done: `i18n.ts`, `types/**`, `stubs/**` now excluded
2. ~~Un-exclude tested services~~ — Done: `stripe.ts` and `readings.ts` now count toward coverage
3. ~~reading-engine function gap~~ — Done: `ensureTokens` + null-value tests added (97.56% → 98.78%)

## Remaining Recommendations

1. **Add Supabase Edge Function tests** — `generate-reading-v4`, `lumyn-chat`, `create-checkout-session` have no tests (Deno runtime, different test setup)
2. **Expand E2E tests** — Only 3 Playwright tests; add compatibility flow, history, payment flows
