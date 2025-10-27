import type { AnalyticsAdapter, AnalyticsEventProps } from "../index";

export interface PosthogAdapterOptions {
  token?: string;
  host?: string;
  fetchImpl?: typeof fetch;
  distinctId?: string;
}

const DEFAULT_ENDPOINT = "/capture/";

const getEnv = (key: string): string | undefined => {
  if (typeof process !== "undefined" && typeof process.env !== "undefined") {
    return process.env[key];
  }
  if (typeof globalThis !== "undefined") {
    const value = (globalThis as Record<string, unknown>)[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return undefined;
};

const isProductionEnv = (): boolean => {
  if (typeof process !== "undefined" && typeof process.env !== "undefined") {
    return process.env.NODE_ENV === "production";
  }
  const env =
    typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined"
      ? (import.meta.env as Record<string, unknown>)
      : undefined;
  return env?.MODE === "production";
};

export const createPosthogAdapter = (options: PosthogAdapterOptions = {}): AnalyticsAdapter | null => {
  const token = options.token ?? getEnv("POSTHOG_TOKEN");
  const host = options.host ?? getEnv("POSTHOG_HOST");

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
        if (!isProductionEnv()) {
          // eslint-disable-next-line no-console
          console.debug("[analytics:posthog] capture skipped", error);
        }
      }
    },
  };

  return adapter;
};
