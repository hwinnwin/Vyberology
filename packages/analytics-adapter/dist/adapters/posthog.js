const DEFAULT_ENDPOINT = "/capture/";
const getEnv = (key) => {
    if (typeof process !== "undefined" && typeof process.env !== "undefined") {
        return process.env[key];
    }
    if (typeof globalThis !== "undefined") {
        const value = globalThis[key];
        if (typeof value === "string") {
            return value;
        }
    }
    return undefined;
};
const isProductionEnv = () => {
    if (typeof process !== "undefined" && typeof process.env !== "undefined") {
        return process.env.NODE_ENV === "production";
    }
    const env = typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined"
        ? import.meta.env
        : undefined;
    return env?.MODE === "production";
};
export const createPosthogAdapter = (options = {}) => {
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
    const adapter = {
        name: "posthog",
        track: async (event, props) => {
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
            }
            catch (error) {
                if (!isProductionEnv()) {
                    // eslint-disable-next-line no-console
                    console.debug("[analytics:posthog] capture skipped", error);
                }
            }
        },
    };
    return adapter;
};
