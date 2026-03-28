import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/platform', () => ({
  isNative: vi.fn(() => false),
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    configure: vi.fn(),
    logIn: vi.fn(),
    getProducts: vi.fn(),
    purchaseStoreProduct: vi.fn(),
    getOfferings: vi.fn(),
    purchasePackage: vi.fn(),
  },
}));

import {
  TIER_TO_PRODUCT_ID,
  initIAP,
  setIAPUserId,
  purchaseProduct,
  purchaseSubscription,
} from '../iap';
import { isNative } from '@/lib/platform';

describe('iap service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps all paid tiers to product IDs', () => {
    expect(TIER_TO_PRODUCT_ID['lyf-path']).toBe('com.vyberology.lyf_path');
    expect(TIER_TO_PRODUCT_ID['full-vybe']).toBe('com.vyberology.full_vybe');
    expect(TIER_TO_PRODUCT_ID['deep']).toBe('com.vyberology.deep_attunement');
    expect(TIER_TO_PRODUCT_ID['lumyn-pro']).toBe('com.vyberology.lumyn_pro');
  });

  it('does not include free tier', () => {
    expect(TIER_TO_PRODUCT_ID['free']).toBeUndefined();
  });

  describe('initIAP', () => {
    it('is a no-op on web', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      await initIAP();
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      expect(Purchases.configure).not.toHaveBeenCalled();
    });

    it('configures RevenueCat on native with API key', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      import.meta.env.VITE_REVENUECAT_API_KEY = 'rc_test_key';
      await initIAP();
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      expect(Purchases.configure).toHaveBeenCalledWith({ apiKey: 'rc_test_key' });
    });

    it('warns and returns when API key is missing', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      import.meta.env.VITE_REVENUECAT_API_KEY = '';
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await initIAP();
      expect(warnSpy).toHaveBeenCalledWith('RevenueCat API key not configured');
      warnSpy.mockRestore();
    });
  });

  describe('setIAPUserId', () => {
    it('is a no-op on web', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      await setIAPUserId('user-123');
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      expect(Purchases.logIn).not.toHaveBeenCalled();
    });

    it('logs in user on native', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      await setIAPUserId('user-123');
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      expect(Purchases.logIn).toHaveBeenCalledWith({ appUserID: 'user-123' });
    });
  });

  describe('purchaseProduct', () => {
    it('returns false on web', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      const result = await purchaseProduct('com.vyberology.lyf_path');
      expect(result).toBe(false);
    });

    it('purchases product on native', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      vi.mocked(Purchases.getProducts).mockResolvedValue({
        products: [{ identifier: 'com.vyberology.lyf_path' }],
      } as any);
      vi.mocked(Purchases.purchaseStoreProduct).mockResolvedValue({} as any);

      const result = await purchaseProduct('com.vyberology.lyf_path');
      expect(result).toBe(true);
      expect(Purchases.purchaseStoreProduct).toHaveBeenCalled();
    });

    it('throws when product not found', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      vi.mocked(Purchases.getProducts).mockResolvedValue({ products: [] } as any);

      await expect(purchaseProduct('com.vyberology.missing')).rejects.toThrow(
        'Product com.vyberology.missing not found'
      );
    });

    it('returns false when user cancels', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      vi.mocked(Purchases.getProducts).mockResolvedValue({
        products: [{ identifier: 'com.vyberology.lyf_path' }],
      } as any);
      vi.mocked(Purchases.purchaseStoreProduct).mockRejectedValue({ userCancelled: true });

      const result = await purchaseProduct('com.vyberology.lyf_path');
      expect(result).toBe(false);
    });

    it('rethrows non-cancellation errors', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      vi.mocked(Purchases.getProducts).mockResolvedValue({
        products: [{ identifier: 'com.vyberology.lyf_path' }],
      } as any);
      vi.mocked(Purchases.purchaseStoreProduct).mockRejectedValue(new Error('Payment failed'));

      await expect(purchaseProduct('com.vyberology.lyf_path')).rejects.toThrow('Payment failed');
    });
  });

  describe('purchaseSubscription', () => {
    it('returns false on web', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      const result = await purchaseSubscription('com.vyberology.lumyn_pro');
      expect(result).toBe(false);
    });

    it('purchases subscription package on native', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const mockPkg = { product: { identifier: 'com.vyberology.lumyn_pro' } };
      vi.mocked(Purchases.getOfferings).mockResolvedValue({
        offerings: {
          current: {
            availablePackages: [mockPkg],
          },
        },
      } as any);
      vi.mocked(Purchases.purchasePackage).mockResolvedValue({} as any);

      const result = await purchaseSubscription('com.vyberology.lumyn_pro');
      expect(result).toBe(true);
      expect(Purchases.purchasePackage).toHaveBeenCalledWith({ aPackage: mockPkg });
    });

    it('throws when no current offering', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      vi.mocked(Purchases.getOfferings).mockResolvedValue({
        offerings: { current: null },
      } as any);

      await expect(purchaseSubscription('com.vyberology.lumyn_pro')).rejects.toThrow(
        'No current offering available'
      );
    });

    it('throws when package not found in offering', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      vi.mocked(Purchases.getOfferings).mockResolvedValue({
        offerings: {
          current: { availablePackages: [] },
        },
      } as any);

      await expect(purchaseSubscription('com.vyberology.lumyn_pro')).rejects.toThrow(
        'Package com.vyberology.lumyn_pro not found'
      );
    });

    it('returns false when user cancels subscription', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      vi.mocked(Purchases.getOfferings).mockResolvedValue({
        offerings: {
          current: {
            availablePackages: [
              { product: { identifier: 'com.vyberology.lumyn_pro' } },
            ],
          },
        },
      } as any);
      vi.mocked(Purchases.purchasePackage).mockRejectedValue({ userCancelled: true });

      const result = await purchaseSubscription('com.vyberology.lumyn_pro');
      expect(result).toBe(false);
    });
  });
});
