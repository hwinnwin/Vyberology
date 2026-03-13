import { describe, it, expect, vi } from 'vitest';
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

describe('useNavigation', () => {
  it('goHome navigates to /', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goHome();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('returns canGoBack boolean', () => {
    const { result } = renderHook(() => useNavigation());
    expect(typeof result.current.canGoBack).toBe('boolean');
  });
});
