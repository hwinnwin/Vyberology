/**
 * Vybe Capture Schema — versioned types for deterministic numerology pipeline.
 * All capture-mode readings must produce a CaptureDeterministicPayload before
 * the AI receives any data. The AI becomes a renderer, not an engine.
 */

export const VYBE_SCHEMA_VERSION = "capture-v1" as const;

export type SourceType = "observed" | "computed";

export type ObservedField =
  | "time"
  | "input"
  | "battery"
  | "notifications"
  | "likes"
  | "comments"
  | "steps"
  | "temperature"
  | "date"
  | "unknown";

export type AtomKind =
  | "number"
  | "time_token"
  | "date_token"
  | "percent_token"
  | "text_number";

export interface Atom {
  id: string;
  kind: AtomKind;
  raw: string;
  value?: number;
  field: ObservedField;
  label?: string;
}

export interface ComputedNumber {
  id: string;
  source: SourceType;
  kind:
    | "reduce"
    | "digit_sum"
    | "time_hour_reduce"
    | "time_minute_reduce"
    | "time_total_digit_sum"
    | "mirror_candidate";
  value: number | string;
  trace: string;
  inputs: string[];
  confidence: "high" | "medium" | "low";
  deterministic: true;
}

export interface CaptureDeterministicPayload {
  schemaVersion: typeof VYBE_SCHEMA_VERSION;
  atoms: Atom[];
  computed: ComputedNumber[];
  policy: {
    preserveMastersForCompositeSums: boolean;
    preserveMastersForSubcomponents: boolean;
    allowMirrorPatterns: boolean;
    mirrorRequiresIndependentOccurrences: boolean;
    masterNumbers: number[];
  };
}
