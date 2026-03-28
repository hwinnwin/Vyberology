import { describe, it, expect } from 'vitest';
import { ServerTimer, withTiming } from './telemetry';

describe('telemetry', () => {
  describe('ServerTimer', () => {
    it('creates and tracks timing spans', () => {
      const timer = new ServerTimer();
      const id = timer.start('parse');
      expect(id).toContain('parse');
      timer.end(id);

      const headers = new Headers();
      timer.apply(headers);

      const timing = headers.get('Server-Timing');
      expect(timing).toContain('parse;dur=');
      expect(timing).toContain('total;dur=');
    });

    it('tracks multiple spans', () => {
      const timer = new ServerTimer();
      const id1 = timer.start('parse');
      timer.end(id1);
      const id2 = timer.start('render');
      timer.end(id2);

      const headers = new Headers();
      timer.apply(headers);

      const timing = headers.get('Server-Timing')!;
      expect(timing).toContain('parse;dur=');
      expect(timing).toContain('render;dur=');
      expect(timing).toContain('total;dur=');
    });

    it('handles span that is not ended (measures until apply)', () => {
      const timer = new ServerTimer();
      timer.start('ongoing');

      const headers = new Headers();
      timer.apply(headers);

      const timing = headers.get('Server-Timing')!;
      expect(timing).toContain('ongoing;dur=');
    });

    it('end is a no-op for unknown span ID', () => {
      const timer = new ServerTimer();
      // Should not throw
      timer.end('nonexistent-123');

      const headers = new Headers();
      timer.apply(headers);
      expect(headers.get('Server-Timing')).toContain('total;dur=');
    });
  });

  describe('withTiming', () => {
    it('adds Server-Timing header to response', async () => {
      const handler = withTiming(async () =>
        new Response('ok', { status: 200 })
      );

      const req = new Request('http://localhost/test');
      const res = await handler(req);

      expect(res.status).toBe(200);
      const timing = res.headers.get('Server-Timing');
      expect(timing).toBeTruthy();
      expect(timing).toContain('handler;dur=');
      expect(timing).toContain('total;dur=');
    });

    it('preserves original response body and status', async () => {
      const handler = withTiming(async () =>
        new Response(JSON.stringify({ data: 'test' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('http://localhost/test');
      const res = await handler(req);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data).toBe('test');
    });

    it('still adds timing even if handler throws', async () => {
      const handler = withTiming(async () => {
        throw new Error('handler failed');
      });

      const req = new Request('http://localhost/test');
      await expect(handler(req)).rejects.toThrow('handler failed');
    });
  });
});
