import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logNavigationEvent } from '../navigationLogger';

describe('logNavigationEvent', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('creates log data with event type and provided data', () => {
    // Should not throw
    expect(() =>
      logNavigationEvent('page_view', { from: '/home', to: '/numerology' })
    ).not.toThrow();
  });

  it('handles navigation events with optional fields', () => {
    expect(() =>
      logNavigationEvent('back_navigation', {
        hadHistory: true,
        unsavedPromptShown: false,
        userConfirmed: true,
      })
    ).not.toThrow();
  });

  it('handles navigation events with minimal data', () => {
    expect(() => logNavigationEvent('navigation', {})).not.toThrow();
  });

  it('handles navigation events with string and boolean fields', () => {
    expect(() =>
      logNavigationEvent('route_change', {
        from: '/old',
        to: '/new',
        hadHistory: true,
      })
    ).not.toThrow();
  });
});
