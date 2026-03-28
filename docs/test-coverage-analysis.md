# Test Coverage Analysis

**Date:** 2026-03-28
**Overall Status:** Coverage thresholds NOT met — 55.84% statements vs 80% target

## Current Coverage Summary

### apps/web (main application)

| Metric     | Actual | Threshold | Status |
|------------|--------|-----------|--------|
| Statements | 55.84% | 80%       | FAIL   |
| Branches   | 88.76% | 70%       | PASS   |
| Functions  | 73.84% | 80%       | FAIL   |
| Lines      | 55.84% | 80%       | FAIL   |

### packages/reading-engine

| Metric     | Actual | Threshold | Status |
|------------|--------|-----------|--------|
| Statements | 98.40% | 98%       | PASS   |
| Branches   | 90.48% | 90%       | PASS   |
| Functions  | 97.56% | 98%       | FAIL   |
| Lines      | 98.40% | 98%       | PASS   |

### Test Suite: 33 files, 256 tests, all passing

---

## Coverage Breakdown by Area

### Well-Covered (>90%)

| Module | Stmts | Notes |
|--------|-------|-------|
| `lib/numerology/*` | 99.8% | Excellent — core business logic |
| `lib/utils.ts` | 100% | |
| `lib/tiers.ts` | 100% | |
| `lib/navigationLogger.ts` | 100% | |
| `components/ReadingForm.tsx` | 100% | |
| `components/ReadingCard.tsx` | 100% | |
| `components/CompatibilityForm.tsx` | 100% | |
| `lib/analytics.ts` | 95.2% | |

### Partially Covered (30-80%)

| Module | Stmts | Gap Description |
|--------|-------|-----------------|
| `lib/readingHistory.ts` | 78.0% | Missing: error paths in `getHistory`, `clearHistory` |
| `lib/featureFlags.ts` | 71.9% | Missing: environment-specific flag logic |
| `services/reading.ts` | 71.1% | Missing: retry logic, edge function error variants |
| `lib/platform.ts` | 66.7% | Missing: `isCapacitor()`, `getPlatformInfo()` |
| `services/purchase.ts` | 62.1% | Missing: native IAP branch, error handling |
| `hooks/useNavigation.ts` | 56.1% | Missing: `navigateToReading`, `navigateBack` |
| `hooks/use-toast.ts` | 53.6% | Missing: toast dismiss, update, limit logic |
| `components/ReadingActions.tsx` | 40.4% | Missing: share/copy handlers |
| `services/iap.ts` | 31.8% | Missing: actual purchase flows, restore |

### Zero Coverage (0%) — Not Excluded from Metrics

| Module | Lines | Priority |
|--------|-------|----------|
| `components/LumynChatFab.tsx` | 379 | **HIGH** — large, complex component |
| `lib/readingInsights.ts` | 291 | **HIGH** — business logic, easily testable |
| `hooks/useSpeechInput.ts` | 197 | MEDIUM — requires browser API mocks |
| `lib/lumynContext.ts` | 163 | MEDIUM — context-building logic |
| `components/LumynThreadList.tsx` | 120 | MEDIUM — UI component |
| `services/lumynApi.ts` | 96 | **HIGH** — service layer, testable |
| `services/lumynTts.ts` | 94 | MEDIUM — service layer |
| `hooks/useLumynEntitlement.ts` | 57 | LOW — small hook |
| `components/LumynPaywallCard.tsx` | 52 | LOW — small UI |
| `lib/lumynEntitlement.ts` | 16 | LOW — small utility |
| `components/NativeTabBar.tsx` | 41 | LOW — small UI |
| `lib/native.ts` | 55 | LOW — platform glue |
| `lib/i18n.ts` | 44 | LOW — configuration |
| `lib/generateReflection.ts` | 44 | MEDIUM — business logic |
| `components/PairReadingCard.tsx` | ~50 | LOW — UI only |
| `stubs/purchases-capacitor.ts` | 14 | SKIP — stub file |
| `types/lumyn.ts` | 51 | SKIP — type-only file |

---

## Top Recommendations

### Priority 1: High-Impact, Easy Wins

These modules contain pure business logic that is straightforward to test without complex mocking:

#### 1. `src/lib/readingInsights.ts` (0% → target 90%+)
- 291 lines of insight derivation logic
- Pure functions operating on reading data
- No external dependencies — just input/output
- **Estimated effort:** ~1 hour

#### 2. `src/lib/generateReflection.ts` (0% → target 90%+)
- 44 lines of reflection text generation
- Small, focused module
- **Estimated effort:** ~30 min

#### 3. `src/lib/readingHistory.ts` (78% → target 95%+)
- Already mostly covered; just needs error path and edge case tests
- Lines 165-166, 227-236 uncovered
- **Estimated effort:** ~30 min

#### 4. `src/services/purchase.ts` (62% → target 85%+)
- Missing the native IAP code path (lines 20-29, 41-42)
- Mocks already exist in test setup for RevenueCat
- **Estimated effort:** ~45 min

### Priority 2: Service Layer Coverage

#### 5. `src/services/lumynApi.ts` (0% → target 80%+)
- 96 lines — API client for the AI assistant
- Can be tested by mocking Supabase function calls (mocks already in setup)
- **Estimated effort:** ~1 hour

#### 6. `src/services/iap.ts` (31.8% → target 75%+)
- In-app purchase service with RevenueCat
- Mocks exist; needs tests for purchase flow, restore, and error handling
- **Estimated effort:** ~1 hour

#### 7. `src/services/reading.ts` (71.1% → target 90%+)
- Missing retry/fallback logic coverage (lines 99-104, 136-158)
- **Estimated effort:** ~45 min

### Priority 3: Hook & Component Coverage

#### 8. `src/hooks/use-toast.ts` (53.6% → target 85%+)
- Core UI utility used across the app
- Missing dismiss, update, and toast-limit logic
- **Estimated effort:** ~45 min

#### 9. `src/hooks/useNavigation.ts` (56.1% → target 85%+)
- Missing `navigateToReading` and `navigateBack` paths
- Router mock already exists
- **Estimated effort:** ~30 min

#### 10. `src/components/ReadingActions.tsx` (40.4% → target 80%+)
- Share and copy action handlers untested
- Needs `navigator.clipboard` and `navigator.share` mocks
- **Estimated effort:** ~45 min

### Priority 4: Lumyn (AI Assistant) Module

The entire Lumyn subsystem has **zero test coverage**:

- `LumynChatFab.tsx` (379 lines) — complex interactive component
- `lumynApi.ts` (96 lines) — API client
- `lumynTts.ts` (94 lines) — text-to-speech
- `lumynContext.ts` (163 lines) — context building
- `useLumynEntitlement.ts` (57 lines) — entitlement hook
- `LumynThreadList.tsx` (120 lines) — conversation history
- `LumynPaywallCard.tsx` (52 lines) — paywall UI

**Total: ~961 untested lines** in a user-facing feature. This is the single largest coverage gap. Start with the service/utility layers (`lumynApi`, `lumynContext`, `lumynEntitlement`) which are easier to test, then move to the components.

### Priority 5: Files Excluded from Coverage That Shouldn't Be

The vitest config excludes many files from coverage that arguably should be measured:

| Excluded File | Reason It Should Be Covered |
|---|---|
| `src/services/stripe.ts` | Has tests already but is excluded — remove exclusion |
| `src/services/readings.ts` | Has tests already but is excluded — remove exclusion |
| `src/lib/saveReading.ts` | Business logic, testable with Supabase mocks |
| `src/lib/vybeApi.ts` | API client, testable with fetch mocks |
| `src/lib/cloudSync.ts` | Sync logic with testable behavior |
| `src/components/ErrorBoundary.tsx` | Critical UX, can test with `@testing-library/react` |
| `src/components/ProtectedRoute.tsx` | Auth guard, testable with Supabase auth mocks |

---

## Structural Recommendations

### 1. Remove Unnecessary Coverage Exclusions
`stripe.ts` and `readings.ts` already have test files — they should count toward coverage. Removing their exclusions would immediately boost the reported numbers.

### 2. Add Integration Tests for Supabase Edge Functions
Only `_shared/capture/capture.test.ts` and two handler tests exist for the backend. The `generate-reading-v4`, `lumyn-chat`, `create-checkout-session`, and `validate-iap-receipt` functions have no tests.

### 3. Expand E2E Test Scenarios
Currently only 3 Playwright tests (smoke, auth flow, reading generation). Consider adding:
- Compatibility flow end-to-end
- Reading history persistence
- Payment/pricing page flows (with mocked Stripe)
- Error boundary behavior on failures

### 4. Add Snapshot Tests for Static Components
Components like `NativeTabBar`, `LumynPaywallCard`, `Footer`, and `LoadingSkeleton` are mostly presentation. Snapshot tests provide cheap regression protection.

### 5. reading-engine: Close the Function Coverage Gap
At 97.56% functions vs 98% threshold, one untested function in `v4/parse.ts` is causing CI failure. This is a quick fix.

---

## Impact Estimate

If Priority 1-3 items are addressed, projected coverage:

| Metric     | Current | Projected | Threshold |
|------------|---------|-----------|-----------|
| Statements | 55.84%  | ~78-82%   | 80%       |
| Functions  | 73.84%  | ~82-85%   | 80%       |
| Lines      | 55.84%  | ~78-82%   | 80%       |

Addressing Priority 4 (Lumyn) and Priority 5 (exclusion cleanup) would push to ~88-92%.
