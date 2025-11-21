import { describe, it, expect } from 'vitest';
import { mapElements } from './elements.js';
import type { NumberToken } from '@vyberology/types';

describe('mapElements', () => {
  it('should map Fire for master number 11', () => {
    const data = {
      tokens: [{ value: 11, raw: '11', index: 0 }] as NumberToken[],
      sums: { fullSum: 11, reduced: 11, master: 11 as const },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜂 Fire');
  });

  it('should map Fire for reduced 1', () => {
    const data = {
      tokens: [{ value: 10, raw: '10', index: 0 }] as NumberToken[],
      sums: { fullSum: 1, reduced: 1 },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜂 Fire');
  });

  it('should map Air for time patterns', () => {
    const data = {
      tokens: [
        { value: 10, raw: '10:24', index: 0 },
        { value: 24, raw: '24', index: 1 },
      ] as NumberToken[],
      sums: { fullSum: 6, reduced: 6 },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜁 Air');
  });

  it('should map Air for many 1s and 3s', () => {
    const data = {
      tokens: [
        { value: 111, raw: '111', index: 0 },
        { value: 333, raw: '333', index: 1 },
      ] as NumberToken[],
      sums: { fullSum: 18, reduced: 9 },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜁 Air');
  });

  it('should map Earth for reduced 4', () => {
    const data = {
      tokens: [{ value: 4, raw: '4', index: 0 }] as NumberToken[],
      sums: { fullSum: 4, reduced: 4 },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜃 Earth');
  });

  it('should map Earth for reduced 8', () => {
    const data = {
      tokens: [{ value: 8, raw: '8', index: 0 }] as NumberToken[],
      sums: { fullSum: 8, reduced: 8 },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜃 Earth');
  });

  it('should map Water for reduced 2', () => {
    const data = {
      tokens: [{ value: 2, raw: '2', index: 0 }] as NumberToken[],
      sums: { fullSum: 2, reduced: 2 },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜄 Water');
  });

  it('should map Water for reduced 6', () => {
    const data = {
      tokens: [{ value: 6, raw: '6', index: 0 }] as NumberToken[],
      sums: { fullSum: 6, reduced: 6 },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜄 Water');
  });

  it('should map multiple elements', () => {
    const data = {
      tokens: [
        { value: 11, raw: '11', index: 0 },
        { value: 44, raw: '44', index: 1 },
      ] as NumberToken[],
      sums: { fullSum: 10, reduced: 1, master: 11 as const },
    };
    const elements = mapElements(data);
    expect(elements).toContain('🜂 Fire'); // master 11
    expect(elements).toContain('🜃 Earth'); // many 4s
  });

  it('should respect context keywords for Fire', () => {
    const data = {
      tokens: [{ value: 5, raw: '5', index: 0 }] as NumberToken[],
      sums: { fullSum: 5, reduced: 5 },
    };
    const elements = mapElements(data, 'taking action with passion');
    expect(elements).toContain('🜂 Fire');
  });

  it('should respect context keywords for Air', () => {
    const data = {
      tokens: [{ value: 5, raw: '5', index: 0 }] as NumberToken[],
      sums: { fullSum: 5, reduced: 5 },
    };
    const elements = mapElements(data, 'clear thought and communication');
    expect(elements).toContain('🜁 Air');
  });

  it('should respect context keywords for Earth', () => {
    const data = {
      tokens: [{ value: 5, raw: '5', index: 0 }] as NumberToken[],
      sums: { fullSum: 5, reduced: 5 },
    };
    const elements = mapElements(data, 'material money and physical grounded');
    expect(elements).toContain('🜃 Earth');
  });

  it('should respect context keywords for Water', () => {
    const data = {
      tokens: [{ value: 5, raw: '5', index: 0 }] as NumberToken[],
      sums: { fullSum: 5, reduced: 5 },
    };
    const elements = mapElements(data, 'emotional flow and intuition');
    expect(elements).toContain('🜄 Water');
  });

  it('should provide default mapping when no rules match', () => {
    const data = {
      tokens: [{ value: 7, raw: '7', index: 0 }] as NumberToken[],
      sums: { fullSum: 7, reduced: 7 },
    };
    const elements = mapElements(data);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toBe('🜁 Air'); // default for 7
  });
});
