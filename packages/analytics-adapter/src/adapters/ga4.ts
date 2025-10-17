import type { AnalyticsAdapter, AnalyticsEventProps } from "../index";

export interface GA4AdapterOptions {
  measurementId?: string;
  apiSecret?: string;
  clientId?: string;
  fetchImpl?: typeof fetch;
}

export const createGA4Adapter = (options: GA4AdapterOptions = {}): AnalyticsAdapter | null => {
  const measurementId = options.measurementId ?? process.env.GA4_MEASUREMENT_ID;
  const apiSecret = options.apiSecret ?? process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return null;
  }

  const fetchImpl = options.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : undefined);

  if (!fetchImpl) {
    return null;
  }

  const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    measurementId
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const adapter: AnalyticsAdapter = {
    name: "ga4",
    track: async (event: string, props?: AnalyticsEventProps) => {
      try {
        const body = {
          client_id: options.clientId ?? props?.user_id ?? "anonymous",
          events: [
            {
              name: event.replace(/[^a-zA-Z0-9_]/g, "_"),
              params: props ?? {},
            },
          ],
        };

        await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[analytics:ga4] event skipped", error);
        }
      }
    },
  };

  return adapter;
};
