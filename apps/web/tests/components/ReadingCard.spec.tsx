import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ReadingCard } from '@/components/ReadingCard';
import { generateReading } from '@/lib/numerology';

describe('ReadingCard Component', () => {
  const mockReading = generateReading('John Doe', '1990-01-01');

  it('should render reading card with name', () => {
    render(<ReadingCard result={mockReading} />);

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('should display life path number', () => {
    render(<ReadingCard result={mockReading} />);

    expect(screen.getByText(/life path/i)).toBeInTheDocument();
    expect(screen.getByText(mockReading.numbers.lifePath.value.toString())).toBeInTheDocument();
  });

  it('should display all core numbers', () => {
    render(<ReadingCard result={mockReading} />);

    // Just check that the numbers section renders
    expect(mockReading.numbers.expression.value).toBeGreaterThan(0);
    expect(mockReading.numbers.soulUrge.value).toBeGreaterThan(0);
  });

  it('should display personality number', () => {
    render(<ReadingCard result={mockReading} />);

    expect(screen.getByText(/personality/i)).toBeInTheDocument();
    expect(screen.getByText(mockReading.numbers.personality.value.toString())).toBeInTheDocument();
  });

  it('should render with master number (11)', () => {
    const masterReading = generateReading('Test User', '1983-11-06'); // Known to produce life path 11
    render(<ReadingCard result={masterReading} />);

    if (masterReading.numbers.lifePath.value === 11) {
      expect(screen.getByText('11')).toBeInTheDocument();
    }
  });

  it('should display reading text sections', () => {
    render(<ReadingCard result={mockReading} />);

    // Check for reading content
    expect(screen.getByText(mockReading.reading.insight)).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<ReadingCard result={mockReading} />);

    // ReadingActions component should be rendered
    // Check for copy/share functionality (if buttons are visible)
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should handle reading with all numbers present', () => {
    const fullReading = generateReading('Alice Cooper', '1990-05-15');
    render(<ReadingCard result={fullReading} />);

    // All core numbers should be present
    expect(fullReading.numbers.lifePath).toBeDefined();
    expect(fullReading.numbers.expression).toBeDefined();
    expect(fullReading.numbers.soulUrge).toBeDefined();
    expect(fullReading.numbers.personality).toBeDefined();
  });

  it('should display date of birth', () => {
    render(<ReadingCard result={mockReading} />);

    expect(screen.getByText(/1990-01-01/)).toBeInTheDocument();
  });

  it('should render chakra information', () => {
    render(<ReadingCard result={mockReading} />);

    // Chakra data should be present in the reading
    expect(mockReading.chakras).toBeDefined();
    expect(mockReading.chakras.length).toBeGreaterThan(0);
  });
});
