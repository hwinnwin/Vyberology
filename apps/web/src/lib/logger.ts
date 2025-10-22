const endpoint = '/api/log-error';
let lastFingerprint = '';
let lastTs = 0;

function fp(msg: string, stack?: string, route?: string) {
  const line = (stack ?? '').split('\n')[1]?.trim() ?? '';
  return `${route}|${msg}|${line}`.slice(0, 512);
}

export async function logError(error: unknown, context = 'client', meta: Record<string, unknown> = {}) {
  try {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const route = typeof window !== 'undefined' ? window.location.pathname : '';
    const f = fp(msg, stack, route);
    const now = Date.now();
    if (f === lastFingerprint && now - lastTs < 2000) return;
    lastFingerprint = f;
    lastTs = now;
    const body = {
      environment: import.meta.env.VITE_APP_ENV ?? 'beta',
      release: import.meta.env.VITE_GIT_SHA ?? 'dev',
      context,
      route,
      severity: 'error',
      message: msg,
      stack,
      meta,
    };
    const sample = context === 'network' ? Math.random() < 0.5 : true;
    if (!sample) return;
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Swallow errors in logger to avoid recursive failure loops
  }
}

export function attachGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => logError((e as ErrorEvent).error ?? e.message, 'client'));
  window.addEventListener('unhandledrejection', (e) => logError((e as PromiseRejectionEvent).reason ?? 'unhandledrejection', 'client'));
}
