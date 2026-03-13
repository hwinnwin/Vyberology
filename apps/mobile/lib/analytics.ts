import {
  configureAnalytics,
  track as trackInternal,
  createPosthogAdapter,
  createGA4Adapter,
} from "@vybe/analytics-adapter";
import type { AnalyticsEventProps } from "@vybe/analytics-adapter";

const analyticsFlag = (process.env.EXPO_PUBLIC_FEATURE_ANALYTICS ?? "").toLowerCase() === "on";

const posthogAdapter = createPosthogAdapter({
  token: process.env.EXPO_PUBLIC_POSTHOG_TOKEN,
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
});

const gaAdapter = createGA4Adapter({
  measurementId: process.env.EXPO_PUBLIC_GA4_MEASUREMENT_ID,
  apiSecret: process.env.EXPO_PUBLIC_GA4_API_SECRET,
});

configureAnalytics({
  enabled: analyticsFlag,
  adapters: [posthogAdapter, gaAdapter],
  context: {
    platform: "mobile",
    environment: process.env.NODE_ENV,
  },
});

export const trackAnalyticsEvent = (event: string, props?: AnalyticsEventProps) =>
  trackInternal(event, props).catch(() => undefined);

export const isAnalyticsEnabled = (): boolean => analyticsFlag;
