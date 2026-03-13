import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingActions } from '../ReadingActions';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackAnalyticsEvent: vi.fn(() => Promise.resolve()),
}));

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  configurable: true,
  writable: true,
});

describe('ReadingActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders copy and share buttons', () => {
    render(<ReadingActions readingText="Your life path is 7" />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('copies reading text to clipboard on copy click', async () => {
    render(<ReadingActions readingText="Your life path is 7" />);
    const copyButton = screen.getByRole('button', { name: /copy/i });

    await userEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('Your life path is 7');
  });
});
