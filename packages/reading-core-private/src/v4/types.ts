export type TokenType =
  | "time"
  | "percent"
  | "temp"
  | "distance"
  | "consumption"
  | "fuel"
  | "count"
  | "code"
  | "tagged-code";

export type Motif =
  | "mirror_time"
  | "progression"
  | "triple"
  | "gateway_11"
  | "arrival"
  | "percent_near_full"
  | "abundance_signature"
  | "builder_44_1144"
  | "heart_6_stack"
  | "shift_555";

export interface TimeTokenValue {
  hours: number;
  minutes: number;
  iso: string;
  totalMinutes: number;
}

export interface PercentTokenValue {
  value: number;
}

export interface TemperatureTokenValue {
  value: number;
  unit: "C" | "F";
}

export interface DistanceTokenValue {
  value: number;
  unit: "km" | "mi";
}

export interface ConsumptionTokenValue {
  value: number;
}

export interface FuelTokenValue {
  value: number;
}

export interface CountTokenValue {
  value: number;
}

export interface CodeTokenValue {
  value: string;
  numeric: number;
}

export interface TaggedCodeTokenValue {
  prefix: string;
  digits: string;
  numeric: number;
}

export type TokenValue =
  | TimeTokenValue
  | PercentTokenValue
  | TemperatureTokenValue
  | DistanceTokenValue
  | ConsumptionTokenValue
  | FuelTokenValue
  | CountTokenValue
  | CodeTokenValue
  | TaggedCodeTokenValue;

export interface ReductionDetail {
  digits: number[];
  sum: number;
  reduceTo: number;
  steps: number[];
  master?: 11 | 22 | 33;
}

export interface TokenInfo {
  raw: string;
  type: TokenType;
  value: TokenValue;
  start: number;
  end: number;
  flags: Motif[];
  reduction: ReductionDetail;
  bucket?: string;
}

export interface PhrasebookLayerEntry {
  essence: string;
  message: string;
}

export interface PhrasebookTitles {
  [motif: string]: Record<string, string>;
}

export interface PhrasebookThemes {
  [motif: string]: Record<string, string[]>;
}

export interface PhrasebookLayered {
  time: Record<string, PhrasebookLayerEntry>;
  percent: Record<string, PhrasebookLayerEntry>;
  temp: Record<string, PhrasebookLayerEntry>;
  distance: Record<string, PhrasebookLayerEntry>;
  consumption: Record<string, PhrasebookLayerEntry>;
  fuel: Record<string, PhrasebookLayerEntry>;
  code: Record<string, PhrasebookLayerEntry>;
  "tagged-code": Record<string, PhrasebookLayerEntry>;
  count: Record<string, PhrasebookLayerEntry>;
}

export interface PhrasebookEnergyMessage {
  [motif: string]: Record<string, string>;
}

export interface PhrasebookAlignmentRow {
  focus: string;
  tone: string;
  guidance: string;
}

export interface PhrasebookAlignment {
  focusMap: Record<string, PhrasebookAlignmentRow>;
}

export interface PhrasebookResonanceEntry {
  elements: string[];
  chakras: string[];
  blurb: string;
}

export interface PhrasebookResonance {
  byCore: Record<string, PhrasebookResonanceEntry>;
  byMotif?: Record<string, PhrasebookResonanceEntry>;
}

export interface PhrasebookGuidanceEntry {
  area: string;
  blurb: string;
}

export interface PhrasebookGuidance {
  [motif: string]: Record<string, PhrasebookGuidanceEntry>;
}

export interface PhrasebookEssence {
  [motif: string]: string;
}

export interface PhrasebookAnchorTemplates {
  byType: Partial<Record<TokenType, Record<string, string>>>;
}

export interface Phrasebook {
  titles: PhrasebookTitles;
  themes: PhrasebookThemes;
  layered: PhrasebookLayered;
  energyMessage: PhrasebookEnergyMessage;
  alignmentRows: PhrasebookAlignment;
  resonance: PhrasebookResonance;
  guidanceAspect: PhrasebookGuidance;
  essenceSentence: PhrasebookEssence;
  anchorLabels: Partial<Record<TokenType, string>>;
  anchorTemplates: PhrasebookAnchorTemplates;
}

export interface ReadingConfig {
  phrasebook: Phrasebook;
  thresholds: {
    nearFullPercent: number;
    seventies: [number, number];
  };
}

export interface CaptureInput {
  raw: string;
  context?: string;
  entryNo?: number;
  tokens?: TokenInfo[];
}

export interface LayeredMeaningRow {
  segment: string;
  essence: string;
  message: string;
}

export interface AlignmentSummaryRow {
  focus: string;
  number: number;
  tone: string;
  guidance: string;
}

export interface VybeReading {
  header: {
    title: string;
    theme: string[];
  };
  anchorFrame: Record<string, string>;
  numerology: {
    tokens: TokenInfo[];
    flow: number[];
    coreFrequency: number;
    notes: Motif[];
  };
  layeredMeaning: LayeredMeaningRow[];
  energyMessage: string;
  alignmentSummary: AlignmentSummaryRow[];
  resonance: PhrasebookResonanceEntry;
  guidanceAspect: PhrasebookGuidanceEntry;
  essenceSentence: string;
}

export interface ExplainPayload {
  input: {
    raw: string;
    context?: string;
    entryNo?: number;
  };
  tokens: Array<{
    raw: string;
    type: TokenType;
    flags: Motif[];
    reduction: ReductionDetail;
    bucket?: string;
  }>;
  motifs: Motif[];
  coreFrequency: number;
  templateKeys: Record<string, string>;
}

export interface GeneratedReading {
  reading: VybeReading;
  explain?: ExplainPayload;
}
