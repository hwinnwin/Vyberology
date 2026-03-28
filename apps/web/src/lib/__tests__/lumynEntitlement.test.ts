import { describe, it, expect } from 'vitest';
import { resolveClientLumynEntitlement } from '../lumynEntitlement';

describe('resolveClientLumynEntitlement', () => {
  it('returns true when lumyn_pro is true and no expiry', () => {
    expect(resolveClientLumynEntitlement({
      lumyn_pro: true,
      lumyn_pro_until: null,
    })).toBe(true);
  });

  it('returns true when lumyn_pro is true and expiry is in the future', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(resolveClientLumynEntitlement({
      lumyn_pro: true,
      lumyn_pro_until: future,
    })).toBe(true);
  });

  it('returns false when lumyn_pro is true but expired', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(resolveClientLumynEntitlement({
      lumyn_pro: true,
      lumyn_pro_until: past,
    })).toBe(false);
  });

  it('returns false when lumyn_pro is false', () => {
    expect(resolveClientLumynEntitlement({
      lumyn_pro: false,
      lumyn_pro_until: null,
    })).toBe(false);
  });

  it('returns false when lumyn_pro is false even with future expiry', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(resolveClientLumynEntitlement({
      lumyn_pro: false,
      lumyn_pro_until: future,
    })).toBe(false);
  });
});
