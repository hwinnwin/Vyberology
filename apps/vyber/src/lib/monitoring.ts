let sentryModule: typeof import("@sentry/react") | null = null;
let monitoringEnabled = false;

export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || typeof window === "undefined") return;

  const Sentry = await import("@sentry/react");
  sentryModule = Sentry;
  monitoringEnabled = true;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (monitoringEnabled && sentryModule) {
    sentryModule.captureException(error, { extra: context });
  } else {
    console.error("Captured error:", error, context);
  }
}

export function isMonitoringEnabled() {
  return monitoringEnabled;
}
