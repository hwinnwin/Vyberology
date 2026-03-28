import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import { speakLumynMessage } from '../lumynTts';
import { supabase } from '@/integrations/supabase/client';

describe('speakLumynMessage', () => {
  const mockOnStateChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('sets state to idle when not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    await speakLumynMessage('Hello', mockOnStateChange);

    expect(mockOnStateChange).toHaveBeenCalledWith('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sets state to loading then idle on HTTP error', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server error'),
    } as Response);

    await speakLumynMessage('Hello', mockOnStateChange);

    expect(mockOnStateChange).toHaveBeenCalledWith('loading');
    // Final state should be idle (from finally block)
    const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1];
    expect(lastCall[0]).toBe('idle');
  });

  it('fetches TTS endpoint with correct headers', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'my-token' } },
      error: null,
    } as any);

    const blob = new Blob(['audio data'], { type: 'audio/mpeg' });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    } as Response);

    // Mock Audio
    const mockAudio = {
      onended: null as any,
      onerror: null as any,
      play: vi.fn(() => {
        // Simulate immediate end
        setTimeout(() => mockAudio.onended?.(), 0);
        return Promise.resolve();
      }),
      pause: vi.fn(),
    };
    vi.stubGlobal('Audio', vi.fn(() => mockAudio));
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() });

    await speakLumynMessage('Hello world', mockOnStateChange);

    expect(fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/lumyn-tts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer my-token',
        }),
        body: JSON.stringify({ text: 'Hello world' }),
      })
    );
  });

  it('transitions through loading -> playing -> idle', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    const blob = new Blob(['audio'], { type: 'audio/mpeg' });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    } as Response);

    const mockAudio = {
      onended: null as any,
      onerror: null as any,
      play: vi.fn(() => {
        setTimeout(() => mockAudio.onended?.(), 0);
        return Promise.resolve();
      }),
      pause: vi.fn(),
    };
    vi.stubGlobal('Audio', vi.fn(() => mockAudio));
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() });

    await speakLumynMessage('Test', mockOnStateChange);

    const states = mockOnStateChange.mock.calls.map(c => c[0]);
    expect(states).toContain('loading');
    expect(states).toContain('playing');
    // Last state should be idle
    expect(states[states.length - 1]).toBe('idle');
  });

  it('handles fetch errors gracefully', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    vi.mocked(fetch).mockRejectedValue(new Error('Network failed'));

    await speakLumynMessage('Hello', mockOnStateChange);

    // Should end in idle state without throwing
    const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1];
    expect(lastCall[0]).toBe('idle');
  });
});
