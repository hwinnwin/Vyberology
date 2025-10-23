import { describe, it, expect } from 'vitest';
import {
  describeLifePath,
  describeExpression,
  describeSoulUrge,
  describePersonality,
  describeMaturity,
  describeChakra,
  lifePathDescriptions,
  expressionDescriptions,
  soulUrgeDescriptions,
  personalityDescriptions,
  maturityDescriptions,
  chakraDescriptions,
} from '../src/lib/numerology/descriptions';

describe('numerology descriptions tables', () => {
  it('exposes life path descriptors for core and master numbers', () => {
    expect(describeLifePath(1)).toContain('Leader');
    expect(describeLifePath(11)).toContain('Illuminator');
    expect(describeLifePath(999)).toBe('A unique path of discovery and growth.');
  });

  it('covers expression, soul urge, personality, and maturity narratives', () => {
    expect(describeExpression(8)).toContain('Powerful executive');
    expect(describeExpression(888)).toBe('A distinctive way of expressing your gifts.');

    expect(describeSoulUrge(5)).toContain('freedom');
    expect(describeSoulUrge(888)).toBe('A deep inner calling guiding your journey.');

    expect(describePersonality(22)).toContain('master-builder');
    expect(describePersonality(888)).toBe('A unique presence you bring to the world.');

    expect(describeMaturity(33)).toContain('master teacher');
    expect(describeMaturity(888)).toBe('A path of continued growth and mastery.');
  });

  it('annotates chakra descriptions and defaults gracefully', () => {
    expect(describeChakra('Heart')).toContain('Compassion');
    expect(describeChakra('Unknown')).toBe('');
  });

  it('keeps the lookup tables intact (spot-check length consistency)', () => {
    const tableSizes = [
      Object.keys(lifePathDescriptions).length,
      Object.keys(expressionDescriptions).length,
      Object.keys(soulUrgeDescriptions).length,
      Object.keys(personalityDescriptions).length,
      Object.keys(maturityDescriptions).length,
    ];
    expect(new Set(tableSizes).size).toBe(1); // all same
    expect(Object.keys(chakraDescriptions)).toContain('Crown');
  });
});
