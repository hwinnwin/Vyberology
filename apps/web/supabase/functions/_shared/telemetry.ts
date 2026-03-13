export const withTiming =
  (handler: (req: Request) => Promise<Response> | Response) =>
  async (req: Request): Promise<Response> => {
    const start = performance.now();
    const response = await handler(req);
    const duration = Math.round(performance.now() - start);

    const headers = new Headers(response.headers);
    const existingTiming = headers.get('Server-Timing');
    const timingEntry = `total;dur=${duration}`;
    headers.set(
      'Server-Timing',
      existingTiming ? `${existingTiming}, ${timingEntry}` : timingEntry
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
