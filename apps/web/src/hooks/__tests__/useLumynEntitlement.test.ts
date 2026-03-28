import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/lib/lumynEntitlement', () => ({
  resolveClientLumynEntitlement: vi.fn(),
}));

import { useLumynEntitlement } from '../useLumynEntitlement';
import { supabase } from '@/integrations/supabase/client';
import { resolveClientLumynEntitlement } from '@/lib/lumynEntitlement';

describe('useLumynEntitlement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not pro when user is not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useLumynEntitlement());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isPro).toBe(false);
    expect(result.current.messagesUsed).toBe(0);
  });

  it('returns pro status from resolveClientLumynEntitlement', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              lumyn_pro: true,
              lumyn_pro_until: null,
              lumyn_messages_used: 42,
            },
            error: null,
          }),
        }),
      }),
    } as any);

    vi.mocked(resolveClientLumynEntitlement).mockReturnValue(true);

    const { result } = renderHook(() => useLumynEntitlement());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isPro).toBe(true);
    expect(result.current.messagesUsed).toBe(42);
    expect(resolveClientLumynEntitlement).toHaveBeenCalledWith({
      lumyn_pro: true,
      lumyn_pro_until: null,
    });
  });

  it('returns not pro on database error', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'DB error' },
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useLumynEntitlement());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isPro).toBe(false);
    expect(result.current.messagesUsed).toBe(0);
  });

  it('defaults messagesUsed to 0 when null', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              lumyn_pro: false,
              lumyn_pro_until: null,
              lumyn_messages_used: null,
            },
            error: null,
          }),
        }),
      }),
    } as any);

    vi.mocked(resolveClientLumynEntitlement).mockReturnValue(false);

    const { result } = renderHook(() => useLumynEntitlement());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.messagesUsed).toBe(0);
  });

  it('starts in loading state', () => {
    vi.mocked(supabase.auth.getUser).mockReturnValue(new Promise(() => {}) as any);

    const { result } = renderHook(() => useLumynEntitlement());

    expect(result.current.isLoading).toBe(true);
  });

  it('exposes a refetch function', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useLumynEntitlement());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');
  });
});
