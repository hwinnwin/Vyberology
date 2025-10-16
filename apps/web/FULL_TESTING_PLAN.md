# Full Testing Plan - 3-5 Day Roadmap

**Goal:** Achieve 60%+ test coverage and verify all critical functionality before production deployment

**Timeline:** 3-5 days
**Current Coverage:** ~5% (1 test file)
**Target Coverage:** 60%+

---

## Day 1: Testing Infrastructure & Unit Tests (8 hours)

### Morning (4 hours): Setup Testing Environment

**Goal:** Install and configure testing tools

#### 1.1 Install Testing Dependencies (30 min)
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install -D @vitest/ui @vitest/coverage-v8
npm install -D happy-dom # Faster alternative to jsdom
```

#### 1.2 Create Vitest Config (30 min)
**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 1.3 Create Test Setup File (30 min)
**File:** `src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'web'),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    removeAllListeners: vi.fn(),
    getLaunchUrl: vi.fn(() => Promise.resolve({ url: null })),
  },
}));
```

#### 1.4 Update package.json Scripts (15 min)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

#### 1.5 Create Test Utilities (45 min)
**File:** `src/test/test-utils.tsx`

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

**Checkpoint:** Run `npm test` to verify setup works

---

### Afternoon (4 hours): Write Critical Unit Tests

#### 1.6 Test Cloud Sync Module (1.5 hours)
**File:** `src/lib/__tests__/cloudSync.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isCloudSyncEnabled,
  hasDataConsent,
  syncToCloud,
  fetchFromCloud,
  clearCloudData,
} from '../cloudSync';

describe('cloudSync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isCloudSyncEnabled', () => {
    it('should return false when not enabled', () => {
      expect(isCloudSyncEnabled()).toBe(false);
    });

    it('should return true when enabled', () => {
      localStorage.setItem('vyberology_cloud_sync', 'true');
      expect(isCloudSyncEnabled()).toBe(true);
    });
  });

  describe('hasDataConsent', () => {
    it('should return false when consent not given', () => {
      expect(hasDataConsent()).toBe(false);
    });

    it('should return true when consent given', () => {
      localStorage.setItem('vyberology_data_consent', 'true');
      expect(hasDataConsent()).toBe(true);
    });
  });

  describe('syncToCloud', () => {
    it('should fail when user not authenticated', async () => {
      const result = await syncToCloud();
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should fail when cloud sync not enabled', async () => {
      // Mock authenticated user
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      } as any);

      const result = await syncToCloud();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cloud sync not enabled');
    });

    // Add more tests for successful sync
  });

  describe('fetchFromCloud', () => {
    it('should return empty array when user not authenticated', async () => {
      const result = await fetchFromCloud();
      expect(result.success).toBe(false);
      expect(result.readings).toEqual([]);
    });
  });

  describe('clearCloudData', () => {
    it('should fail when user not authenticated', async () => {
      const result = await clearCloudData();
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });
  });
});
```

#### 1.7 Test Reading History Module (1 hour)
**File:** `src/lib/__tests__/readingHistory.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveReading,
  getReadingHistory,
  deleteReading,
  clearHistory,
} from '../readingHistory';

describe('readingHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveReading', () => {
    it('should save a reading to localStorage', () => {
      const reading = {
        inputType: 'time' as const,
        inputValue: '11:11',
        reading: 'Test reading',
        numbers: ['11', '11'],
        timestamp: new Date().toISOString(),
      };

      saveReading(reading);
      const history = getReadingHistory();

      expect(history).toHaveLength(1);
      expect(history[0].inputValue).toBe('11:11');
    });

    it('should add new readings to the beginning of the array', () => {
      const reading1 = {
        inputType: 'time' as const,
        inputValue: '11:11',
        reading: 'First reading',
        numbers: ['11', '11'],
        timestamp: new Date().toISOString(),
      };

      const reading2 = {
        inputType: 'time' as const,
        inputValue: '22:22',
        reading: 'Second reading',
        numbers: ['22', '22'],
        timestamp: new Date().toISOString(),
      };

      saveReading(reading1);
      saveReading(reading2);

      const history = getReadingHistory();
      expect(history[0].inputValue).toBe('22:22'); // Most recent first
      expect(history[1].inputValue).toBe('11:11');
    });
  });

  describe('getReadingHistory', () => {
    it('should return empty array when no readings', () => {
      const history = getReadingHistory();
      expect(history).toEqual([]);
    });
  });

  describe('deleteReading', () => {
    it('should remove a reading by id', () => {
      const reading = {
        inputType: 'time' as const,
        inputValue: '11:11',
        reading: 'Test reading',
        numbers: ['11', '11'],
        timestamp: new Date().toISOString(),
      };

      saveReading(reading);
      const history = getReadingHistory();
      const readingId = history[0].id;

      deleteReading(readingId);
      const updatedHistory = getReadingHistory();

      expect(updatedHistory).toHaveLength(0);
    });
  });

  describe('clearHistory', () => {
    it('should remove all readings', () => {
      saveReading({
        inputType: 'time' as const,
        inputValue: '11:11',
        reading: 'Reading 1',
        numbers: ['11'],
        timestamp: new Date().toISOString(),
      });

      saveReading({
        inputType: 'pattern' as const,
        inputValue: '222',
        reading: 'Reading 2',
        numbers: ['222'],
        timestamp: new Date().toISOString(),
      });

      clearHistory();
      const history = getReadingHistory();

      expect(history).toEqual([]);
    });
  });
});
```

#### 1.8 Test Permissions Module (1.5 hours)
**File:** `src/lib/__tests__/permissions.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkCameraPermission,
  requestCameraPermission,
  checkMicrophonePermission,
  requestMicrophonePermission,
  capturePhoto,
  pickPhoto,
} from '../permissions';

describe('permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkCameraPermission', () => {
    it('should return granted when permission is granted', async () => {
      // Mock Capacitor Camera.checkPermissions
      const { Camera } = await import('@capacitor/camera');
      vi.mocked(Camera.checkPermissions).mockResolvedValue({
        camera: 'granted',
        photos: 'granted',
      } as any);

      const status = await checkCameraPermission();
      expect(status).toBe('granted');
    });

    it('should return denied when permission is denied', async () => {
      const { Camera } = await import('@capacitor/camera');
      vi.mocked(Camera.checkPermissions).mockResolvedValue({
        camera: 'denied',
        photos: 'denied',
      } as any);

      const status = await checkCameraPermission();
      expect(status).toBe('denied');
    });
  });

  describe('requestCameraPermission', () => {
    it('should request and return camera permission', async () => {
      const { Camera } = await import('@capacitor/camera');
      vi.mocked(Camera.requestPermissions).mockResolvedValue({
        camera: 'granted',
        photos: 'granted',
      } as any);

      const status = await requestCameraPermission();
      expect(status).toBe('granted');
      expect(Camera.requestPermissions).toHaveBeenCalledWith({
        permissions: ['camera', 'photos'],
      });
    });
  });

  describe('capturePhoto', () => {
    it('should capture photo when permission granted', async () => {
      const { Camera } = await import('@capacitor/camera');

      vi.mocked(Camera.checkPermissions).mockResolvedValue({
        camera: 'granted',
        photos: 'granted',
      } as any);

      vi.mocked(Camera.getPhoto).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,test',
        format: 'jpeg',
      } as any);

      const result = await capturePhoto();

      expect(result.success).toBe(true);
      expect(result.dataUrl).toBe('data:image/jpeg;base64,test');
    });

    it('should request permission if not granted', async () => {
      const { Camera } = await import('@capacitor/camera');

      vi.mocked(Camera.checkPermissions).mockResolvedValue({
        camera: 'prompt',
        photos: 'prompt',
      } as any);

      vi.mocked(Camera.requestPermissions).mockResolvedValue({
        camera: 'granted',
        photos: 'granted',
      } as any);

      vi.mocked(Camera.getPhoto).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,test',
        format: 'jpeg',
      } as any);

      const result = await capturePhoto();

      expect(Camera.requestPermissions).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should fail when permission denied', async () => {
      const { Camera } = await import('@capacitor/camera');

      vi.mocked(Camera.checkPermissions).mockResolvedValue({
        camera: 'denied',
        photos: 'denied',
      } as any);

      const result = await capturePhoto();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Camera permission denied');
    });
  });
});
```

**Day 1 Checkpoint:**
- Run `npm run test:coverage`
- Target: 30%+ coverage
- All cloud sync, reading history, and permission tests passing

---

## Day 2: Integration Tests & Component Tests (8 hours)

### Morning (4 hours): Integration Tests

#### 2.1 Test Deep Link Routing (1.5 hours)
**File:** `src/hooks/__tests__/useDeepLinks.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useDeepLinks } from '../useDeepLinks';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('useDeepLinks', () => {
  let mockNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.clearAllMocks();
  });

  it('should navigate to /get-vybe for capture deep link', async () => {
    const { App } = await import('@capacitor/app');

    renderHook(() => useDeepLinks());

    // Simulate deep link event
    const mockEvent = { url: 'vyberology://capture' };
    const listener = vi.mocked(App.addListener).mock.calls[0][1];
    listener(mockEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/get-vybe');
  });

  it('should navigate to /get-vybe with pattern state', async () => {
    const { App } = await import('@capacitor/app');

    renderHook(() => useDeepLinks());

    const mockEvent = { url: 'vyberology://pattern/11:11' };
    const listener = vi.mocked(App.addListener).mock.calls[0][1];
    listener(mockEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/get-vybe', {
      state: { pattern: '11:11' },
    });
  });

  it('should navigate to /history for history deep link', async () => {
    const { App } = await import('@capacitor/app');

    renderHook(() => useDeepLinks());

    const mockEvent = { url: 'vyberology://history' };
    const listener = vi.mocked(App.addListener).mock.calls[0][1];
    listener(mockEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/history');
  });

  it('should navigate to /numerology for numerology deep link', async () => {
    const { App } = await import('@capacitor/app');

    renderHook(() => useDeepLinks());

    const mockEvent = { url: 'vyberology://numerology' };
    const listener = vi.mocked(App.addListener).mock.calls[0][1];
    listener(mockEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/numerology');
  });

  it('should navigate to home for unknown deep link', async () => {
    const { App } = await import('@capacitor/app');

    renderHook(() => useDeepLinks());

    const mockEvent = { url: 'vyberology://unknown' };
    const listener = vi.mocked(App.addListener).mock.calls[0][1];
    listener(mockEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
```

#### 2.2 Test Reading Generation Service (2.5 hours)
**File:** `src/services/__tests__/reading.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateReading } from '../reading';

global.fetch = vi.fn();

describe('reading service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateReading', () => {
    it('should call Edge Function with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ reading: 'Test reading response' }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const params = {
        fullName: 'John Doe',
        dobISO: '1990-01-01',
        inputs: [{ label: 'Name', value: 'John Doe' }],
        depth: 'standard' as const,
      };

      const result = await generateReading(params);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/generate-reading'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(params),
        })
      );

      expect(result).toEqual({ reading: 'Test reading response' });
    });

    it('should throw error when API call fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await expect(
        generateReading({
          fullName: 'John Doe',
          dobISO: '1990-01-01',
          inputs: [],
        })
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        generateReading({
          fullName: 'John Doe',
          dobISO: '1990-01-01',
          inputs: [],
        })
      ).rejects.toThrow('Network error');
    });
  });
});
```

### Afternoon (4 hours): Component Tests

#### 2.3 Test ReadingForm Component (2 hours)
**File:** `src/components/__tests__/ReadingForm.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ReadingForm } from '../ReadingForm';

describe('ReadingForm', () => {
  it('should render form fields', () => {
    const mockOnSubmit = vi.fn();
    render(<ReadingForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate reading/i })).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ReadingForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);
    const submitButton = screen.getByRole('button', { name: /generate reading/i });

    await user.type(nameInput, 'John Doe');
    await user.type(dobInput, '1990-01-01');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'John Doe',
          dobISO: '1990-01-01',
        })
      );
    });
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<ReadingForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /generate reading/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
```

#### 2.4 Test PermissionPrompt Component (2 hours)
**File:** `src/components/__tests__/PermissionPrompt.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { PermissionPrompt } from '../PermissionPrompt';

describe('PermissionPrompt', () => {
  it('should render for camera permission', () => {
    const mockOnRequest = vi.fn();
    const mockOnDismiss = vi.fn();

    render(
      <PermissionPrompt
        permissionType="camera"
        status="prompt"
        onRequest={mockOnRequest}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText(/camera access/i)).toBeInTheDocument();
  });

  it('should call onRequest when grant button clicked', async () => {
    const user = userEvent.setup();
    const mockOnRequest = vi.fn();
    const mockOnDismiss = vi.fn();

    render(
      <PermissionPrompt
        permissionType="camera"
        status="prompt"
        onRequest={mockOnRequest}
        onDismiss={mockOnDismiss}
        variant="modal"
      />
    );

    const grantButton = screen.getByText(/grant permission/i);
    await user.click(grantButton);

    expect(mockOnRequest).toHaveBeenCalled();
  });

  it('should show settings button when permission denied', () => {
    const mockOnRequest = vi.fn();
    const mockOnDismiss = vi.fn();

    render(
      <PermissionPrompt
        permissionType="microphone"
        status="denied"
        onRequest={mockOnRequest}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText(/open settings/i)).toBeInTheDocument();
  });
});
```

**Day 2 Checkpoint:**
- Run `npm run test:coverage`
- Target: 50%+ coverage
- All integration and component tests passing

---

## Day 3: Mobile Device Testing (8 hours)

### Morning (4 hours): iOS Widget Testing

#### 3.1 Build iOS App (1 hour)
```bash
# Update Info.plist with permission descriptions first
# Add all 4 NSCameraUsageDescription, NSMicrophoneUsageDescription, etc.

# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

#### 3.2 Test iOS Widget on Device (3 hours)

**Test Checklist:**

- [ ] **Small Widget (2x2)**
  - [ ] Displays current time
  - [ ] Shows Vybe logo
  - [ ] Tap opens app to /get-vybe
  - [ ] Widget updates every minute
  - [ ] Looks correct in light/dark mode

- [ ] **Medium Widget (4x2)**
  - [ ] Displays current time and date
  - [ ] Shows "Current Vybe" label
  - [ ] Capture button visible
  - [ ] Tap opens app to /get-vybe
  - [ ] Widget updates every minute

- [ ] **Large Widget (4x4)**
  - [ ] Displays current time
  - [ ] Shows all 4 Universe Signal buttons (11:11, 222, 333, 444)
  - [ ] History button navigates to /history
  - [ ] Numerology button navigates to /numerology
  - [ ] Pattern buttons navigate with correct pattern parameter
  - [ ] Widget updates every minute

**Deep Link Testing:**
```bash
# Test deep links from Terminal
xcrun simctl openurl booted "vyberology://capture"
xcrun simctl openurl booted "vyberology://pattern/11:11"
xcrun simctl openurl booted "vyberology://history"
xcrun simctl openurl booted "vyberology://numerology"
```

**Issues to Check:**
- [ ] Widget loads without errors
- [ ] Deep links work correctly
- [ ] App doesn't crash when opened from widget
- [ ] Time updates correctly
- [ ] Gradients render correctly
- [ ] Text is readable
- [ ] Widget doesn't drain battery excessively

### Afternoon (4 hours): Android Widget Testing

#### 3.3 Build Android App (1 hour)
```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

#### 3.4 Test Android Widget on Device (3 hours)

**Test Checklist:**

- [ ] **Small Widget**
  - [ ] Displays current time
  - [ ] Shows Vybe logo
  - [ ] Tap opens app
  - [ ] Updates every minute
  - [ ] Looks correct on different launchers (stock, Nova, etc.)

- [ ] **Medium Widget**
  - [ ] Displays time and date
  - [ ] Capture button works
  - [ ] Updates correctly

- [ ] **Large Widget**
  - [ ] All buttons visible
  - [ ] Pattern buttons work
  - [ ] Navigation buttons work
  - [ ] Grid layout correct

**Deep Link Testing:**
```bash
# Test deep links from ADB
adb shell am start -W -a android.intent.action.VIEW -d "vyberology://capture" app.lovable.eebd950946e542d89b5f15154caa7b65
adb shell am start -W -a android.intent.action.VIEW -d "vyberology://pattern/222" app.lovable.eebd950946e542d89b5f15154caa7b65
adb shell am start -W -a android.intent.action.VIEW -d "vyberology://history" app.lovable.eebd950946e542d89b5f15154caa7b65
```

**Issues to Check:**
- [ ] Widget renders correctly on different screen sizes
- [ ] Deep links work
- [ ] Background gradient displays correctly
- [ ] Text is readable
- [ ] Battery impact is minimal
- [ ] Widget doesn't lag when tapped

**Day 3 Checkpoint:**
- Document all widget issues found
- Create bug list with screenshots
- Test on at least 2 different devices per platform

---

## Day 4: Permission Testing & Error Tracking (8 hours)

### Morning (4 hours): Permission Flow Testing

#### 4.1 Test Camera Permissions (1.5 hours)

**iOS Testing:**
- [ ] Fresh install - first permission request
- [ ] Permission granted flow
- [ ] Permission denied flow
- [ ] "Open Settings" button works
- [ ] Permission works after granting in Settings
- [ ] Photo capture works
- [ ] Photo library picker works

**Android Testing:**
- [ ] First permission request
- [ ] Permission granted
- [ ] Permission denied
- [ ] "Don't ask again" scenario
- [ ] Settings redirect works
- [ ] Multiple permission requests handled correctly

#### 4.2 Test Microphone Permissions (1.5 hours)

**iOS Testing:**
- [ ] Voice assistant permission prompt shows
- [ ] "Allow" works correctly
- [ ] "Not Now" dismisses properly
- [ ] Speech recognition works after permission
- [ ] "Hey Lumen" wake word detected
- [ ] Permission persists across app restarts

**Android Testing:**
- [ ] Permission prompt shows at bottom of screen
- [ ] Mobile-specific instructions visible
- [ ] Permission works correctly
- [ ] Speech recognition works
- [ ] Wake word detection works

#### 4.3 Test Permission Edge Cases (1 hour)

- [ ] Revoke permission while app is running
- [ ] Grant permission in Settings while app is open
- [ ] Multiple permission requests in sequence
- [ ] Permission on low-end devices
- [ ] Permission on different Android/iOS versions

### Afternoon (4 hours): Error Tracking Setup

#### 4.4 Install and Configure Sentry (2 hours)

```bash
# Install Sentry
npm install @sentry/react @sentry/vite-plugin
```

**Update:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org",
      project: "vyberology",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Required for Sentry
  },
});
```

**Update:** `src/main.tsx`

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event, hint) {
    // Don't send errors in development
    if (import.meta.env.DEV) {
      console.error(hint.originalException || hint.syntheticException);
      return null;
    }
    return event;
  },
});
```

#### 4.5 Test Error Tracking (1 hour)

**Create Test Errors:**

```typescript
// Test error in component
throw new Error('Test Sentry error');

// Test unhandled promise rejection
Promise.reject(new Error('Test async error'));

// Test caught error with context
try {
  throw new Error('Test caught error');
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'reading-generation',
    },
    extra: {
      userId: 'test-user-id',
      readingType: 'numerology',
    },
  });
}
```

**Verify in Sentry Dashboard:**
- [ ] Errors appear in dashboard
- [ ] Source maps work (shows actual source code)
- [ ] Breadcrumbs show user actions before error
- [ ] Session replay works
- [ ] Error grouping is logical

#### 4.6 Add Performance Monitoring (1 hour)

```typescript
// Add custom performance traces
const transaction = Sentry.startTransaction({
  name: 'generate-reading',
  op: 'function',
});

try {
  const reading = await generateReading(params);
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

**Monitor:**
- [ ] AI reading generation time
- [ ] Cloud sync performance
- [ ] Widget load time
- [ ] Page load times

**Day 4 Checkpoint:**
- All permissions tested and working
- Sentry configured and receiving errors
- Performance monitoring active

---

## Day 5: Load Testing & Final Verification (8 hours)

### Morning (4 hours): Load Testing

#### 5.1 Test AI Reading Generation Load (2 hours)

**Create Load Test Script:** `scripts/load-test-readings.ts`

```typescript
import { supabase } from './supabase-client';

async function loadTestReadings(concurrent: number, total: number) {
  const results = {
    success: 0,
    failed: 0,
    totalTime: 0,
    errors: [] as string[],
  };

  const chunks = Math.ceil(total / concurrent);

  for (let chunk = 0; chunk < chunks; chunk++) {
    const promises = [];

    for (let i = 0; i < concurrent && (chunk * concurrent + i) < total; i++) {
      const startTime = Date.now();

      const promise = supabase.functions
        .invoke('generate-reading', {
          body: {
            fullName: `Test User ${chunk * concurrent + i}`,
            dobISO: '1990-01-01',
            inputs: [{ label: 'Name', value: 'Test' }],
            depth: 'lite',
          },
        })
        .then((response) => {
          const endTime = Date.now();
          results.totalTime += (endTime - startTime);

          if (response.error) {
            results.failed++;
            results.errors.push(response.error.message);
          } else {
            results.success++;
          }
        })
        .catch((error) => {
          results.failed++;
          results.errors.push(error.message);
        });

      promises.push(promise);
    }

    await Promise.all(promises);

    console.log(`Chunk ${chunk + 1}/${chunks} complete`);
  }

  console.log('\nLoad Test Results:');
  console.log(`Total Requests: ${total}`);
  console.log(`Successful: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Average Time: ${results.totalTime / total}ms`);
  console.log(`Errors:`, results.errors.slice(0, 5));
}

// Test with 100 requests, 10 concurrent
loadTestReadings(10, 100);
```

**Run Load Tests:**
```bash
# 50 requests, 5 concurrent
npm run load-test -- --concurrent 5 --total 50

# 100 requests, 10 concurrent
npm run load-test -- --concurrent 10 --total 100

# 500 requests, 25 concurrent (stress test)
npm run load-test -- --concurrent 25 --total 500
```

**Monitor:**
- [ ] OpenAI API response times
- [ ] Edge Function performance
- [ ] Error rates
- [ ] Rate limiting kicks in (if implemented)
- [ ] Database performance

#### 5.2 Test Cloud Sync Load (1 hour)

```typescript
async function loadTestCloudSync(users: number, readingsPerUser: number) {
  // Create test users
  // Sync multiple readings per user
  // Measure performance
}
```

#### 5.3 Optimize Based on Results (1 hour)

**Common Optimizations:**
- Add request caching
- Implement rate limiting
- Optimize database queries
- Add CDN for static assets

### Afternoon (4 hours): Final Verification

#### 5.4 Run Full Test Suite (1 hour)

```bash
# Run all tests with coverage
npm run test:coverage

# Should see:
# - 60%+ total coverage
# - All tests passing
# - Critical paths covered
```

#### 5.5 Cross-Browser Testing (1.5 hours)

**Desktop:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile:**
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Samsung Internet

**Test:**
- [ ] Voice assistant works
- [ ] Camera permissions work
- [ ] Reading generation works
- [ ] Cloud sync works
- [ ] Widgets work (mobile only)
- [ ] Deep links work (mobile only)

#### 5.6 Accessibility Testing (30 min)

```bash
# Install axe-core
npm install -D @axe-core/react

# Add to main.tsx (dev only)
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

**Manual Testing:**
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (test with VoiceOver/TalkBack)
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] ARIA labels present

#### 5.7 Performance Audit (1 hour)

```bash
# Run Lighthouse audit
npm run build
npm run preview

# Open Chrome DevTools
# Run Lighthouse audit for:
# - Performance
# - Accessibility
# - Best Practices
# - SEO
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

**Optimize as needed:**
- Compress images
- Minimize JavaScript
- Lazy load images
- Add preconnect hints

**Day 5 Checkpoint:**
- All load tests passed
- Cross-browser compatibility verified
- Accessibility improvements made
- Lighthouse scores meet targets

---

## Final Deliverables

### Test Coverage Report
- **File:** `coverage/index.html`
- **Target:** 60%+ total coverage
- **Critical:** 80%+ coverage for cloud sync, permissions, deep links

### Bug Report
- **File:** `TEST_RESULTS.md`
- Document all issues found
- Categorize by severity (critical, high, medium, low)
- Include screenshots and reproduction steps

### Performance Report
- **File:** `PERFORMANCE_RESULTS.md`
- Load test results
- Lighthouse scores
- Optimization recommendations

### Device Testing Report
- **File:** `DEVICE_TESTING_REPORT.md`
- iOS widget test results
- Android widget test results
- Permission flow results
- List of tested devices

---

## Success Criteria

### Must Pass (Go/No-Go):
- [ ] 60%+ test coverage achieved
- [ ] All critical tests passing
- [ ] Widgets work on iOS and Android
- [ ] Permissions work correctly
- [ ] No critical bugs found
- [ ] Sentry configured and working
- [ ] Load tests show acceptable performance (<2s avg for readings)

### Recommended:
- [ ] 70%+ test coverage
- [ ] Lighthouse scores 90+ across the board
- [ ] Tested on 3+ devices per platform
- [ ] Accessibility score 95+
- [ ] No high-severity bugs

### Nice to Have:
- [ ] 80%+ test coverage
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] CI/CD pipeline for automated testing

---

## Timeline Summary

| Day | Focus | Hours | Deliverable |
|-----|-------|-------|-------------|
| 1 | Testing Infrastructure & Unit Tests | 8 | 30%+ coverage, test setup complete |
| 2 | Integration & Component Tests | 8 | 50%+ coverage, all integration tests passing |
| 3 | Mobile Widget Testing | 8 | Widgets tested on real devices, bug list created |
| 4 | Permissions & Error Tracking | 8 | Permissions verified, Sentry configured |
| 5 | Load Testing & Final Verification | 8 | Load tests complete, production-ready |

**Total:** 40 hours (5 days @ 8 hours/day)

---

## After Completion

### Ready for Production If:
- ✅ All success criteria met
- ✅ Critical bugs fixed
- ✅ Test coverage 60%+
- ✅ Widgets work on real devices
- ✅ Permissions work correctly
- ✅ Error tracking configured
- ✅ Performance is acceptable

### Next Steps:
1. Create release candidate build
2. Deploy to staging environment
3. Run smoke tests on staging
4. Final security audit
5. Update BEFORE_PRODUCTION_DEPLOY.md with test results
6. Create deployment plan
7. Schedule production deployment

---

**Created:** January 2025
**Owner:** Vyberology Dev Team
**Est. Duration:** 3-5 days (40 hours)
**Target Date:** [Your target date]
