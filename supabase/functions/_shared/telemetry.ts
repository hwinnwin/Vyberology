// Server timing utilities for performance monitoring
export class ServerTimer {
  private timings: Map<string, { start: number; end?: number }> = new Map();
  private startTime: number = performance.now();

  start(name: string): string {
    const id = `${name}-${Date.now()}`;
    this.timings.set(id, { start: performance.now() });
    return id;
  }

  end(id: string): void {
    const timing = this.timings.get(id);
    if (timing) {
      timing.end = performance.now();
    }
  }

  apply(headers: Headers): void {
    const timingEntries: string[] = [];
    
    this.timings.forEach((timing, id) => {
      const duration = timing.end ? timing.end - timing.start : performance.now() - timing.start;
      const name = id.split('-')[0];
      timingEntries.push(`${name};dur=${duration.toFixed(2)}`);
    });

    const totalDuration = performance.now() - this.startTime;
    timingEntries.push(`total;dur=${totalDuration.toFixed(2)}`);

    if (timingEntries.length > 0) {
      headers.set('Server-Timing', timingEntries.join(', '));
    }
  }
}

type Handler = (req: Request) => Promise<Response> | Response;

// Middleware to add timing information to responses
export function withTiming(handler: Handler): Handler {
  return async (req: Request) => {
    const timer = new ServerTimer();
    const span = timer.start('handler');
    
    try {
      const response = await handler(req);
      timer.end(span);
      
      const headers = new Headers(response.headers);
      timer.apply(headers);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      timer.end(span);
      throw error;
    }
  };
}
