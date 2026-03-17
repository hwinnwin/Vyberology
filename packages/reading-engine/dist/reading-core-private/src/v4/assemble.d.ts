import type { CaptureInput, GeneratedReading, ReadingConfig } from "./types";
export interface AssembleOptions {
    config?: Partial<ReadingConfig>;
    explain?: boolean;
}
export declare function assembleReading(input: CaptureInput, options?: AssembleOptions): GeneratedReading;
