import { describe, it, expect } from 'vitest';
import { careerInsights } from '../careerInsights';

describe('careerInsights', () => {
  const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

  it('has entries for all numerology numbers', () => {
    allNumbers.forEach(num => {
      expect(careerInsights[num]).toBeDefined();
    });
  });

  it('each entry has required fields', () => {
    allNumbers.forEach(num => {
      const insight = careerInsights[num];
      expect(typeof insight.archetype).toBe('string');
      expect(insight.archetype.length).toBeGreaterThan(0);
      expect(Array.isArray(insight.strengths)).toBe(true);
      expect(insight.strengths.length).toBeGreaterThan(0);
      expect(typeof insight.idealEnvironments).toBe('string');
      expect(insight.idealEnvironments.length).toBeGreaterThan(0);
    });
  });

  it('number 1 archetype is visionary', () => {
    expect(careerInsights[1].archetype).toContain('Visionary');
  });

  it('master number 11 has intuitive archetype', () => {
    expect(careerInsights[11].archetype).toContain('Intuitive');
  });

  it('master number 22 has builder archetype', () => {
    expect(careerInsights[22].archetype).toContain('Builder');
  });

  it('master number 33 has mentor archetype', () => {
    expect(careerInsights[33].archetype).toContain('Mentor');
  });
});
