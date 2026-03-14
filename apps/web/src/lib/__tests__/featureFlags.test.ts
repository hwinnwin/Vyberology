import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to control import.meta.env before importing the module
describe('featureFlags', () => {
  describe('in development environment (default test env)', () => {
    it('isFeatureEnabled returns true for nav.header.v1 in development', async () => {
      // import.meta.env.PROD is false in test environment = development
      const { isFeatureEnabled } = await import('../featureFlags');
      expect(isFeatureEnabled('nav.header.v1')).toBe(true);
    });

    it('getFeatureFlags returns all feature flags for current environment', async () => {
      const { getFeatureFlags } = await import('../featureFlags');
      const flags = getFeatureFlags();
      expect(flags).toHaveProperty('nav.header.v1');
      expect(typeof flags['nav.header.v1']).toBe('boolean');
    });
  });
});
