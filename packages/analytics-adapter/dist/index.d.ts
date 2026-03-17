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
declare class AnalyticsClient {
    private enabled;
    private adapters;
    private onError;
    private baseContext;
    constructor(config?: AnalyticsConfig);
    track: (event: string, props?: AnalyticsEventProps) => Promise<void>;
    snapshot(): Snapshot;
}
export declare const createAnalytics: (config: AnalyticsConfig) => AnalyticsClient;
export declare const configureAnalytics: (config: AnalyticsConfig) => AnalyticsClient;
export declare const track: (event: string, props?: AnalyticsEventProps) => Promise<void>;
export declare const getAnalyticsSnapshot: () => Snapshot;
export { createPosthogAdapter } from "./adapters/posthog";
export { createGA4Adapter } from "./adapters/ga4";
