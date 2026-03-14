import { describe, it, expect } from 'vitest';
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
