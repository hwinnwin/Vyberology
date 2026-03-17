import { type AssembleOptions } from "./assemble";
import type { CaptureInput, GeneratedReading, ReadingConfig } from "./types";
export { assembleReading } from "./assemble";
export * from "./types";
export interface GenerateReadingOptions extends AssembleOptions {
    featureFlagOverride?: boolean;
}
export declare function generateReadingV4(input: CaptureInput, options?: GenerateReadingOptions): GeneratedReading;
export declare function isFeatureEnabled(override?: boolean): boolean;
export declare function withConfig(base: ReadingConfig, overrides?: Partial<ReadingConfig>): ReadingConfig;
