import { describe, it, expect, vi } from 'vitest';

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    configure: vi.fn(),
    logIn: vi.fn(),
    getProducts: vi.fn(),
    purchaseStoreProduct: vi.fn(),
  },
}));

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
