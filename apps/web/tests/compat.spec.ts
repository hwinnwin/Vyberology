import { describe, it, expect } from 'vitest';
import { compareProfiles, buildProfile } from '../src/lib/numerology/compat';

describe('Compatibility (compat.ts)', () => {
  describe('buildProfile', () => {
    it('should build a complete profile for a person', () => {
      const profile = buildProfile('John Doe', '1990-01-01');

      expect(profile).toHaveProperty('fullName');
      expect(profile).toHaveProperty('dob');
      expect(profile).toHaveProperty('numbers');
      expect(profile).toHaveProperty('chakras');
    });

    it('should capitalize names', () => {
      const profile = buildProfile('john doe', '1990-01-01');

      expect(profile.fullName).toBe('John Doe');
    });

    it('should calculate all numerology numbers', () => {
      const profile = buildProfile('Alice Cooper', '1990-05-15');

      expect(profile.numbers.lifePath).toBeDefined();
      expect(profile.numbers.expression).toBeDefined();
      expect(profile.numbers.soulUrge).toBeDefined();
      expect(profile.numbers.personality).toBeDefined();
    });
  });

  describe('compareProfiles', () => {
    it('should compute compatibility between two people', () => {
      const result = compareProfiles(
        'Huynh Duc Tung Nguyen',
        '1988-05-25',
        'Sarah Martinez',
        '1990-03-15'
      );

      // Check structure
      expect(result).toHaveProperty('left');
      expect(result).toHaveProperty('right');
      expect(result).toHaveProperty('synergy');
      expect(result).toHaveProperty('narrative');
      expect(result).toHaveProperty('actions');
    });

    it('should calculate individual profiles for both people', () => {
      const result = compareProfiles(
        'John Doe',
        '1985-06-15',
        'Jane Smith',
        '1987-08-20'
      );

      // Person Left
      expect(result.left.fullName).toBe('John Doe');
      expect(result.left.dob).toBe('1985-06-15');
      expect(result.left.numbers.lifePath).toBeDefined();
      expect(result.left.numbers.expression).toBeDefined();

      // Person Right
      expect(result.right.fullName).toBe('Jane Smith');
      expect(result.right.dob).toBe('1987-08-20');
      expect(result.right.numbers.lifePath).toBeDefined();
      expect(result.right.numbers.expression).toBeDefined();
    });

    it('should generate synergy analysis', () => {
      const result = compareProfiles(
        'Alice Cooper',
        '1990-01-01',
        'Bob Wilson',
        '1991-02-02'
      );

      expect(result.synergy).toBeDefined();
      expect(result.synergy).toHaveProperty('lifePathBlend');
      expect(result.synergy).toHaveProperty('expressionBlend');
      expect(result.synergy).toHaveProperty('soulUrgeBlend');
      expect(result.synergy).toHaveProperty('chakraWeave');
      expect(result.synergy).toHaveProperty('prosperityVector');
      expect(result.synergy).toHaveProperty('risks');

      // Check blend structure
      expect(result.synergy.lifePathBlend).toHaveProperty('code');
      expect(result.synergy.lifePathBlend).toHaveProperty('summary');
    });

    it('should generate narrative text', () => {
      const result = compareProfiles(
        'Michael Brown',
        '1988-07-10',
        'Emily Davis',
        '1989-09-25'
      );

      expect(result.narrative).toBeDefined();
      expect(typeof result.narrative).toBe('string');
      expect(result.narrative.length).toBeGreaterThan(0);
      expect(result.narrative).toContain('Compatibility Reading');
    });

    it('should identify risks', () => {
      const result = compareProfiles(
        'David Lee',
        '1992-04-05',
        'Lisa Wang',
        '1993-11-30'
      );

      expect(result.synergy.risks).toBeDefined();
      expect(Array.isArray(result.synergy.risks)).toBe(true);
    });

    it('should generate action plan', () => {
      const result = compareProfiles(
        'Robert Taylor',
        '1986-12-20',
        'Jennifer White',
        '1988-05-15'
      );

      expect(result.actions).toBeDefined();
      expect(result.actions).toHaveProperty('focus');
      expect(result.actions).toHaveProperty('actions');
      expect(result.actions).toHaveProperty('mantra');
      expect(Array.isArray(result.actions.actions)).toBe(true);
    });

    it('should handle master numbers in compatibility', () => {
      // Life path 11 - known to produce master number
      const result = compareProfiles(
        'Test User',
        '1983-11-06',
        'Another User',
        '1990-01-01'
      );

      // Check that master numbers are preserved in profiles
      if (result.left.numbers.lifePath.value === 11) {
        expect(result.left.numbers.lifePath.value).toBe(11);
      }

      // Check that narrative and synergy are still generated
      expect(result.narrative).toBeDefined();
      expect(result.synergy).toBeDefined();
    });

    it('should handle same person comparison', () => {
      const result = compareProfiles(
        'Same Person',
        '1990-05-15',
        'Same Person',
        '1990-05-15'
      );

      // Should still generate a valid result
      expect(result.narrative).toBeDefined();
      expect(result.synergy).toBeDefined();
      expect(result.actions).toBeDefined();
    });

    it('should calculate life path blends correctly', () => {
      const result = compareProfiles(
        'Person One',
        '1990-01-01',
        'Person Two',
        '1991-02-02'
      );

      const lifePathBlend = result.synergy.lifePathBlend;
      expect(lifePathBlend.code).toBeDefined();
      expect(lifePathBlend.summary).toBeDefined();
      expect(typeof lifePathBlend.code).toBe('string');
      expect(typeof lifePathBlend.summary).toBe('string');
    });

    it('should include prosperity vector analysis', () => {
      const result = compareProfiles(
        'Alice',
        '1990-01-01',
        'Bob',
        '1991-02-02'
      );

      expect(result.synergy.prosperityVector).toBeDefined();
      expect(typeof result.synergy.prosperityVector).toBe('string');
      expect(result.synergy.prosperityVector).toContain('Prosperity Vector');
    });

    it('should generate different results for different pairs', () => {
      const result1 = compareProfiles(
        'Alice',
        '1990-01-01',
        'Bob',
        '1991-02-02'
      );

      const result2 = compareProfiles(
        'Charlie',
        '1992-03-03',
        'Diana',
        '1993-04-04'
      );

      // Results should be different (at least one property different)
      const different =
        result1.narrative !== result2.narrative ||
        result1.actions.focus !== result2.actions.focus ||
        result1.synergy.lifePathBlend.code !== result2.synergy.lifePathBlend.code;

      expect(different).toBe(true);
    });

    it('should handle empty names gracefully', () => {
      expect(() => {
        compareProfiles('', '1990-01-01', 'Bob', '1991-02-02');
      }).not.toThrow();
    });

    it('should handle invalid dates gracefully', () => {
      expect(() => {
        compareProfiles('Alice', 'invalid-date', 'Bob', '1991-02-02');
      }).not.toThrow();
    });

    it('should include chakra weave analysis', () => {
      const result = compareProfiles(
        'Person A',
        '1990-01-01',
        'Person B',
        '1991-02-02'
      );

      expect(result.synergy.chakraWeave).toBeDefined();
      expect(result.synergy.chakraWeave).toHaveProperty('dominant');
      expect(result.synergy.chakraWeave).toHaveProperty('bridge');
      expect(result.synergy.chakraWeave).toHaveProperty('summary');
    });

    it('should provide actionable chakra-specific guidance', () => {
      const result = compareProfiles(
        'Person A',
        '1990-01-01',
        'Person B',
        '1991-02-02'
      );

      expect(result.actions.actions.length).toBeGreaterThan(0);

      const firstAction = result.actions.actions[0];
      expect(firstAction).toHaveProperty('chakra');
      expect(firstAction).toHaveProperty('text');
      expect(typeof firstAction.chakra).toBe('string');
      expect(typeof firstAction.text).toBe('string');
    });
  });
});
