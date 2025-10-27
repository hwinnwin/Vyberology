type Primitive = string | number | boolean | null;

export type AnalyticsEventProps = Record<string, Primitive | Primitive[] | undefined>;

export interface AnalyticsAdapter {
  name: string;
  track(event: string, props?: AnalyticsEventProps): void | Promise<void>;
}

export interface AnalyticsConfig {
  enabled?: boolean;
  adapters?: Array<AnalyticsAdapter | null | undefined>;
  context?: AnalyticsEventProps;
  onError?: (error: unknown) => void;
}

interface Snapshot {
  enabled: boolean;
  adapterNames: string[];
}

class AnalyticsClient {
  private enabled: boolean;
  private adapters: AnalyticsAdapter[];
  private onError: ((error: unknown) => void) | undefined;
  private baseContext: AnalyticsEventProps;

  constructor(config: AnalyticsConfig = {}) {
    this.enabled = Boolean(config.enabled);
    this.adapters = (config.adapters ?? []).filter(Boolean) as AnalyticsAdapter[];
    this.onError = config.onError;
    this.baseContext = config.context ?? {};
  }

  public track = async (event: string, props?: AnalyticsEventProps): Promise<void> => {
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
      } catch (error) {
        if (this.onError) {
          this.onError(error);
        } else if (process.env.NODE_ENV !== "production") {
          console.warn(`[analytics:${adapter.name}] failed`, error);
        }
      }
    }
  };

  public snapshot(): Snapshot {
    return {
      enabled: this.enabled && this.adapters.length > 0,
      adapterNames: this.adapters.map((adapter) => adapter.name),
    };
  }
}

let defaultClient = new AnalyticsClient({ enabled: false });

export const createAnalytics = (config: AnalyticsConfig): AnalyticsClient => new AnalyticsClient(config);

export const configureAnalytics = (config: AnalyticsConfig): AnalyticsClient => {
  defaultClient = new AnalyticsClient(config);
  return defaultClient;
};

export const track = (event: string, props?: AnalyticsEventProps): Promise<void> => defaultClient.track(event, props);

export const getAnalyticsSnapshot = (): Snapshot => defaultClient.snapshot();

export { createPosthogAdapter } from "./adapters/posthog";
export { createGA4Adapter } from "./adapters/ga4";
