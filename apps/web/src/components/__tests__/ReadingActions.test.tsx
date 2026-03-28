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
    // Reset navigator.share
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true, writable: true });
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

  it('shows toast after copying', async () => {
    const { toast: toastFn } = await import('@/hooks/use-toast');
    render(<ReadingActions readingText="Your life path is 7" />);

    await userEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Copied to clipboard' })
    );
  });

  it('uses navigator.share when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true, writable: true });

    render(<ReadingActions readingText="Your life path is 7" title="My Reading" />);
    await userEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(mockShare).toHaveBeenCalledWith({
      title: 'My Reading',
      text: 'Your life path is 7',
    });
  });

  it('falls back to clipboard copy when navigator.share is unavailable', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true, writable: true });

    render(<ReadingActions readingText="Fallback text" />);
    await userEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(mockWriteText).toHaveBeenCalledWith('Fallback text');
  });

  it('falls back to clipboard when navigator.share throws (non-abort)', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true, writable: true });

    render(<ReadingActions readingText="Share fallback" />);
    await userEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(mockWriteText).toHaveBeenCalledWith('Share fallback');
  });

  it('does NOT fall back to clipboard when user aborts share', async () => {
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';
    const mockShare = vi.fn().mockRejectedValue(abortError);
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true, writable: true });

    render(<ReadingActions readingText="Abort text" />);
    await userEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(mockWriteText).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ReadingActions readingText="Test" className="custom-class" />
    );
    expect(container.firstElementChild).toHaveClass('custom-class');
  });
});
