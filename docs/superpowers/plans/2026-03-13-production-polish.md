# Vyberology Production Polish — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Vyberology production-ready with passing E2E tests, native iOS/Android apps via Capacitor, and unified payments across Stripe + Apple IAP + Google Play.

**Architecture:** Four sequential workstreams: (0) security hotfix for credit-granting function, (1) fix E2E tests and broaden unit coverage to 80%, (2) Capacitor-wrap the web app for iOS/Android with mobile UX polish, (3) integrate RevenueCat for mobile IAP alongside existing Stripe for web, all feeding into the same Supabase credits backend.

**Tech Stack:** React 19, Vite, Capacitor 7, Supabase (PostgreSQL + Edge Functions), Stripe, RevenueCat, Playwright, Vitest, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-13-production-polish-design.md`

---

## Chunk 1: Security Hotfix

### Task 1: Restrict `add_reading_credits` to service role only

**Files:**
- Create: `supabase/migrations/20260313000000_restrict_credit_functions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Restrict credit-granting functions to service role only
-- Security fix: authenticated users can currently call add_reading_credits via RPC

-- Pin search_path to prevent search_path hijacking
ALTER FUNCTION add_reading_credits(UUID, INTEGER, UUID) SET search_path = public;
ALTER FUNCTION use_reading_credit(UUID) SET search_path = public;
ALTER FUNCTION get_user_credits(UUID) SET search_path = public;

-- Revoke execute from non-service roles
REVOKE EXECUTE ON FUNCTION add_reading_credits(UUID, INTEGER, UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION add_reading_credits(UUID, INTEGER, UUID) FROM anon;

-- use_reading_credit and get_user_credits are called from edge functions too,
-- but get_user_credits is read-only and safe for authenticated users.
-- use_reading_credit has its own guard (checks credit balance before deducting).
-- Only add_reading_credits is dangerous because it grants arbitrary credits.
```

- [ ] **Step 2: Test locally with Supabase CLI**

Run:
```bash
cd /Users/mrtungsten/Documents/Projects/_active/vyberology
supabase db reset
```
Expected: Migration applies cleanly, no errors.

- [ ] **Step 3: Verify the restriction works**

Run:
```bash
supabase db diff --use-migra
```
Expected: No pending changes — migration is applied.

- [ ] **Step 4: Deploy to production**

Run:
```bash
supabase db push
```
Expected: Migration applied to production database.

- [ ] **Step 5: Verify edge functions still work**

Test the existing Stripe webhook flow by checking that the `stripe-webhook` edge function (which uses the service role key) can still call `add_reading_credits`. Check Supabase logs after a test purchase or by invoking the health check.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260313000000_restrict_credit_functions.sql
git commit -m "security: restrict add_reading_credits to service role only

Revoke EXECUTE from authenticated and anon roles.
Pin search_path on all credit functions to prevent hijacking."
```

---

## Chunk 2: Testing — E2E Fix

### Task 2: Fix `clearStorage()` helper for CI

**Files:**
- Modify: `apps/web/tests/e2e/helpers.ts:86-91`

- [ ] **Step 1: Update `clearStorage()` to guard against missing browsing context**

Replace the `clearStorage()` method (lines 86-91) in `apps/web/tests/e2e/helpers.ts`:

```typescript
  /**
   * Clear localStorage — must be called AFTER page.goto()
   * In CI, calling before navigation fails because there's no browsing context.
   */
  async clearStorage() {
    try {
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch {
      // No browsing context yet — safe to ignore, storage is already empty
    }
  }
```

- [ ] **Step 2: Run E2E tests locally to verify**

Run:
```bash
cd /Users/mrtungsten/Documents/Projects/_active/vyberology/apps/web
npx playwright test --headed
```
Expected: Tests run without localStorage errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/tests/e2e/helpers.ts
git commit -m "fix: guard clearStorage() against missing browsing context in CI"
```

### Task 3: Re-enable E2E in CI workflow

**Files:**
- Modify: `.github/workflows/ci.yml:79-102`

- [ ] **Step 1: Uncomment and update the E2E job**

Replace lines 79-102 in `.github/workflows/ci.yml` with:

```yaml
  e2e:
    runs-on: ubuntu-latest
    needs: [unit-tests, lint-typecheck]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Enable corepack
        run: corepack enable
      - name: Use workspace pnpm version
        run: corepack prepare pnpm@9.15.4 --activate
      - name: Install dependencies (pnpm)
        run: pnpm install --frozen-lockfile
      - name: Build analytics adapter
        run: pnpm --filter @vybe/analytics-adapter run build
      - name: Install Playwright browsers
        run: pnpm --filter ./apps/web exec playwright install --with-deps chromium
      - name: Build web
        run: pnpm --filter ./apps/web run build
      - name: Run e2e tests
        run: pnpm --filter ./apps/web exec playwright test
      - name: Upload E2E artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results
          path: apps/web/test-results/
```

- [ ] **Step 2: Push to a branch and verify CI passes**

Run:
```bash
git add .github/workflows/ci.yml
git commit -m "ci: re-enable E2E tests with Playwright"
git push
```
Expected: CI workflow runs E2E job. Check GitHub Actions for pass/fail.

- [ ] **Step 3: If E2E fails in CI, debug using uploaded artifacts**

Check the `e2e-results` artifact for screenshots and traces. Fix any remaining issues in the test files.

---

## Chunk 3: Testing — Unit Coverage Broadening

### Task 4: Broaden coverage scope in vitest config

**Files:**
- Modify: `apps/web/vitest.config.ts:15-40`

- [ ] **Step 1: Update coverage config**

Replace the `coverage` section (lines 12-40) in `apps/web/vitest.config.ts`:

```typescript
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
        'src/components/ui/**',
        'android/**',
        'ios/**',
        'dist/**',
        'src/lib/numerology/types.ts',
        'src/pages/**',
        'src/integrations/**',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 0.80,
        functions: 0.80,
        branches: 0.70,
        statements: 0.80,
      },
    },
```

- [ ] **Step 2: Run coverage to see current baseline**

Run:
```bash
cd /Users/mrtungsten/Documents/Projects/_active/vyberology/apps/web
npx vitest run --coverage
```
Expected: Coverage report shows current percentages for the broader scope. Note which files are below 80%.

- [ ] **Step 3: Commit config change**

```bash
git add apps/web/vitest.config.ts
git commit -m "test: broaden coverage scope to src/** with 80% threshold"
```

### Task 5: Update CI coverage gate to match vitest thresholds

**Files:**
- Modify: `.github/workflows/ci.yml:63-72`

- [ ] **Step 1: Remove the manual coverage gate script**

Replace lines 63-72 in `.github/workflows/ci.yml`:

```yaml
      - name: Run unit tests with coverage
        run: pnpm --filter ./apps/web run test:coverage
      # Coverage enforcement is handled by vitest.config.ts thresholds
      # (80% lines, 80% functions, 70% branches, 80% statements)
      # vitest will fail the run if thresholds are not met.
      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-web
          path: apps/web/coverage
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: remove manual coverage gate, use vitest built-in thresholds"
```

### Task 6: Add service layer tests

**Files:**
- Create: `apps/web/src/services/__tests__/reading.test.ts`
- Create: `apps/web/src/services/__tests__/stripe.test.ts`
- Create: `apps/web/src/services/__tests__/readings.test.ts`

- [ ] **Step 1: Write reading service tests**

Create `apps/web/src/services/__tests__/reading.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReading, ReadingError } from '../reading';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');
vi.mock('@/lib/sentry', () => ({
  addBreadcrumb: vi.fn(),
  captureError: vi.fn(),
}));

describe('generateReading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase edge function with correct parameters', async () => {
    const mockResponse = { data: { reading: 'test reading' }, error: null };
    vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

    const result = await generateReading({
      fullName: 'John Doe',
      dobISO: '1990-01-15',
      inputs: [{ label: 'Name', value: 'John Doe' }],
      depth: 'lite',
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'generate-reading',
      expect.objectContaining({
        body: expect.objectContaining({
          fullName: 'John Doe',
          dobISO: '1990-01-15',
        }),
      })
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('throws ReadingError when fullName is empty', async () => {
    await expect(
      generateReading({ fullName: '', inputs: [], depth: 'lite' })
    ).rejects.toBeInstanceOf(ReadingError);
  });

  it('throws ReadingError on edge function error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Function error', context: {} } as any,
    });

    await expect(
      generateReading({
        fullName: 'John',
        dobISO: '1990-01-01',
        inputs: [{ label: 'Name', value: 'John' }],
        depth: 'lite',
      })
    ).rejects.toBeInstanceOf(ReadingError);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run:
```bash
cd /Users/mrtungsten/Documents/Projects/_active/vyberology/apps/web
npx vitest run src/services/__tests__/reading.test.ts
```
Expected: All tests pass.

- [ ] **Step 3: Write stripe service tests**

Create `apps/web/src/services/__tests__/stripe.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckoutSession, getUserCredits, useReadingCredit, refundReadingCredit } from '../stripe';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('stripe service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('invokes create-checkout-session edge function', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/session123' },
        error: null,
      });

      const result = await createCheckoutSession({
        priceId: 'price_123',
        tier: 'lyf-path',
        fullName: 'Jane Doe',
        dob: '1985-06-15',
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'create-checkout-session',
        expect.objectContaining({
          body: expect.objectContaining({ priceId: 'price_123' }),
        })
      );
      expect(result.url).toBe('https://checkout.stripe.com/session123');
    });
  });

  describe('getUserCredits', () => {
    it('returns credit count from RPC (gets user internally)', async () => {
      // getUserCredits() takes no args — calls supabase.auth.getUser() internally
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 5,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      });

      const credits = await getUserCredits();
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_credits', { p_user_id: 'user-123' });
      expect(credits).toBe(5);
    });

    it('returns 0 when user is not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const credits = await getUserCredits();
      expect(credits).toBe(0);
    });
  });

  describe('useReadingCredit', () => {
    it('calls use_reading_credit RPC (gets user internally)', async () => {
      // useReadingCredit() takes no args — calls supabase.auth.getUser() internally
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: true,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      });

      const result = await useReadingCredit();
      expect(result).toBe(true);
    });
  });
});
```

- [ ] **Step 4: Write readings (CRUD) service tests**

Create `apps/web/src/services/__tests__/readings.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveReadingToDb, getUserReadings, getReadingBySlug } from '../readings';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('readings service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveReadingToDb', () => {
    it('calls save_reading RPC with correct params', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { id: 'reading-1', slug: 'abc123' },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      });

      const result = await saveReadingToDb({
        tier: 'lyf-path',
        fullName: 'John Doe',
        dob: '1990-01-15',
        numerologyNumbers: { lifePath: 7 },
        semantics: { tone: 'calm' },
      });

      expect(supabase.rpc).toHaveBeenCalledWith(
        'save_reading',
        expect.objectContaining({ p_tier: 'lyf-path' })
      );
    });
  });

  describe('getReadingBySlug', () => {
    it('fetches reading by share slug', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'r1', slug: 'abc', reading_text: 'Your reading...' },
            error: null,
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await getReadingBySlug('abc');
      expect(supabase.from).toHaveBeenCalledWith('readings');
    });
  });
});
```

- [ ] **Step 5: Run all service tests**

Run:
```bash
npx vitest run src/services/__tests__/
```
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/services/__tests__/
git commit -m "test: add unit tests for reading, stripe, and readings services"
```

### Task 7: Add component tests

**Files:**
- Create: `apps/web/src/components/__tests__/ReadingForm.test.tsx`
- Create: `apps/web/src/components/__tests__/ReadingActions.test.tsx`

- [ ] **Step 1: Write ReadingForm tests**

Create `apps/web/src/components/__tests__/ReadingForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingForm } from '../ReadingForm';

describe('ReadingForm', () => {
  const mockOnGenerate = vi.fn();

  it('renders name and date of birth inputs', () => {
    render(<ReadingForm onGenerate={mockOnGenerate} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  it('validates name is at least 2 characters', async () => {
    render(<ReadingForm onGenerate={mockOnGenerate} />);
    const nameInput = screen.getByLabelText(/name/i);
    const submitButton = screen.getByRole('button', { name: /generate|get|reveal/i });

    await userEvent.type(nameInput, 'A');
    await userEvent.click(submitButton);

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('calls onGenerate with name and DOB on valid submit', async () => {
    render(<ReadingForm onGenerate={mockOnGenerate} />);
    const nameInput = screen.getByLabelText(/name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);
    const submitButton = screen.getByRole('button', { name: /generate|get|reveal/i });

    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(dobInput, '1990-01-15');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith('John Doe', '1990-01-15');
    });
  });

  it('shows loading state when isLoading is true', () => {
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={true} />);
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });
});
```

- [ ] **Step 2: Write ReadingActions tests**

Create `apps/web/src/components/__tests__/ReadingActions.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingActions } from '../ReadingActions';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe('ReadingActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('copies reading text to clipboard on copy click', async () => {
    render(<ReadingActions readingText="Your life path is 7" />);
    const copyButton = screen.getByRole('button', { name: /copy/i });

    await userEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Your life path is 7');
  });

  it('renders share button when Web Share API is available', () => {
    Object.assign(navigator, { share: vi.fn() });
    render(<ReadingActions readingText="Your life path is 7" />);
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run component tests**

Run:
```bash
npx vitest run src/components/__tests__/
```
Expected: All tests pass.

- [ ] **Step 4: Run full coverage check**

Run:
```bash
npx vitest run --coverage
```
Expected: Coverage is trending toward 80%. Note remaining gaps.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/__tests__/
git commit -m "test: add unit tests for ReadingForm and ReadingActions components"
```

### Task 8: Add hook tests

**Files:**
- Create: `apps/web/src/hooks/__tests__/use-mobile.test.ts`
- Create: `apps/web/src/hooks/__tests__/useNavigation.test.ts`

- [ ] **Step 1: Write use-mobile hook test**

Create `apps/web/src/hooks/__tests__/use-mobile.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  it('returns false for desktop viewport', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true for mobile viewport', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Write useNavigation hook test**

Create `apps/web/src/hooks/__tests__/useNavigation.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock react-router-dom before importing the hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/numerology' }),
}));

// Mock analytics
vi.mock('@vybe/analytics-adapter', () => ({
  navigationLogger: { log: vi.fn() },
}));

import { useNavigation } from '../useNavigation';

describe('useNavigation', () => {
  it('goHome navigates to /', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goHome();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
```

- [ ] **Step 3: Run hook tests and check coverage**

Run:
```bash
npx vitest run src/hooks/__tests__/ --coverage
```
Expected: Tests pass. Coverage improves.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/__tests__/
git commit -m "test: add unit tests for useIsMobile and useNavigation hooks"
```

### Task 9: Fill remaining coverage gaps

- [ ] **Step 1: Run coverage and identify files below 80%**

Run:
```bash
npx vitest run --coverage 2>&1 | head -100
```

Review the output. Add tests for any files in `src/services/`, `src/hooks/`, `src/components/`, or `src/lib/` that are below the 80% threshold.

- [ ] **Step 2: Write additional tests for gap files**

For each file below threshold, write minimal tests covering the main exports. Follow the same pattern as Tasks 6-8.

- [ ] **Step 3: Verify 80% threshold passes**

Run:
```bash
npx vitest run --coverage
```
Expected: All thresholds pass (80% lines, 80% functions, 70% branches, 80% statements). Vitest exits with code 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: fill coverage gaps to meet 80% threshold across src/**"
```

---

## Chunk 4: Mobile Apps — Capacitor Setup

### Task 10: Update Capacitor config

**Files:**
- Modify: `apps/web/capacitor.config.ts`

- [ ] **Step 1: Update appId and appName**

Replace contents of `apps/web/capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vyberology.app',
  appName: 'Vyberology',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

- [ ] **Step 2: Commit**

**Important:** Changing `appId` after initial `cap add` requires manual updates in Xcode (bundle identifier) and Android Studio (package name in `build.gradle`). `cap sync` does NOT update these automatically. Update both native projects before syncing.

```bash
git add apps/web/capacitor.config.ts
git commit -m "config: update Capacitor appId to com.vyberology.app"
```

### Task 11: Install Capacitor plugins

**Files:**
- Modify: `apps/web/package.json` (via npm install)

- [ ] **Step 1: Install missing plugins**

Run:
```bash
cd /Users/mrtungsten/Documents/Projects/_active/vyberology/apps/web
npm install @capacitor/status-bar @capacitor/haptics @capacitor/splash-screen \
  @capacitor/keyboard @capacitor/share @capacitor/browser
```
Expected: All packages install successfully.

- [ ] **Step 2: Sync native projects**

Run:
```bash
npx cap sync
```
Expected: iOS and Android projects updated with new plugins.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json ios/ android/
git commit -m "deps: install Capacitor plugins (status-bar, haptics, splash, keyboard, share, browser)"
```

### Task 12: Update Android permissions

**Files:**
- Modify: `apps/web/android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Update to modern Android permissions**

In `AndroidManifest.xml`, find the permissions section and replace:

Remove:
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

Replace with:
```xml
<!-- Android 13+ (API 33+) granular media permissions -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<!-- Fallback for Android 12 and below -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
```

Keep existing `CAMERA` and `RECORD_AUDIO` permissions unchanged.

- [ ] **Step 2: Commit**

```bash
git add apps/web/android/app/src/main/AndroidManifest.xml
git commit -m "fix: modernize Android permissions for API 33+"
```

### Task 13: Add mobile viewport and safe area CSS

**Files:**
- Modify: `apps/web/index.html:6`
- Create: `apps/web/src/styles/mobile-native.css`
- Modify: `apps/web/src/main.tsx` (import CSS)

- [ ] **Step 1: Update viewport meta tag**

In `apps/web/index.html`, change line 6 from:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
To:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

- [ ] **Step 2: Create mobile-native CSS**

Create `apps/web/src/styles/mobile-native.css`:

```css
/* Safe area insets for iOS notch/dynamic island and Android cutouts */
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}

/* Apply safe area padding to the body for native apps */
body.native-app {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  padding-left: var(--safe-area-left);
  padding-right: var(--safe-area-right);
}

/* Bottom tab bar spacing on native */
body.native-app .main-content {
  padding-bottom: calc(64px + var(--safe-area-bottom));
}
```

- [ ] **Step 3: Import in main.tsx**

Add this import near the top of `apps/web/src/main.tsx`:
```typescript
import './styles/mobile-native.css';
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/index.html apps/web/src/styles/mobile-native.css apps/web/src/main.tsx
git commit -m "feat: add viewport-fit=cover and safe area CSS for native apps"
```

### Task 14: Create platform detection utility

**Files:**
- Create: `apps/web/src/lib/platform.ts`

- [ ] **Step 1: Create platform detection module**

Create `apps/web/src/lib/platform.ts`:

```typescript
import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();
export const isIOS = (): boolean => Capacitor.getPlatform() === 'ios';
export const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';
export const isWeb = (): boolean => Capacitor.getPlatform() === 'web';

/**
 * Apply the 'native-app' class to body when running in a native shell.
 * Call this once at app startup.
 */
export function initPlatform(): void {
  if (isNative()) {
    document.body.classList.add('native-app');
  }
}
```

- [ ] **Step 2: Call initPlatform in main.tsx**

Add to `apps/web/src/main.tsx`, before `createRoot`:
```typescript
import { initPlatform } from './lib/platform';
initPlatform();
```

- [ ] **Step 3: Write test**

Create `apps/web/src/lib/__tests__/platform.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { isNative, isWeb } from '../platform';

// Capacitor is mocked in test/setup.ts as web platform
describe('platform', () => {
  it('isNative returns false in test environment', () => {
    expect(isNative()).toBe(false);
  });

  it('isWeb returns true in test environment', () => {
    expect(isWeb()).toBe(true);
  });
});
```

- [ ] **Step 4: Run test**

Run:
```bash
npx vitest run src/lib/__tests__/platform.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/platform.ts apps/web/src/lib/__tests__/platform.test.ts apps/web/src/main.tsx
git commit -m "feat: add platform detection utility for Capacitor native vs web"
```

### Task 15: Create native bottom tab bar

**Files:**
- Create: `apps/web/src/components/NativeTabBar.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/NativeTabBar.tsx`:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Sparkles, Heart, Clock, Settings } from 'lucide-react';
import { isNative } from '@/lib/platform';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/numerology', icon: Sparkles, label: 'Reading' },
  { path: '/compatibility', icon: Heart, label: 'Compat' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function NativeTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!isNative()) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
         style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add NativeTabBar to App.tsx**

In `apps/web/src/App.tsx`, import and add `NativeTabBar` inside the `AppRouter` component, just before the closing `</main>` or after the `<Routes>` block:

```tsx
import NativeTabBar from '@/components/NativeTabBar';
// ... inside AppRouter, after </Routes>:
<NativeTabBar />
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/NativeTabBar.tsx apps/web/src/App.tsx
git commit -m "feat: add native bottom tab bar for Capacitor mobile apps"
```

### Task 16: Add native interaction helpers (haptics, share, back button)

**Files:**
- Create: `apps/web/src/lib/native.ts`

- [ ] **Step 1: Create native interaction module**

Create `apps/web/src/lib/native.ts`:

```typescript
import { isNative, isAndroid } from './platform';

/**
 * Trigger haptic feedback on native platforms.
 * No-op on web.
 */
export async function hapticTap(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

/**
 * Share content via native share sheet, falling back to clipboard on web.
 */
export async function nativeShare(data: { title: string; text: string; url?: string }): Promise<boolean> {
  if (isNative()) {
    const { Share } = await import('@capacitor/share');
    await Share.share(data);
    return true;
  }
  if (navigator.share) {
    await navigator.share(data);
    return true;
  }
  return false;
}

/**
 * Open a URL in the in-app browser (native) or new tab (web).
 */
export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

/**
 * Register Android back button handler.
 * Call once at app startup.
 */
export async function registerBackButton(onBack: () => void): Promise<void> {
  if (!isAndroid()) return;
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      onBack();
    } else {
      App.exitApp();
    }
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/native.ts
git commit -m "feat: add native interaction helpers (haptics, share, browser, back button)"
```

### Task 17: Add Capacitor build scripts

**Files:**
- Modify: `apps/web/package.json` (scripts section)

- [ ] **Step 1: Add cap scripts to package.json**

Add these scripts to the `scripts` section of `apps/web/package.json`:

```json
"cap:sync": "npm run build && cap sync",
"cap:ios": "cap run ios",
"cap:android": "cap run android",
"cap:open:ios": "cap open ios",
"cap:open:android": "cap open android"
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/package.json
git commit -m "config: add Capacitor build and run scripts"
```

### Task 18: Add deep link well-known files

**Files:**
- Create: `apps/web/public/.well-known/apple-app-site-association`
- Create: `apps/web/public/.well-known/assetlinks.json`
- Modify: `netlify.toml` (root — the Netlify build config)

- [ ] **Step 1: Create apple-app-site-association**

Create `apps/web/public/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.vyberology.app",
        "paths": ["/r/*", "/reading/*"]
      }
    ]
  }
}
```

Note: Replace `TEAM_ID` with the actual Apple Developer Team ID after enrollment.

- [ ] **Step 2: Create assetlinks.json**

Create `apps/web/public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.vyberology.app",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
    }
  }
]
```

Note: Replace `SHA256_FINGERPRINT_HERE` with the actual signing certificate fingerprint after generating the release keystore.

- [ ] **Step 3: Add headers in netlify.toml for well-known files**

Add to `netlify.toml`:

```toml
[[headers]]
  for = "/.well-known/apple-app-site-association"
  [headers.values]
    Content-Type = "application/json"

[[headers]]
  for = "/.well-known/assetlinks.json"
  [headers.values]
    Content-Type = "application/json"
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/public/.well-known/ netlify.toml
git commit -m "feat: add deep link verification files for iOS and Android"
```

### Task 19: Build and test on real devices

- [ ] **Step 1: Build and sync**

Run:
```bash
cd /Users/mrtungsten/Documents/Projects/_active/vyberology/apps/web
npm run build && npx cap sync
```

- [ ] **Step 2: Open in Xcode and run on iOS device**

Run:
```bash
npx cap open ios
```
In Xcode: select your device, set signing team, build and run. Verify:
- App loads with splash screen
- Safe areas respected (no content under notch/dynamic island)
- Bottom tab bar visible and functional
- All pages navigate correctly
- Reading form works end-to-end

- [ ] **Step 3: Open in Android Studio and run on Android device**

Run:
```bash
npx cap open android
```
In Android Studio: select your device, build and run. Verify:
- App loads correctly
- Back button works (navigates or exits)
- Status bar styled correctly
- Test on Android 15 device if available for edge-to-edge validation

- [ ] **Step 4: Run deep link test matrix**

Test each scenario manually:
- [ ] iOS cold start deep link: `vyberology.com/r/test-slug`
- [ ] iOS warm app deep link
- [ ] Android cold start deep link
- [ ] Android back-stack after deep link
- [ ] Fallback to web when app not installed

- [ ] **Step 5: Commit any fixes**

```bash
git add apps/web/src/ apps/web/ios/ apps/web/android/
git commit -m "fix: mobile QA fixes from device testing"
```

### Task 19b: Wire up native handlers in App.tsx

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/main.tsx`

- [ ] **Step 1: Initialize IAP and back button in App.tsx**

In `apps/web/src/App.tsx`, inside the `App` component (after analytics init), add:

```tsx
import { registerBackButton } from '@/lib/native';
import { initIAP, setIAPUserId } from '@/services/iap';
import { useNavigate } from 'react-router-dom';

// Inside AppRouter component:
const navigate = useNavigate();

useEffect(() => {
  registerBackButton(() => navigate(-1));
  initIAP();
}, []);
```

- [ ] **Step 2: Wire setIAPUserId to auth state changes**

In the auth context or wherever `onAuthStateChange` is handled, add:

```tsx
import { setIAPUserId } from '@/services/iap';

// Inside auth state change handler:
if (session?.user) {
  setIAPUserId(session.user.id);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/contexts/
git commit -m "feat: wire up IAP init and Android back button handler"
```

### Task 19c: Add Playwright storageState and auth fixtures (spec requirement)

**Files:**
- Modify: `apps/web/playwright.config.ts`
- Create: `apps/web/tests/e2e/fixtures/auth.setup.ts`

- [ ] **Step 1: Add storageState to playwright config**

In `apps/web/playwright.config.ts`, add a `globalSetup` or project-level `storageState`:

```typescript
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? `npx vite preview --port ${PORT}` : `npx vite dev --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 2: Create auth fixture**

Create `apps/web/tests/e2e/fixtures/auth.setup.ts`:

```typescript
import { test as setup } from '@playwright/test';

/**
 * Pre-seed localStorage with mock auth state for E2E tests.
 * This avoids needing a real Supabase session in CI.
 */
setup('seed localStorage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    // Set minimal Supabase auth state for protected routes
    // Tests that need real auth should use their own setup
    localStorage.setItem('sb-auth-token', JSON.stringify({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: Date.now() / 1000 + 3600,
    }));
  });
  await page.context().storageState({ path: 'tests/e2e/fixtures/.auth-state.json' });
});
```

- [ ] **Step 3: Add .auth-state.json to .gitignore**

```bash
echo 'tests/e2e/fixtures/.auth-state.json' >> apps/web/.gitignore
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/tests/e2e/fixtures/ apps/web/.gitignore
git commit -m "test: add Playwright storageState and auth fixtures for CI"
```

---

## Chunk 5: Payments — Backend & IAP Integration

### Task 20: Create IAP support migration

**Files:**
- Create: `supabase/migrations/20260313100000_iap_support.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260313100000_iap_support.sql`:

```sql
-- IAP Support: platform tracking, credit ledger, webhook idempotency

-- 1. Track payment platform on purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS platform_transaction_id TEXT;

-- Make stripe_payment_intent_id nullable (IAP purchases have no Stripe intent)
ALTER TABLE purchases ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

-- 2. Credit transaction ledger for per-purchase attribution
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'stripe',
  source_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own credit transactions') THEN
    CREATE POLICY "Users can view own credit transactions"
      ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

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

- [ ] **Step 2: Test locally**

Run:
```bash
supabase db reset
```
Expected: All migrations apply cleanly.

- [ ] **Step 3: Deploy to production**

Run:
```bash
supabase db push
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260313100000_iap_support.sql
git commit -m "feat: add IAP support tables (credit ledger, webhook idempotency)"
```

### Task 21: Add Stripe webhook idempotency

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts`

- [ ] **Step 1: Add idempotency check to handlePaymentIntentSucceeded**

In `supabase/functions/stripe-webhook/index.ts`, at the beginning of the main handler function (after event construction), add an idempotency check:

```typescript
// Check if event already processed
const { data: existingEvent } = await supabaseAdmin
  .from('stripe_webhook_events')
  .select('event_id')
  .eq('event_id', event.id)
  .single();

if (existingEvent) {
  return new Response(JSON.stringify({ received: true, duplicate: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Record event as processing
await supabaseAdmin
  .from('stripe_webhook_events')
  .insert({
    event_id: event.id,
    event_type: event.type,
    user_id: null, // populated by specific handlers if applicable
  });
```

- [ ] **Step 2: Test with existing Stripe test webhook**

Run a test webhook event from the Stripe CLI or dashboard to verify:
- First delivery is processed normally
- Duplicate delivery returns 200 with `duplicate: true`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat: add idempotency check to Stripe webhook handler"
```

### Task 22: Create validate-iap-receipt edge function

**Files:**
- Create: `supabase/functions/validate-iap-receipt/index.ts`

- [ ] **Step 1: Write the edge function**

Create `supabase/functions/validate-iap-receipt/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Map RevenueCat product IDs to credit amounts
const PRODUCT_CREDITS: Record<string, number> = {
  'com.vyberology.lyf_path': 1,
  'com.vyberology.full_vybe': 1,
  'com.vyberology.deep_attunement': 1,
};

// No CORS needed — this is a server-to-server webhook endpoint
serve(async (req) => {
  // Validate webhook secret (RevenueCat sends Bearer token in Authorization header)
  const authHeader = req.headers.get('Authorization');
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await req.json();
    const event = payload.event;
    const eventId = event?.id;
    const eventType = event?.type;

    if (!eventId || !eventType) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Idempotency check
    const { data: existing } = await supabase
      .from('iap_webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Record event
    const appUserId = event.app_user_id; // This should be the Supabase user ID
    await supabase.from('iap_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      user_id: appUserId,
      payload,
    });

    // Only process purchase events for consumables
    if (eventType === 'INITIAL_PURCHASE' || eventType === 'NON_RENEWING_PURCHASE') {
      const productId = event.product_id;
      const credits = PRODUCT_CREDITS[productId] ?? 0;

      if (credits > 0 && appUserId) {
        // Grant credits
        await supabase.rpc('add_reading_credits', {
          p_user_id: appUserId,
          p_credits: credits,
        });

        // Record in credit transaction ledger
        const platform = event.store === 'APP_STORE' ? 'apple' : 'google';
        await supabase.from('credit_transactions').insert({
          user_id: appUserId,
          amount: credits,
          source: platform,
          source_transaction_id: event.transaction_id,
        });

        // Record purchase
        await supabase.from('purchases').insert({
          user_id: appUserId,
          platform,
          platform_transaction_id: event.transaction_id,
          amount: event.price_in_purchased_currency ?? 0,
          currency: event.currency ?? 'USD',
          status: 'completed',
          tier: productId,
        });
      }
    }

    // Handle refunds
    if (eventType === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT') {
      // Deduct credits if refund
      if (appUserId) {
        await supabase.from('credit_transactions').insert({
          user_id: appUserId,
          amount: -1,
          source: event.store === 'APP_STORE' ? 'apple' : 'google',
          source_transaction_id: event.transaction_id,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('IAP webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy**

Run:
```bash
supabase functions deploy validate-iap-receipt
supabase secrets set REVENUECAT_WEBHOOK_SECRET=your-webhook-secret
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/validate-iap-receipt/
git commit -m "feat: add validate-iap-receipt edge function for RevenueCat webhooks"
```

### Task 23: Create IAP payment service for mobile

**Files:**
- Create: `apps/web/src/services/iap.ts`

- [ ] **Step 1: Create the IAP service**

Create `apps/web/src/services/iap.ts`:

```typescript
import { isNative } from '@/lib/platform';

/**
 * Initialize RevenueCat SDK.
 * Call once at app startup on native platforms.
 */
export async function initIAP(): Promise<void> {
  if (!isNative()) return;

  const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;
  if (!apiKey) {
    console.warn('RevenueCat API key not configured');
    return;
  }

  // Dynamic import — only loads on native
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  await Purchases.configure({ apiKey });
}

/**
 * Set the RevenueCat user ID to match the Supabase auth user.
 * Call after authentication.
 */
export async function setIAPUserId(userId: string): Promise<void> {
  if (!isNative()) return;
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  await Purchases.logIn({ appUserID: userId });
}

/**
 * Purchase a consumable product via native IAP.
 * Returns true if purchase succeeded, false if cancelled.
 */
export async function purchaseProduct(productId: string): Promise<boolean> {
  if (!isNative()) return false;

  const { Purchases } = await import('@revenuecat/purchases-capacitor');

  try {
    const { products } = await Purchases.getProducts({
      productIdentifiers: [productId],
    });

    if (products.length === 0) {
      throw new Error(`Product ${productId} not found in store`);
    }

    await Purchases.purchaseStoreProduct({ product: products[0] });
    return true;
  } catch (error: any) {
    if (error.userCancelled) return false;
    throw error;
  }
}

/**
 * Map tier IDs to store product IDs.
 */
export const TIER_TO_PRODUCT_ID: Record<string, string> = {
  'lyf-path': 'com.vyberology.lyf_path',
  'full-vybe': 'com.vyberology.full_vybe',
  deep: 'com.vyberology.deep_attunement',
};
```

- [ ] **Step 2: Write test**

Create `apps/web/src/services/__tests__/iap.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TIER_TO_PRODUCT_ID } from '../iap';

describe('iap service', () => {
  it('maps all paid tiers to product IDs', () => {
    expect(TIER_TO_PRODUCT_ID['lyf-path']).toBe('com.vyberology.lyf_path');
    expect(TIER_TO_PRODUCT_ID['full-vybe']).toBe('com.vyberology.full_vybe');
    expect(TIER_TO_PRODUCT_ID['deep']).toBe('com.vyberology.deep_attunement');
  });

  it('does not include free tier', () => {
    expect(TIER_TO_PRODUCT_ID['free']).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test**

Run:
```bash
npx vitest run src/services/__tests__/iap.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services/iap.ts apps/web/src/services/__tests__/iap.test.ts
git commit -m "feat: add IAP service for RevenueCat mobile purchases"
```

### Task 24: Create unified purchase handler

**Files:**
- Create: `apps/web/src/services/purchase.ts`

- [ ] **Step 1: Create the unified purchase service**

Create `apps/web/src/services/purchase.ts`:

```typescript
import { isNative } from '@/lib/platform';
import { createCheckoutSession } from './stripe';
import { purchaseProduct, TIER_TO_PRODUCT_ID } from './iap';
import type { ReadingTier } from '@/lib/tiers';
import { TIER_PRICE_ID } from '@/lib/tiers';

export interface PurchaseResult {
  success: boolean;
  redirectUrl?: string; // Stripe checkout URL (web only)
  error?: string;
}

/**
 * Unified purchase handler.
 * Routes to IAP on native, Stripe on web.
 */
export async function purchaseTier(
  tier: Exclude<ReadingTier, 'free'>,
  options: { fullName: string; dob: string }
): Promise<PurchaseResult> {
  if (isNative()) {
    const productId = TIER_TO_PRODUCT_ID[tier];
    if (!productId) return { success: false, error: `Unknown tier: ${tier}` };

    try {
      const purchased = await purchaseProduct(productId);
      return { success: purchased };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Web: Stripe checkout
  try {
    const priceId = TIER_PRICE_ID[tier];
    const result = await createCheckoutSession({
      priceId,
      tier,
      fullName: options.fullName,
      dob: options.dob,
    });
    return { success: true, redirectUrl: result.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

- [ ] **Step 2: Write test**

Create `apps/web/src/services/__tests__/purchase.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { purchaseTier } from '../purchase';

// In test environment, isNative() returns false (Capacitor mocked as web)
// So all purchases route to Stripe

vi.mock('../stripe', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://stripe.com/checkout' }),
}));

describe('purchaseTier', () => {
  it('routes to Stripe on web platform', async () => {
    const result = await purchaseTier('lyf-path', {
      fullName: 'Jane Doe',
      dob: '1990-01-15',
    });

    expect(result.success).toBe(true);
    expect(result.redirectUrl).toBe('https://stripe.com/checkout');
  });
});
```

- [ ] **Step 3: Run test**

Run:
```bash
npx vitest run src/services/__tests__/purchase.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services/purchase.ts apps/web/src/services/__tests__/purchase.test.ts
git commit -m "feat: add unified purchase handler routing IAP on native, Stripe on web"
```

### Task 25: Add "Sync Account Balance" and "Restore Purchases" to settings

**Files:**
- Modify: `apps/web/src/pages/Settings.tsx` (add restore/sync buttons)

- [ ] **Step 1: Add sync and restore buttons to Settings page**

In the Settings page component, add a "Credits" section with:

```tsx
import { isNative } from '@/lib/platform';
import { getUserCredits } from '@/services/stripe';
import { useAuth } from '@/contexts/AuthContext';

// Inside the Settings component:
const { user } = useAuth();
const [credits, setCredits] = useState<number | null>(null);
const [syncing, setSyncing] = useState(false);

const syncBalance = async () => {
  if (!user) return;
  setSyncing(true);
  try {
    const balance = await getUserCredits();
    setCredits(balance);
    toast.success('Credits synced');
  } catch {
    toast.error('Failed to sync credits');
  } finally {
    setSyncing(false);
  }
};

const restorePurchases = async () => {
  if (!isNative()) return;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    await Purchases.restorePurchases();
    await syncBalance();
    toast.success('Purchases restored');
  } catch {
    toast.error('Failed to restore purchases');
  }
};

// In the JSX:
<section>
  <h3>Credits</h3>
  <p>Balance: {credits ?? '—'}</p>
  <Button onClick={syncBalance} disabled={syncing}>
    {syncing ? 'Syncing...' : 'Sync Account Balance'}
  </Button>
  {isNative() && (
    <Button variant="outline" onClick={restorePurchases}>
      Restore Purchases
    </Button>
  )}
</section>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/Settings.tsx
git commit -m "feat: add Sync Account Balance and Restore Purchases to settings"
```

### Task 26: Update CLAUDE.md

**Files:**
- Modify: `apps/web/CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md with new architecture info**

Add/update sections in `apps/web/CLAUDE.md`:

- Update Capacitor `appId` to `com.vyberology.app`
- Update Android permissions to reflect modern API 33+ approach
- Add IAP/RevenueCat payment architecture section
- Add `validate-iap-receipt` to edge functions list
- Add Capacitor build scripts to development commands
- Update deployment checklist with mobile app submission steps

- [ ] **Step 2: Commit**

```bash
git add apps/web/CLAUDE.md
git commit -m "docs: update CLAUDE.md with mobile and IAP architecture"
```

---

## Post-Implementation Checklist

These are manual steps that require external accounts and cannot be automated:

- [ ] **Apple Developer account** — Enroll at developer.apple.com ($99/year)
- [ ] **Google Play Developer account** — Enroll at play.google.com/console ($25 one-time)
- [ ] **RevenueCat account** — Create at app.revenuecat.com
- [ ] **RevenueCat plugin** — Verify `@revenuecat/purchases-capacitor` works with Capacitor 7, install and sync
- [ ] **App Store Connect** — Create 3 consumable IAP products (lyf_path, full_vybe, deep_attunement)
- [ ] **Google Play Console** — Create 3 one-time consumable products
- [ ] **RevenueCat dashboard** — Link products, configure webhook URL to Supabase
- [ ] **Stripe** — Verify price IDs are live or create live products. Swap test keys for live keys.
- [ ] **App icons** — Create 1024x1024 icon and 2732x2732 splash assets
- [ ] **TestFlight** — Upload iOS build, invite beta testers
- [ ] **Google Play internal testing** — Upload Android build
- [ ] **Purchase QA matrix** — Fresh purchase, repeat purchase, refund, reinstall + sign-in recovery
- [ ] **App Store submission** — Screenshots, description, privacy nutrition labels
- [ ] **Google Play submission** — Screenshots, description, data safety form
