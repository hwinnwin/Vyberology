import type { AnalyticsAdapter, AnalyticsEventProps } from "../index";

export interface PosthogAdapterOptions {
  token?: string;
  host?: string;
  fetchImpl?: typeof fetch;
  distinctId?: string;
}

const DEFAULT_ENDPOINT = "/capture/";

export const createPosthogAdapter = (options: PosthogAdapterOptions = {}): AnalyticsAdapter | null => {
  const token = options.token ?? process.env.POSTHOG_TOKEN;
  const host = options.host ?? process.env.POSTHOG_HOST;

  if (!token || !host) {
    return null;
  }

  const fetchImpl = options.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : undefined);

  if (!fetchImpl) {
    return null;
  }

  const endpoint = host.endsWith("/") ? `${host}${DEFAULT_ENDPOINT.substring(1)}` : `${host}${DEFAULT_ENDPOINT}`;

  const adapter: AnalyticsAdapter = {
    name: "posthog",
    track: async (event: string, props?: AnalyticsEventProps) => {
      try {
        const body = {
          api_key: token,
          event,
          properties: {
            ...(props ?? {}),
            $lib: "@vybe/analytics-adapter",
            $lib_version: "0.1.0",
          },
          distinct_id: options.distinctId ?? props?.user_id ?? "anonymous",
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
          console.debug("[analytics:posthog] capture skipped", error);
        }
      }
    },
  };

  return adapter;
};
