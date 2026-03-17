import type { CaptureInput, TokenInfo } from "./types";
export interface ParseOptions {
    percentThresholds?: {
        nearFull: number;
        seventies: [number, number];
    };
}
export declare const FEATURE_FLAG = "FEATURE_VYBE_V4_READINGS";
export declare function extractTokens(raw: string, options?: ParseOptions): TokenInfo[];
export declare function ensureTokens(input: CaptureInput, options?: ParseOptions): TokenInfo[];
