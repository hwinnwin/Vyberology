class AnalyticsClient {
    enabled;
    adapters;
    onError;
    baseContext;
    constructor(config = {}) {
        this.enabled = Boolean(config.enabled);
        this.adapters = (config.adapters ?? []).filter(Boolean);
        this.onError = config.onError;
        this.baseContext = config.context ?? {};
    }
    track = async (event, props) => {
        if (!this.enabled || this.adapters.length === 0) {
            return;
        }
        const payload = {
            ...this.baseContext,
            ...props,
        };
        for (const adapter of this.adapters) {
            try {
                await adapter.track(event, payload);
            }
            catch (error) {
                if (this.onError) {
                    this.onError(error);
                }
                else if (process.env.NODE_ENV !== "production") {
                    console.warn(`[analytics:${adapter.name}] failed`, error);
                }
            }
        }
    };
    snapshot() {
        return {
            enabled: this.enabled && this.adapters.length > 0,
            adapterNames: this.adapters.map((adapter) => adapter.name),
        };
    }
}
let defaultClient = new AnalyticsClient({ enabled: false });
export const createAnalytics = (config) => new AnalyticsClient(config);
export const configureAnalytics = (config) => {
    defaultClient = new AnalyticsClient(config);
    return defaultClient;
};
export const track = (event, props) => defaultClient.track(event, props);
export const getAnalyticsSnapshot = () => defaultClient.snapshot();
export { createPosthogAdapter } from "./adapters/posthog";
export { createGA4Adapter } from "./adapters/ga4";
