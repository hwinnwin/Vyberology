import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveReadingToDb, getReadingBySlug, getUserReadings } from '../readings';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('readings service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveReadingToDb', () => {
    it('calls save_reading RPC with correct params', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } as any },
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { id: 'reading-1', share_slug: 'abc123' },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      } as any);

      const result = await saveReadingToDb({
        tier: 'lyf-path',
        fullName: 'John Doe',
        dob: '1990-01-15',
        numerologyNumbers: { lifePath: 7 },
      });

      expect(supabase.rpc).toHaveBeenCalledWith(
        'save_reading',
        expect.objectContaining({ p_tier: 'lyf-path', p_full_name: 'John Doe' })
      );
    });

    it('throws when user is not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        saveReadingToDb({
          tier: 'lyf-path',
          fullName: 'John',
          dob: '1990-01-01',
          numerologyNumbers: {},
        })
      ).rejects.toThrow('must be logged in');
    });
  });

  describe('getReadingBySlug', () => {
    it('fetches reading by share slug using RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [{ id: 'r1', share_slug: 'abc', reading_text: 'Your reading...' }],
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      } as any);

      const result = await getReadingBySlug('abc');
      expect(supabase.rpc).toHaveBeenCalledWith('get_reading_by_slug', { p_slug: 'abc' });
      expect(result?.id).toBe('r1');
    });

    it('returns null on error', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
        count: null,
        status: 404,
        statusText: 'Not Found',
      } as any);

      const result = await getReadingBySlug('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getUserReadings', () => {
    it('returns empty array when not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await getUserReadings();
      expect(result).toEqual([]);
    });
  });
});
