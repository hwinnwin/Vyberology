import type { AnalyticsAdapter } from "../index";
export interface GA4AdapterOptions {
    measurementId?: string;
    apiSecret?: string;
    clientId?: string;
    fetchImpl?: typeof fetch;
}
export declare const createGA4Adapter: (options?: GA4AdapterOptions) => AnalyticsAdapter | null;
