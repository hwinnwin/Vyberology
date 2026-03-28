import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReading, ReadingError } from '../reading';

// Need to mock supabase with functions.invoke
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('@/lib/sentry', () => ({
  addBreadcrumb: vi.fn(),
  captureError: vi.fn(),
}));

import { supabase } from '@/integrations/supabase/client';

describe('generateReading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase edge function with correct parameters', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { reading: 'Your life path is 7...' },
      error: null,
    });

    const input = {
      fullName: 'John Doe',
      dobISO: '1990-01-15',
      inputs: [{ label: 'Name', value: 'John Doe' }],
      depth: 'lite' as const,
    };

    const result = await generateReading(input);

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'generate-reading',
      { body: input }
    );
    expect(result).toBe('Your life path is 7...');
  });

  it('throws ReadingError when fullName is empty', async () => {
    await expect(
      generateReading({ fullName: '', inputs: [], depth: 'lite' })
    ).rejects.toThrow(ReadingError);

    await expect(
      generateReading({ fullName: '  ', inputs: [], depth: 'lite' })
    ).rejects.toThrow('Full name is required');
  });

  it('throws ReadingError on edge function error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Function error' },
    });

    await expect(
      generateReading({
        fullName: 'John',
        dobISO: '1990-01-01',
        inputs: [{ label: 'Name', value: 'John' }],
        depth: 'lite',
      })
    ).rejects.toBeInstanceOf(ReadingError);
  });

  it('throws ReadingError when data is null', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      generateReading({
        fullName: 'John',
        inputs: [{ label: 'Name', value: 'John' }],
      })
    ).rejects.toThrow('No response from server');
  });

  it('throws ReadingError when data.reading is missing', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { something: 'else' },
      error: null,
    });

    await expect(
      generateReading({
        fullName: 'John',
        inputs: [{ label: 'Name', value: 'John' }],
      })
    ).rejects.toThrow('Invalid response from server');
  });

  it('throws SERVICE_UNAVAILABLE for "not found" errors', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Edge function not found' },
    });

    try {
      await generateReading({
        fullName: 'John',
        inputs: [{ label: 'Name', value: 'John' }],
      });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ReadingError);
      expect((error as ReadingError).code).toBe('SERVICE_UNAVAILABLE');
      expect((error as ReadingError).statusCode).toBe(503);
    }
  });

  it('throws TIMEOUT for timeout errors', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Request timeout exceeded' },
    });

    try {
      await generateReading({
        fullName: 'John',
        inputs: [{ label: 'Name', value: 'John' }],
      });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ReadingError);
      expect((error as ReadingError).code).toBe('TIMEOUT');
      expect((error as ReadingError).statusCode).toBe(408);
    }
  });

  it('throws RATE_LIMIT for rate limit errors', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'rate limit exceeded' },
    });

    try {
      await generateReading({
        fullName: 'John',
        inputs: [{ label: 'Name', value: 'John' }],
      });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ReadingError);
      expect((error as ReadingError).code).toBe('RATE_LIMIT');
      expect((error as ReadingError).statusCode).toBe(429);
    }
  });

  it('wraps unexpected non-ReadingError exceptions', async () => {
    vi.mocked(supabase.functions.invoke).mockRejectedValue(
      new TypeError('Unexpected type error')
    );

    try {
      await generateReading({
        fullName: 'John',
        inputs: [{ label: 'Name', value: 'John' }],
      });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ReadingError);
      expect((error as ReadingError).code).toBe('UNKNOWN_ERROR');
      expect((error as ReadingError).statusCode).toBe(500);
    }
  });
});
