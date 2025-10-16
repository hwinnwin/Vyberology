export async function reportError(err: unknown, ctx: Record<string, unknown> = {}) {
  try {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const payload = {
      message,
      stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      context: ctx
    };
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/error_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('[errorReporter] failed to post', e);
  }
}
