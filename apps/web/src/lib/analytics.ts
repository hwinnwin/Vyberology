import {
  configureAnalytics,
  track as trackInternal,
  createPosthogAdapter,
  createGA4Adapter,
} from "@vybe/analytics-adapter";
import type { AnalyticsEventProps } from "@vybe/analytics-adapter";

const analyticsFlag = (import.meta.env.VITE_FEATURE_ANALYTICS ?? "").toLowerCase() === "on";

const posthogAdapter = createPosthogAdapter({
  token: import.meta.env.VITE_POSTHOG_TOKEN,
  host: import.meta.env.VITE_POSTHOG_HOST,
});

const gaAdapter = createGA4Adapter({
  measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID,
  apiSecret: import.meta.env.VITE_GA4_API_SECRET,
});

configureAnalytics({
  enabled: analyticsFlag,
  adapters: [posthogAdapter, gaAdapter],
  context: {
    platform: "web",
    environment: import.meta.env.MODE,
  },
});

export const trackAnalyticsEvent = (event: string, props?: AnalyticsEventProps) =>
  trackInternal(event, props).catch(() => undefined);

export const isAnalyticsEnabled = (): boolean => analyticsFlag;
