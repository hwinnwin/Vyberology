import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechInput } from '../useSpeechInput';

describe('useSpeechInput', () => {
  let mockRecognition: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: '',
      onstart: null as any,
      onresult: null as any,
      onerror: null as any,
      onend: null as any,
      start: vi.fn(function(this: any) {
        if (this.onstart) this.onstart();
      }),
      stop: vi.fn(),
      abort: vi.fn(),
    };

    // The setup.ts already defines SpeechRecognition — just update the mock value
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);
    (window as any).webkitSpeechRecognition = vi.fn(() => mockRecognition);

    // Set desktop user agent so isMobile() returns false
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      configurable: true,
    });
  });

  it('returns idle state when speech API is available', () => {
    const { result } = renderHook(() => useSpeechInput(vi.fn()));
    expect(result.current.state).toBe('idle');
  });

  it('returns unsupported when no speech API', () => {
    (window as any).SpeechRecognition = undefined;
    (window as any).webkitSpeechRecognition = undefined;

    const { result } = renderHook(() => useSpeechInput(vi.fn()));
    expect(result.current.state).toBe('unsupported');
  });

  it('start begins listening', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechInput(onTranscript));

    act(() => {
      result.current.start('');
    });

    expect(result.current.state).toBe('listening');
  });

  it('start toggles off if already listening', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechInput(onTranscript));

    act(() => {
      result.current.start('');
    });
    expect(result.current.state).toBe('listening');

    act(() => {
      result.current.start('');
    });
    expect(result.current.state).toBe('idle');
    expect(mockRecognition.abort).toHaveBeenCalled();
  });

  it('passes transcript through onTranscript callback', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechInput(onTranscript));

    act(() => {
      result.current.start('');
    });

    act(() => {
      mockRecognition.onresult({
        resultIndex: 0,
        results: {
          length: 1,
          0: {
            isFinal: true,
            length: 1,
            0: { transcript: 'hello world', confidence: 0.95 },
          },
        },
      });
    });

    expect(onTranscript).toHaveBeenCalledWith('hello world');
  });

  it('prepends base text to transcript', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechInput(onTranscript));

    act(() => {
      result.current.start('existing text');
    });

    act(() => {
      mockRecognition.onresult({
        resultIndex: 0,
        results: {
          length: 1,
          0: {
            isFinal: true,
            length: 1,
            0: { transcript: 'more text', confidence: 0.9 },
          },
        },
      });
    });

    expect(onTranscript).toHaveBeenCalledWith('existing text more text');
  });

  it('stop sets state to idle', () => {
    const { result } = renderHook(() => useSpeechInput(vi.fn()));

    act(() => {
      result.current.start('');
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.state).toBe('idle');
  });

  it('handles speech errors gracefully', () => {
    const { result } = renderHook(() => useSpeechInput(vi.fn()));

    act(() => {
      result.current.start('');
    });

    act(() => {
      mockRecognition.onerror({ error: 'network' });
    });

    expect(result.current.state).toBe('idle');
  });

  it('ignores no-speech and aborted errors', () => {
    const { result } = renderHook(() => useSpeechInput(vi.fn()));

    act(() => {
      result.current.start('');
    });

    act(() => {
      mockRecognition.onerror({ error: 'no-speech' });
    });
    expect(result.current.state).toBe('listening');

    act(() => {
      mockRecognition.onerror({ error: 'aborted' });
    });
    expect(result.current.state).toBe('listening');
  });

  it('handles interim results', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechInput(onTranscript));

    act(() => {
      result.current.start('');
    });

    act(() => {
      mockRecognition.onresult({
        resultIndex: 0,
        results: {
          length: 1,
          0: {
            isFinal: false,
            length: 1,
            0: { transcript: 'partial', confidence: 0.5 },
          },
        },
      });
    });

    expect(onTranscript).toHaveBeenCalledWith('partial');
  });

  it('cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useSpeechInput(vi.fn()));

    act(() => {
      result.current.start('');
    });

    unmount();
    expect(mockRecognition.abort).toHaveBeenCalled();
  });
});
