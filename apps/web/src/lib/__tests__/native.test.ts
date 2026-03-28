import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock platform module
vi.mock('../platform', () => ({
  isNative: vi.fn(() => false),
  isAndroid: vi.fn(() => false),
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn() },
  ImpactStyle: { Light: 'LIGHT' },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn() },
}));

vi.mock('@capacitor/browser', () => ({
  Browser: { open: vi.fn() },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    exitApp: vi.fn(),
  },
}));

import { hapticTap, nativeShare, openExternal, registerBackButton } from '../native';
import { isNative, isAndroid } from '../platform';

describe('native utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hapticTap', () => {
    it('is a no-op on web', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      await hapticTap();
      const { Haptics } = await import('@capacitor/haptics');
      expect(Haptics.impact).not.toHaveBeenCalled();
    });

    it('triggers haptic feedback on native', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      await hapticTap();
      const { Haptics } = await import('@capacitor/haptics');
      expect(Haptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
    });
  });

  describe('nativeShare', () => {
    it('uses Capacitor Share on native', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const data = { title: 'Test', text: 'Hello' };
      const result = await nativeShare(data);
      const { Share } = await import('@capacitor/share');
      expect(Share.share).toHaveBeenCalledWith(data);
      expect(result).toBe(true);
    });

    it('uses navigator.share on web when available', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true });

      const data = { title: 'Test', text: 'Hello' };
      const result = await nativeShare(data);
      expect(mockShare).toHaveBeenCalledWith(data);
      expect(result).toBe(true);

      // Cleanup
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });

    it('returns false when no share API available', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });

      const result = await nativeShare({ title: 'Test', text: 'Hello' });
      expect(result).toBe(false);
    });
  });

  describe('openExternal', () => {
    it('uses Capacitor Browser on native', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      await openExternal('https://example.com');
      const { Browser } = await import('@capacitor/browser');
      expect(Browser.open).toHaveBeenCalledWith({ url: 'https://example.com' });
    });

    it('uses window.open on web', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);

      await openExternal('https://example.com');
      expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener');
    });
  });

  describe('registerBackButton', () => {
    it('is a no-op on non-Android', async () => {
      vi.mocked(isAndroid).mockReturnValue(false);
      await registerBackButton(vi.fn());
      const { App } = await import('@capacitor/app');
      expect(App.addListener).not.toHaveBeenCalled();
    });

    it('registers back button listener on Android', async () => {
      vi.mocked(isAndroid).mockReturnValue(true);
      const onBack = vi.fn();
      await registerBackButton(onBack);
      const { App } = await import('@capacitor/app');
      expect(App.addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
    });
  });
});
