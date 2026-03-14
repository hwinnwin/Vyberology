import { describe, it, expect, vi } from 'vitest';
import { purchaseTier } from '../purchase';

// In test environment, isNative() returns false (Capacitor mocked as web)
vi.mock('../stripe', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://stripe.com/checkout' }),
}));

vi.mock('../iap', () => ({
  purchaseProduct: vi.fn(),
  TIER_TO_PRODUCT_ID: {
    'lyf-path': 'com.vyberology.lyf_path',
  },
}));

describe('purchaseTier', () => {
  it('routes to Stripe on web platform', async () => {
    const result = await purchaseTier('lyf-path', {
      fullName: 'Jane Doe',
      dob: '1990-01-15',
      priceId: 'price_123',
    });

    expect(result.success).toBe(true);
    expect(result.redirectUrl).toBe('https://stripe.com/checkout');
  });
});
