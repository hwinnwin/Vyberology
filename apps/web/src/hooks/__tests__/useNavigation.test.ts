import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock react-router-dom before importing the hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/numerology' }),
}));

// Mock navigation logger
vi.mock('@/lib/navigationLogger', () => ({
  logNavigationEvent: vi.fn(),
}));

import { useNavigation } from '../useNavigation';
import { logNavigationEvent } from '@/lib/navigationLogger';

describe('useNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('goHome navigates to /', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goHome();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('goHome logs navigation event', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goHome();
    expect(logNavigationEvent).toHaveBeenCalledWith('nav.home', expect.objectContaining({
      from: '/numerology',
      to: '/',
    }));
  });

  it('returns canGoBack boolean', () => {
    const { result } = renderHook(() => useNavigation());
    expect(typeof result.current.canGoBack).toBe('boolean');
  });

  it('goBack navigates to -1 when history exists', () => {
    // window.history.length > 1 in test env
    Object.defineProperty(window.history, 'length', { value: 5, configurable: true });

    const { result } = renderHook(() => useNavigation());
    result.current.goBack();

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(logNavigationEvent).toHaveBeenCalledWith('nav.back', expect.objectContaining({
      from: '/numerology',
      to: 'previous',
      hadHistory: true,
    }));
  });

  it('goBack navigates to / when no history', () => {
    Object.defineProperty(window.history, 'length', { value: 1, configurable: true });

    const { result } = renderHook(() => useNavigation());
    result.current.goBack();

    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(logNavigationEvent).toHaveBeenCalledWith('nav.back', expect.objectContaining({
      from: '/numerology',
      to: '/',
      hadHistory: false,
    }));
  });
});
