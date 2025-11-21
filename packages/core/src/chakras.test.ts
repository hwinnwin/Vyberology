import { describe, it, expect } from 'vitest';
import { mapChakras } from './chakras.js';
import type { NumberToken } from '@vyberology/types';

describe('mapChakras', () => {
  it('should map Root for reduced 1', () => {
    const data = {
      tokens: [{ value: 1, raw: '1', index: 0 }] as NumberToken[],
      sums: { fullSum: 1, reduced: 1 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Root');
  });

  it('should map Root for reduced 4', () => {
    const data = {
      tokens: [{ value: 4, raw: '4', index: 0 }] as NumberToken[],
      sums: { fullSum: 4, reduced: 4 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Root');
  });

  it('should map Root for reduced 8', () => {
    const data = {
      tokens: [{ value: 8, raw: '8', index: 0 }] as NumberToken[],
      sums: { fullSum: 8, reduced: 8 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Root');
  });

  it('should map Sacral for reduced 2', () => {
    const data = {
      tokens: [{ value: 2, raw: '2', index: 0 }] as NumberToken[],
      sums: { fullSum: 2, reduced: 2 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Sacral');
  });

  it('should map Solar Plexus for reduced 3', () => {
    const data = {
      tokens: [{ value: 3, raw: '3', index: 0 }] as NumberToken[],
      sums: { fullSum: 3, reduced: 3 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Solar Plexus');
  });

  it('should map Heart for reduced 6', () => {
    const data = {
      tokens: [{ value: 6, raw: '6', index: 0 }] as NumberToken[],
      sums: { fullSum: 6, reduced: 6 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Heart');
  });

  it('should map Heart for reduced 9', () => {
    const data = {
      tokens: [{ value: 9, raw: '9', index: 0 }] as NumberToken[],
      sums: { fullSum: 9, reduced: 9 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Heart');
  });

  it('should map Throat for reduced 5', () => {
    const data = {
      tokens: [{ value: 5, raw: '5', index: 0 }] as NumberToken[],
      sums: { fullSum: 5, reduced: 5 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Throat');
  });

  it('should map Third Eye for reduced 7', () => {
    const data = {
      tokens: [{ value: 7, raw: '7', index: 0 }] as NumberToken[],
      sums: { fullSum: 7, reduced: 7 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Third Eye');
  });

  it('should map Crown for master numbers', () => {
    const data = {
      tokens: [{ value: 11, raw: '11', index: 0 }] as NumberToken[],
      sums: { fullSum: 11, reduced: 11, master: 11 as const },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Crown');
  });

  it('should map Crown for many 1s (awakening)', () => {
    const data = {
      tokens: [{ value: 1111, raw: '1111', index: 0 }] as NumberToken[],
      sums: { fullSum: 4, reduced: 4 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Crown');
  });

  it('should map Solar Plexus for many 3s', () => {
    const data = {
      tokens: [{ value: 333, raw: '333', index: 0 }] as NumberToken[],
      sums: { fullSum: 9, reduced: 9 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Solar Plexus');
  });

  it('should map Heart for many 6s', () => {
    const data = {
      tokens: [{ value: 66, raw: '66', index: 0 }] as NumberToken[],
      sums: { fullSum: 12, reduced: 3 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Heart');
  });

  it('should map multiple chakras', () => {
    const data = {
      tokens: [{ value: 1111, raw: '1111', index: 0 }] as NumberToken[],
      sums: { fullSum: 4, reduced: 4 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Root'); // reduced 4
    expect(chakras).toContain('Crown'); // many 1s
  });

  it('should respect context keywords for Root', () => {
    const data = {
      tokens: [{ value: 5, raw: '5', index: 0 }] as NumberToken[],
      sums: { fullSum: 5, reduced: 5 },
    };
    const chakras = mapChakras(data, 'safety and security grounded');
    expect(chakras).toContain('Root');
  });

  it('should respect context keywords for Heart', () => {
    const data = {
      tokens: [{ value: 5, raw: '5', index: 0 }] as NumberToken[],
      sums: { fullSum: 5, reduced: 5 },
    };
    const chakras = mapChakras(data, 'love and compassion healing');
    expect(chakras).toContain('Heart');
  });

  it('should respect context keywords for Crown', () => {
    const data = {
      tokens: [{ value: 5, raw: '5', index: 0 }] as NumberToken[],
      sums: { fullSum: 5, reduced: 5 },
    };
    const chakras = mapChakras(data, 'spiritual consciousness divine');
    expect(chakras).toContain('Crown');
  });

  it('should handle complex multi-chakra reading', () => {
    const data = {
      tokens: [
        { value: 11, raw: '11', index: 0 },
        { value: 11, raw: '11', index: 1 },
        { value: 66, raw: '66', index: 2 },
      ] as NumberToken[],
      sums: { fullSum: 16, reduced: 7 },
    };
    const chakras = mapChakras(data);
    expect(chakras).toContain('Third Eye'); // reduced 7
    expect(chakras).toContain('Crown'); // many 1s
    expect(chakras).toContain('Heart'); // many 6s
  });
});
