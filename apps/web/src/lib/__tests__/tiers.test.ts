import { describe, it, expect } from 'vitest';
import { TIERS, TIER_TO_DEPTH, TIER_PRICE_ID, TIER_BADGE } from '../tiers';
import type { ReadingTier } from '../tiers';

describe('TIER_TO_DEPTH', () => {
  it('maps free tier to free depth', () => {
    expect(TIER_TO_DEPTH.free).toBe('free');
  });

  it('maps lyf-path tier to lite depth', () => {
    expect(TIER_TO_DEPTH['lyf-path']).toBe('lite');
  });

  it('maps full-vybe tier to standard depth', () => {
    expect(TIER_TO_DEPTH['full-vybe']).toBe('standard');
  });

  it('maps deep tier to deep depth', () => {
    expect(TIER_TO_DEPTH.deep).toBe('deep');
  });
});

describe('TIER_PRICE_ID', () => {
  it('has price IDs for all paid tiers', () => {
    expect(TIER_PRICE_ID['lyf-path']).toBeTruthy();
    expect(TIER_PRICE_ID['full-vybe']).toBeTruthy();
    expect(TIER_PRICE_ID.deep).toBeTruthy();
  });

  it('price IDs are strings starting with price_', () => {
    expect(TIER_PRICE_ID['lyf-path']).toMatch(/^price_/);
    expect(TIER_PRICE_ID['full-vybe']).toMatch(/^price_/);
    expect(TIER_PRICE_ID.deep).toMatch(/^price_/);
  });
});

describe('TIERS', () => {
  const tiers: ReadingTier[] = ['free', 'lyf-path', 'full-vybe', 'deep'];

  it('has all four tiers defined', () => {
    tiers.forEach(tier => {
      expect(TIERS[tier]).toBeDefined();
    });
  });

  it('each tier has required fields', () => {
    tiers.forEach(tier => {
      const config = TIERS[tier];
      expect(config.id).toBe(tier);
      expect(config.label).toBeTruthy();
      expect(config.tagline).toBeTruthy();
      expect(config.price).toBeTruthy();
      expect(typeof config.priceAmount).toBe('number');
      expect(Array.isArray(config.features)).toBe(true);
      expect(Array.isArray(config.lockedPreview)).toBe(true);
      expect(typeof config.hasPdf).toBe('boolean');
      expect(typeof config.hasShareCard).toBe('boolean');
    });
  });

  it('free tier has zero price', () => {
    expect(TIERS.free.priceAmount).toBe(0);
    expect(TIERS.free.hasPdf).toBe(false);
    expect(TIERS.free.hasShareCard).toBe(false);
  });

  it('deep tier has all premium features', () => {
    expect(TIERS.deep.hasPdf).toBe(true);
    expect(TIERS.deep.hasShareCard).toBe(true);
    expect(TIERS.deep.hasPremiumShareCard).toBe(true);
    expect(TIERS.deep.hasFrequencyPrescription).toBe(true);
    expect(TIERS.deep.hasChakraFlowAnalysis).toBe(true);
    expect(TIERS.deep.hasIntegratedReading).toBe(true);
  });

  it('full-vybe tier has PDF', () => {
    expect(TIERS['full-vybe'].hasPdf).toBe(true);
  });
});

describe('TIER_BADGE', () => {
  const tiers: ReadingTier[] = ['free', 'lyf-path', 'full-vybe', 'deep'];

  it('has badge config for all tiers', () => {
    tiers.forEach(tier => {
      expect(TIER_BADGE[tier]).toBeDefined();
      expect(TIER_BADGE[tier].text).toBeTruthy();
      expect(TIER_BADGE[tier].className).toBeTruthy();
    });
  });
});
