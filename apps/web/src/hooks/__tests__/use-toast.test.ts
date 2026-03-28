import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { reducer, useToast, toast } from '../use-toast';

// Minimal toast object matching ToasterToast shape
const makeToast = (id: string, overrides = {}) => ({
  id,
  title: 'Test Toast',
  open: true,
  ...overrides,
});

describe('toast reducer', () => {
  const emptyState = { toasts: [] };

  describe('ADD_TOAST', () => {
    it('adds a toast to empty state', () => {
      const toast = makeToast('1');
      const next = reducer(emptyState, { type: 'ADD_TOAST', toast });
      expect(next.toasts).toHaveLength(1);
      expect(next.toasts[0].id).toBe('1');
    });

    it('respects TOAST_LIMIT of 1 (oldest dropped)', () => {
      const toast1 = makeToast('1');
      const toast2 = makeToast('2');
      const state1 = reducer(emptyState, { type: 'ADD_TOAST', toast: toast1 });
      const state2 = reducer(state1, { type: 'ADD_TOAST', toast: toast2 });
      expect(state2.toasts).toHaveLength(1);
      expect(state2.toasts[0].id).toBe('2');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('updates a toast by id', () => {
      const toast = makeToast('1', { title: 'Old Title' });
      const state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      const next = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'New Title' },
      });
      expect(next.toasts[0].title).toBe('New Title');
    });

    it('does not update toasts with different ids', () => {
      const toast = makeToast('1', { title: 'Original' });
      const state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      const next = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: 'other', title: 'Changed' },
      });
      expect(next.toasts[0].title).toBe('Original');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('sets open to false for specific toast id', () => {
      const toast = makeToast('1', { open: true });
      const state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      const next = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
      expect(next.toasts[0].open).toBe(false);
    });

    it('sets open to false for all toasts when no id provided', () => {
      // With TOAST_LIMIT=1 only one toast fits, but test the undefined path
      const toast = makeToast('1', { open: true });
      const state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      const next = reducer(state, { type: 'DISMISS_TOAST', toastId: undefined });
      expect(next.toasts.every(t => t.open === false)).toBe(true);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('removes a specific toast by id', () => {
      const toast = makeToast('1');
      const state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      const next = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
      expect(next.toasts).toHaveLength(0);
    });

    it('removes all toasts when no id provided', () => {
      const toast = makeToast('1');
      const state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      const next = reducer(state, { type: 'REMOVE_TOAST', toastId: undefined });
      expect(next.toasts).toHaveLength(0);
    });

    it('returns unchanged state when removing non-existent id', () => {
      const toast = makeToast('1');
      const state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      const next = reducer(state, { type: 'REMOVE_TOAST', toastId: 'nonexistent' });
      expect(next.toasts).toHaveLength(1);
    });
  });
});

describe('toast function', () => {
  it('returns an id, dismiss, and update function', () => {
    const result = toast({ title: 'Hello' });
    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  it('calling dismiss sets toast to closed', () => {
    const { id, dismiss } = toast({ title: 'Hello' });

    const { result } = renderHook(() => useToast());

    // Verify it exists
    const toastItem = result.current.toasts.find(t => t.id === id);
    expect(toastItem?.open).toBe(true);

    act(() => {
      dismiss();
    });

    const dismissed = result.current.toasts.find(t => t.id === id);
    expect(dismissed?.open).toBe(false);
  });
});

describe('useToast hook', () => {
  it('returns toast function and dismiss', () => {
    const { result } = renderHook(() => useToast());

    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('dismiss function dismisses a specific toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const t = result.current.toast({ title: 'Test' });
      toastId = t.id;
    });

    expect(result.current.toasts.find(t => t.id === toastId!)?.open).toBe(true);

    act(() => {
      result.current.dismiss(toastId!);
    });

    expect(result.current.toasts.find(t => t.id === toastId!)?.open).toBe(false);
  });

  it('dismiss without id dismisses all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts.every(t => t.open === false)).toBe(true);
  });
});
