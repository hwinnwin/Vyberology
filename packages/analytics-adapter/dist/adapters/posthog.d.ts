import type { AnalyticsAdapter } from "../index";
export interface PosthogAdapterOptions {
    token?: string;
    host?: string;
    fetchImpl?: typeof fetch;
    distinctId?: string;
}
export declare const createPosthogAdapter: (options?: PosthogAdapterOptions) => AnalyticsAdapter | null;
