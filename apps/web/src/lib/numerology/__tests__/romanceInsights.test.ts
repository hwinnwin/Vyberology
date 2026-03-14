import { describe, it, expect } from 'vitest';
import { romanceInsights } from '../romanceInsights';

describe('romanceInsights', () => {
  const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

  it('has entries for all numerology numbers', () => {
    allNumbers.forEach(num => {
      expect(romanceInsights[num]).toBeDefined();
    });
  });

  it('each entry has required fields', () => {
    allNumbers.forEach(num => {
      const insight = romanceInsights[num];
      expect(typeof insight.archetype).toBe('string');
      expect(insight.archetype.length).toBeGreaterThan(0);
      expect(typeof insight.loveLanguage).toBe('string');
      expect(insight.loveLanguage.length).toBeGreaterThan(0);
      expect(Array.isArray(insight.strengths)).toBe(true);
      expect(insight.strengths.length).toBeGreaterThan(0);
    });
  });

  it('number 1 archetype is the independent flame', () => {
    expect(romanceInsights[1].archetype).toContain('Independent');
  });

  it('number 4 love language involves acts of service', () => {
    expect(romanceInsights[4].loveLanguage.toLowerCase()).toContain('acts of service');
  });

  it('master number 11 has twin flame archetype', () => {
    expect(romanceInsights[11].archetype).toContain('Twin Flame');
  });

  it('master number 33 has healing archetype', () => {
    expect(romanceInsights[33].archetype).toContain('Healing');
  });
});
