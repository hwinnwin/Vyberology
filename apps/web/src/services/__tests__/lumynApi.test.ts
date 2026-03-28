import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import { callLumynChat } from '../lumynApi';
import { supabase } from '@/integrations/supabase/client';

// Helper to create a ReadableStream from SSE lines
function createSSEStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = events.map(e => encoder.encode(e));
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
}

describe('callLumynChat', () => {
  const mockOnToken = vi.fn();
  const mockOnDone = vi.fn();
  const mockOnError = vi.fn();

  const defaultParams = {
    message: 'Hello Lumyn',
    vyberologyContext: [{ label: 'Test', value: 'test' }],
    onToken: mockOnToken,
    onDone: mockOnDone,
    onError: mockOnError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('calls onError when not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    await callLumynChat(defaultParams);

    expect(mockOnError).toHaveBeenCalledWith('Not authenticated');
    expect(mockOnToken).not.toHaveBeenCalled();
  });

  it('calls onError on non-ok response', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    } as Response);

    await callLumynChat(defaultParams);

    expect(mockOnError).toHaveBeenCalledWith('HTTP 500');
  });

  it('streams token events to onToken callback', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    const doneEvent = {
      type: 'done',
      conversationId: 'conv-1',
      message: { id: 'm1', role: 'assistant', content: 'Hello!', created_at: '2024-01-01' },
      mode: 'reflect',
      classification: { intent: 'explore', emotion: 'calm', domain: 'general' },
      client_directives: { crisis_banner: false, anchor_active: false },
    };

    const stream = createSSEStream([
      'data: {"type":"token","content":"Hello"}\n\n',
      'data: {"type":"token","content":"!"}\n\n',
      `data: ${JSON.stringify(doneEvent)}\n\n`,
    ]);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: stream,
    } as Response);

    await callLumynChat(defaultParams);

    expect(mockOnToken).toHaveBeenCalledWith('Hello');
    expect(mockOnToken).toHaveBeenCalledWith('!');
    expect(mockOnDone).toHaveBeenCalledWith(expect.objectContaining({ type: 'done' }));
  });

  it('calls onError on stream error event', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    const stream = createSSEStream([
      'data: {"type":"error","error":"Rate limited"}\n\n',
    ]);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: stream,
    } as Response);

    await callLumynChat(defaultParams);

    expect(mockOnError).toHaveBeenCalledWith('Rate limited');
  });

  it('calls onError when stream ends without done event', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    const stream = createSSEStream([
      'data: {"type":"token","content":"Hi"}\n\n',
    ]);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: stream,
    } as Response);

    await callLumynChat(defaultParams);

    expect(mockOnError).toHaveBeenCalledWith('Response stream ended unexpectedly');
  });

  it('flushes buffer after stream closes', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    const doneEvent = {
      type: 'done',
      conversationId: 'conv-1',
      message: { id: 'm1', role: 'assistant', content: 'OK', created_at: '2024-01-01' },
      mode: 'reflect',
      classification: { intent: 'explore', emotion: 'calm', domain: 'general' },
      client_directives: { crisis_banner: false, anchor_active: false },
    };

    // No trailing \n\n so it stays in buffer
    const stream = createSSEStream([
      `data: ${JSON.stringify(doneEvent)}`,
    ]);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: stream,
    } as Response);

    await callLumynChat(defaultParams);

    expect(mockOnDone).toHaveBeenCalled();
  });

  it('skips malformed SSE events gracefully', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);

    const doneEvent = {
      type: 'done',
      conversationId: 'conv-1',
      message: { id: 'm1', role: 'assistant', content: 'OK', created_at: '2024-01-01' },
      mode: 'reflect',
      classification: { intent: 'explore', emotion: 'calm', domain: 'general' },
      client_directives: { crisis_banner: false, anchor_active: false },
    };

    const stream = createSSEStream([
      'data: {invalid json}\n\n',
      `data: ${JSON.stringify(doneEvent)}\n\n`,
    ]);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: stream,
    } as Response);

    await callLumynChat(defaultParams);

    // Should not throw, and done should still fire
    expect(mockOnDone).toHaveBeenCalled();
  });

  it('sends correct headers and body', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'my-token' } },
      error: null,
    } as any);

    const doneEvent = {
      type: 'done',
      conversationId: 'conv-1',
      message: { id: 'm1', role: 'assistant', content: 'Hi', created_at: '2024-01-01' },
      mode: 'reflect',
      classification: { intent: 'explore', emotion: 'calm', domain: 'general' },
      client_directives: { crisis_banner: false, anchor_active: false },
    };

    const stream = createSSEStream([`data: ${JSON.stringify(doneEvent)}\n\n`]);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: stream,
    } as Response);

    await callLumynChat({
      ...defaultParams,
      conversationId: 'conv-123',
      mode: 'illuminate',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/lumyn-chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer my-token',
        }),
        body: expect.stringContaining('"conversationId":"conv-123"'),
      })
    );
  });
});
