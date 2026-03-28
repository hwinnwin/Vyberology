import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/platform', () => ({
  isNative: vi.fn(() => false),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => mockNavigate,
}));

import NativeTabBar from '../NativeTabBar';
import { isNative } from '@/lib/platform';

describe('NativeTabBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing on web', () => {
    vi.mocked(isNative).mockReturnValue(false);
    const { container } = render(<NativeTabBar />);
    expect(container.innerHTML).toBe('');
  });

  it('renders tab bar on native', () => {
    vi.mocked(isNative).mockReturnValue(true);
    render(<NativeTabBar />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Compat')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('navigates when tab is clicked', async () => {
    vi.mocked(isNative).mockReturnValue(true);
    render(<NativeTabBar />);
    await userEvent.click(screen.getByText('Reading'));
    expect(mockNavigate).toHaveBeenCalledWith('/numerology');
  });
});
