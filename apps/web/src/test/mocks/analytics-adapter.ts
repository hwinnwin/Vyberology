export type AnalyticsEventProps = Record<string, unknown>;

export const configureAnalytics = (_config: unknown) => undefined;

export const track = async (_event: string, _props?: AnalyticsEventProps) => undefined;

export const createPosthogAdapter = (_options: unknown) => ({
  track: async (_event: string, _props?: AnalyticsEventProps) => undefined,
});

export const createGA4Adapter = (_options: unknown) => ({
  track: async (_event: string, _props?: AnalyticsEventProps) => undefined,
});
