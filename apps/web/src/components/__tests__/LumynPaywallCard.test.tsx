import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/platform', () => ({
  isNative: vi.fn(() => false),
}));

vi.mock('@/services/purchase', () => ({
  purchaseTier: vi.fn().mockResolvedValue({ success: true, redirectUrl: 'https://checkout.stripe.com/test' }),
}));

import { LumynPaywallCard } from '../LumynPaywallCard';
import { isNative } from '@/lib/platform';
import { purchaseTier } from '@/services/purchase';

describe('LumynPaywallCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upgrade prompt', () => {
    render(<LumynPaywallCard />);
    expect(screen.getByText(/used your 10 free messages/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument();
  });

  it('calls purchaseTier on web when upgrade clicked', async () => {
    vi.mocked(isNative).mockReturnValue(false);
    // Mock window.location
    const locationMock = { href: '' };
    Object.defineProperty(window, 'location', { value: locationMock, configurable: true, writable: true });

    render(<LumynPaywallCard />);
    await userEvent.click(screen.getByRole('button', { name: /upgrade/i }));

    expect(purchaseTier).toHaveBeenCalledWith('lumyn-pro', expect.objectContaining({
      fullName: '',
      dob: '',
    }));
    expect(locationMock.href).toBe('https://checkout.stripe.com/test');
  });

  it('shows alert on native platform', async () => {
    vi.mocked(isNative).mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<LumynPaywallCard />);
    await userEvent.click(screen.getByRole('button', { name: /upgrade/i }));

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('vyberology.com'));
    alertSpy.mockRestore();
  });

  it('calls onUpgradeStart callback when provided', async () => {
    vi.mocked(isNative).mockReturnValue(false);
    Object.defineProperty(window, 'location', { value: { href: '' }, configurable: true, writable: true });
    const onUpgradeStart = vi.fn();

    render(<LumynPaywallCard onUpgradeStart={onUpgradeStart} />);
    await userEvent.click(screen.getByRole('button', { name: /upgrade/i }));

    expect(onUpgradeStart).toHaveBeenCalled();
  });
});
