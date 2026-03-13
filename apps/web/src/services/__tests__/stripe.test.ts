import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserCredits, useReadingCredit, createCheckoutSession } from '../stripe';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('stripe service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserCredits', () => {
    it('returns credit count (gets user internally)', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 5,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      } as any);

      const credits = await getUserCredits();
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_credits', { p_user_id: 'user-123' });
      expect(credits).toBe(5);
    });

    it('returns 0 when user is not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const credits = await getUserCredits();
      expect(credits).toBe(0);
    });
  });

  describe('useReadingCredit', () => {
    it('calls use_reading_credit RPC', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: true,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      } as any);

      const result = await useReadingCredit();
      expect(supabase.rpc).toHaveBeenCalledWith('use_reading_credit', { p_user_id: 'user-123' });
      expect(result).toBe(true);
    });

    it('throws when user is not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(useReadingCredit()).rejects.toThrow('You must be logged in');
    });
  });

  describe('createCheckoutSession', () => {
    it('invokes create-checkout-session edge function', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'u1' } } as any },
        error: null,
      });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { sessionId: 'cs_123', url: 'https://checkout.stripe.com/cs_123' },
        error: null,
      });

      const result = await createCheckoutSession({ priceId: 'price_123', tier: 'lyf-path' });
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'create-checkout-session',
        expect.objectContaining({
          body: expect.objectContaining({ priceId: 'price_123' }),
        })
      );
      expect(result.url).toBe('https://checkout.stripe.com/cs_123');
    });

    it('throws when not logged in', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(createCheckoutSession({ priceId: 'price_123' })).rejects.toThrow('must be logged in');
    });
  });
});
