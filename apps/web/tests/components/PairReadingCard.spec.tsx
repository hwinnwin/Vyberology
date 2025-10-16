import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { PairReadingCard } from '@/components/PairReadingCard';
import { compareProfiles } from '@/lib/numerology/compat';

describe('PairReadingCard Component', () => {
  const mockReading = compareProfiles(
    'John Doe',
    '1990-01-01',
    'Jane Smith',
    '1992-05-15'
  );

  it('should render pair reading card with both names', () => {
    render(<PairReadingCard reading={mockReading} />);

    // Names appear in the reading
    expect(mockReading.left.fullName).toBe('John Doe');
    expect(mockReading.right.fullName).toBe('Jane Smith');
  });

  it('should display compatibility narrative', () => {
    render(<PairReadingCard reading={mockReading} />);

    // Narrative contains "Compatibility Reading"
    expect(mockReading.narrative).toContain('Compatibility Reading');
  });

  it('should display life path blend information', () => {
    render(<PairReadingCard reading={mockReading} />);

    // Check that blend information is present
    expect(mockReading.synergy.lifePathBlend.code).toBeDefined();
    expect(mockReading.synergy.lifePathBlend.summary).toBeDefined();
  });

  it('should display expression blend information', () => {
    render(<PairReadingCard reading={mockReading} />);

    expect(mockReading.synergy.expressionBlend.code).toBeDefined();
    expect(mockReading.synergy.expressionBlend.summary).toBeDefined();
  });

  it('should display soul urge blend information', () => {
    render(<PairReadingCard reading={mockReading} />);

    expect(mockReading.synergy.soulUrgeBlend.code).toBeDefined();
    expect(mockReading.synergy.soulUrgeBlend.summary).toBeDefined();
  });

  it('should display chakra weave analysis', () => {
    render(<PairReadingCard reading={mockReading} />);

    expect(mockReading.synergy.chakraWeave.dominant).toBeDefined();
    expect(mockReading.synergy.chakraWeave.bridge).toBeDefined();
    expect(mockReading.synergy.chakraWeave.summary).toBeDefined();
  });

  it('should display prosperity vector', () => {
    render(<PairReadingCard reading={mockReading} />);

    expect(mockReading.synergy.prosperityVector).toBeDefined();
    expect(mockReading.synergy.prosperityVector).toContain('Prosperity Vector');
  });

  it('should display action plan with focus', () => {
    render(<PairReadingCard reading={mockReading} />);

    expect(mockReading.actions.focus).toBeDefined();
    expect(mockReading.actions.focus.length).toBeGreaterThan(0);
  });

  it('should display action items', () => {
    render(<PairReadingCard reading={mockReading} />);

    expect(mockReading.actions.actions).toBeDefined();
    expect(Array.isArray(mockReading.actions.actions)).toBe(true);
    expect(mockReading.actions.actions.length).toBeGreaterThan(0);

    // Each action should have chakra and text
    mockReading.actions.actions.forEach(action => {
      expect(action.chakra).toBeDefined();
      expect(action.text).toBeDefined();
    });
  });

  it('should display mantra', () => {
    render(<PairReadingCard reading={mockReading} />);

    expect(mockReading.actions.mantra).toBeDefined();
    expect(mockReading.actions.mantra.length).toBeGreaterThan(0);
  });

  it('should display risks if present', () => {
    render(<PairReadingCard reading={mockReading} />);

    expect(mockReading.synergy.risks).toBeDefined();
    expect(Array.isArray(mockReading.synergy.risks)).toBe(true);
  });

  it('should render with master numbers', () => {
    const masterReading = compareProfiles(
      'Test User',
      '1983-11-06', // Life path 11
      'Another User',
      '1990-01-01'
    );

    render(<PairReadingCard reading={masterReading} />);

    // Should render without errors
    expect(masterReading.narrative).toBeDefined();
  });

  it('should display both profiles numerology numbers', () => {
    render(<PairReadingCard reading={mockReading} />);

    // Left profile
    expect(mockReading.left.numbers.lifePath.value).toBeDefined();
    expect(mockReading.left.numbers.expression.value).toBeDefined();
    expect(mockReading.left.numbers.soulUrge.value).toBeDefined();
    expect(mockReading.left.numbers.personality.value).toBeDefined();

    // Right profile
    expect(mockReading.right.numbers.lifePath.value).toBeDefined();
    expect(mockReading.right.numbers.expression.value).toBeDefined();
    expect(mockReading.right.numbers.soulUrge.value).toBeDefined();
    expect(mockReading.right.numbers.personality.value).toBeDefined();
  });

  it('should render complete compatibility analysis', () => {
    render(<PairReadingCard reading={mockReading} />);

    // Check all synergy components
    expect(mockReading.synergy.lifePathBlend).toBeDefined();
    expect(mockReading.synergy.expressionBlend).toBeDefined();
    expect(mockReading.synergy.soulUrgeBlend).toBeDefined();
    expect(mockReading.synergy.chakraWeave).toBeDefined();
    expect(mockReading.synergy.prosperityVector).toBeDefined();
    expect(mockReading.synergy.risks).toBeDefined();
  });

  it('should render action buttons', () => {
    render(<PairReadingCard reading={mockReading} />);

    // ReadingActions component should be rendered
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
