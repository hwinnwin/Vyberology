import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purchaseTier } from '../purchase';

vi.mock('@/lib/platform', () => ({
  isNative: vi.fn(() => false),
}));

vi.mock('../stripe', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://stripe.com/checkout' }),
}));

vi.mock('../iap', () => ({
  purchaseProduct: vi.fn(),
  TIER_TO_PRODUCT_ID: {
    'lyf-path': 'com.vyberology.lyf_path',
    'full-vybe': 'com.vyberology.full_vybe',
  },
}));

import { isNative } from '@/lib/platform';
import { createCheckoutSession } from '../stripe';
import { purchaseProduct } from '../iap';

describe('purchaseTier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('web (Stripe)', () => {
    it('routes to Stripe on web platform', async () => {
      vi.mocked(isNative).mockReturnValue(false);

      const result = await purchaseTier('lyf-path', {
        fullName: 'Jane Doe',
        dob: '1990-01-15',
        priceId: 'price_123',
      });

      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBe('https://stripe.com/checkout');
      expect(createCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price_123',
        tier: 'lyf-path',
        fullName: 'Jane Doe',
        dob: '1990-01-15',
      });
    });

    it('returns error when Stripe checkout fails', async () => {
      vi.mocked(isNative).mockReturnValue(false);
      vi.mocked(createCheckoutSession).mockRejectedValue(new Error('Stripe error'));

      const result = await purchaseTier('lyf-path', {
        fullName: 'Jane Doe',
        dob: '1990-01-15',
        priceId: 'price_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stripe error');
    });
  });

  describe('native (IAP)', () => {
    it('routes to IAP on native platform', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      vi.mocked(purchaseProduct).mockResolvedValue(true);

      const result = await purchaseTier('lyf-path', {
        fullName: 'Jane Doe',
        dob: '1990-01-15',
        priceId: 'price_123',
      });

      expect(result.success).toBe(true);
      expect(purchaseProduct).toHaveBeenCalledWith('com.vyberology.lyf_path');
    });

    it('returns error for unknown tier on native', async () => {
      vi.mocked(isNative).mockReturnValue(true);

      const result = await purchaseTier('unknown-tier', {
        fullName: 'Jane Doe',
        dob: '1990-01-15',
        priceId: 'price_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tier');
    });

    it('returns error when IAP purchase fails', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      vi.mocked(purchaseProduct).mockRejectedValue(new Error('Purchase failed'));

      const result = await purchaseTier('lyf-path', {
        fullName: 'Jane Doe',
        dob: '1990-01-15',
        priceId: 'price_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Purchase failed');
    });

    it('returns success:false when user cancels IAP', async () => {
      vi.mocked(isNative).mockReturnValue(true);
      vi.mocked(purchaseProduct).mockResolvedValue(false);

      const result = await purchaseTier('lyf-path', {
        fullName: 'Jane Doe',
        dob: '1990-01-15',
        priceId: 'price_123',
      });

      expect(result.success).toBe(false);
    });
  });
});
