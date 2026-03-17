export type { ReadingInput, ReadingText, ReadingBlock, CoreNumbers, Result, NumerologyValue, MasterNumber, Digit, } from "./types";
export type NumberUnit = "time" | "percent" | "temperature" | "count" | "plain";
export type NumberToken = {
    raw: string;
    values: number[];
    unit: NumberUnit;
    confidence: number;
};
export type Signals = {
    coreNumber: number;
    tokens: NumberToken[];
    volume?: "IV";
    toneHint?: string | null;
    settings?: {
        preserveMaster11?: boolean;
    };
};
type ToneKey = "calm" | "direct" | "encouraging";
export declare function sumToCoreNumber(input: string, options?: {
    preserveMasters?: number[];
    fallback?: number;
}): number;
export type ReadingBlocks = {
    header: string;
    elemental: string;
    chakra: string;
    resonance: string;
    essence: string;
    intention: string;
    reflection: string;
};
export type DeliveredReading = {
    text: string;
    blocks: ReadingBlocks;
    rationale?: {
        inputs: Record<string, unknown>;
        derivations: Record<string, unknown>;
        render_decisions: Array<Record<string, unknown>>;
    };
};
export type RenderResult = DeliveredReading;
export declare function renderVolumeIV(signals: Signals, opts?: {
    explain?: boolean;
    format?: "text" | "blocks";
    tone?: ToneKey;
}): DeliveredReading;
export { assembleReading as assembleReadingV4, generateReadingV4, isFeatureEnabled as isV4ReadingEnabled, } from "@vybe/reading-core-private";
