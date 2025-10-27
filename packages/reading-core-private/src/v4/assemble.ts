import phrasebookSource from "./phrasebook.json" assert { type: "json" };
import type {
  AlignmentSummaryRow,
  CaptureInput,
  ExplainPayload,
  GeneratedReading,
  LayeredMeaningRow,
  Motif,
  Phrasebook,
  PhrasebookLayerEntry,
  ReadingConfig,
  TokenInfo,
  TokenType,
  VybeReading,
} from "./types";
import { ensureTokens } from "./parse";
import { detectMotifs, dominantMotif, motifStrength } from "./motifs";

const DEFAULT_CONFIG: ReadingConfig = {
  phrasebook: phrasebookSource as Phrasebook,
  thresholds: { nearFullPercent: 95, seventies: [70, 79] },
};

const TYPE_PRIORITY: TokenType[] = [
  "time",
  "percent",
  "temp",
  "distance",
  "consumption",
  "fuel",
  "code",
  "tagged-code",
  "count",
];

export interface AssembleOptions {
  config?: Partial<ReadingConfig>;
  explain?: boolean;
}

export function assembleReading(input: CaptureInput, options?: AssembleOptions): GeneratedReading {
  const mergedConfig = mergeConfig(options?.config);
  const tokens = ensureTokens(input, {
    percentThresholds: {
      nearFull: mergedConfig.thresholds.nearFullPercent,
      seventies: mergedConfig.thresholds.seventies,
    },
  });

  const motifs = detectMotifs(tokens, input.context);
  const primaryMotif = dominantMotif(tokens, motifs);
  const orderedTokens = orderTokens(tokens);
  const headline = selectHeadline(orderedTokens, primaryMotif);
  const flow = orderedTokens.map((token) => valueForFlow(token));
  const coreFrequency = deriveCoreFrequency(orderedTokens);

  const reading: VybeReading = {
    header: buildHeader(
      input,
      orderedTokens,
      mergedConfig.phrasebook,
      primaryMotif,
      coreFrequency,
      headline
    ),
    anchorFrame: buildAnchorFrame(orderedTokens, mergedConfig.phrasebook, primaryMotif),
    numerology: {
      tokens: orderedTokens,
      flow,
      coreFrequency,
      notes: motifs,
    },
    layeredMeaning: buildLayeredMeaning(orderedTokens, mergedConfig.phrasebook),
    energyMessage: pickEnergyMessage(
      mergedConfig.phrasebook,
      primaryMotif,
      coreFrequency
    ),
    alignmentSummary: buildAlignmentSummary(
      orderedTokens,
      mergedConfig.phrasebook,
      coreFrequency
    ),
    resonance: pickResonance(mergedConfig.phrasebook, primaryMotif, coreFrequency),
    guidanceAspect: pickGuidanceAspect(
      mergedConfig.phrasebook,
      primaryMotif,
      coreFrequency
    ),
    essenceSentence: pickEssenceSentence(
      mergedConfig.phrasebook,
      primaryMotif,
      orderedTokens,
      headline
    ),
  };

  let explain: ExplainPayload | undefined;
  if (options?.explain) {
    explain = buildExplainPayload(input, reading, primaryMotif);
  }

  return explain ? { reading, explain } : { reading };
}

function mergeConfig(overrides?: Partial<ReadingConfig>): ReadingConfig {
  if (!overrides) {
    return DEFAULT_CONFIG;
  }
  return {
    phrasebook: overrides.phrasebook ?? DEFAULT_CONFIG.phrasebook,
    thresholds: overrides.thresholds ?? DEFAULT_CONFIG.thresholds,
  };
}

function orderTokens(tokens: TokenInfo[]): TokenInfo[] {
  return [...tokens].sort((a, b) => rankToken(a) - rankToken(b));
}

function rankToken(token: TokenInfo): number {
  const motifRanks = token.flags.map((flag) => motifStrength(flag));
  const motifRank = motifRanks.length
    ? Math.min(...motifRanks)
    : Number.MAX_SAFE_INTEGER;
  const typeRank = TYPE_PRIORITY.indexOf(token.type);
  return motifRank * 100 + (typeRank >= 0 ? typeRank : TYPE_PRIORITY.length) * 10 + token.start;
}

function deriveCoreFrequency(tokens: TokenInfo[]): number {
  const seed = tokens.reduce(
    (acc, token) => acc + valueForCore(token),
    0
  );
  return reduceToSingleDigit(seed);
}

function reduceToSingleDigit(value: number): number {
  let current = Math.abs(value);
  while (current > 9) {
    current = current
      .toString()
      .split("")
      .reduce((acc, digit) => acc + Number(digit), 0);
  }
  return current === 0 ? 0 : current;
}

function valueForCore(token: TokenInfo): number {
  if (token.reduction.master) {
    return token.reduction.master
      .toString()
      .split("")
      .reduce((acc, digit) => acc + Number(digit), 0);
  }
  return token.reduction.reduceTo;
}

function valueForFlow(token: TokenInfo): number {
  return valueForCore(token);
}

function buildHeader(
  input: CaptureInput,
  tokens: TokenInfo[],
  phrasebook: Phrasebook,
  motif: Motif | undefined,
  core: number,
  headline: string
): VybeReading["header"] {
  const motifKey = motif ?? "default";
  const titles = phrasebook.titles[motifKey] ?? phrasebook.titles.default;
  const coreKey = String(core);
  const titleSuffix =
    titles?.[coreKey] ??
    phrasebook.titles.default?.[coreKey] ??
    "Seal (The Renewal Spark)";

  const prefix = input.entryNo ? `Cycle IV Entry #${input.entryNo} — ` : "";
  const title = `${prefix}${headline} ${titleSuffix}`;

  const themes = phrasebook.themes[motifKey] ?? phrasebook.themes.default;
  const themeList =
    themes?.[coreKey] ?? phrasebook.themes.default?.[coreKey] ?? [];

  return { title, theme: themeList };
}

function buildAnchorFrame(
  tokens: TokenInfo[],
  phrasebook: Phrasebook,
  motif: Motif | undefined
): Record<string, string> {
  const anchors: Record<string, string> = {};
  const motifKey = motif ?? "default";
  tokens.forEach((token) => {
    const label = phrasebook.anchorLabels[token.type] ?? token.type;
    const templateGroup = phrasebook.anchorTemplates.byType[token.type] ?? {};
    const template =
      templateGroup[motifKey] ??
      templateGroup.default ??
      "{token}";
    const text = template.replace("{token}", token.raw);
    if (anchors[label]) {
      anchors[label] = `${anchors[label]} · ${text}`;
    } else {
      anchors[label] = text;
    }
  });
  return anchors;
}

function buildLayeredMeaning(
  tokens: TokenInfo[],
  phrasebook: Phrasebook
): LayeredMeaningRow[] {
  const layered: LayeredMeaningRow[] = [];
  const limit = Math.min(tokens.length, 4);
  for (let index = 0; index < limit; index += 1) {
    const token = tokens[index];
    const entry = lookupLayerEntry(phrasebook, token);
    layered.push({
      segment: token.raw,
      essence: entry?.essence ?? "",
      message: entry?.message ?? "",
    });
  }
  return layered;
}

function lookupLayerEntry(phrasebook: Phrasebook, token: TokenInfo): PhrasebookLayerEntry | undefined {
  const map = phrasebook.layered[token.type];
  if (!map) {
    return undefined;
  }
  let key: string | undefined;
  if (token.type === "percent") {
    key = token.bucket ?? String(valueForFlow(token));
  } else if (token.type === "time") {
    key = String(valueForFlow(token));
  } else if (token.type === "distance") {
    key = String(valueForCore(token));
  } else if (token.type === "fuel" || token.type === "consumption") {
    key = String(valueForFlow(token));
  } else if (token.type === "code" || token.type === "tagged-code" || token.type === "count") {
    key = token.reduction.master ? String(token.reduction.master) : String(valueForFlow(token));
  } else {
    key = String(valueForFlow(token));
  }
  return map?.[key];
}

function pickEnergyMessage(
  phrasebook: Phrasebook,
  motif: Motif | undefined,
  core: number
): string {
  const motifKey = motif ?? "default";
  const group = phrasebook.energyMessage[motifKey] ?? phrasebook.energyMessage.default;
  return (
    group[String(core)] ??
    group["default"] ??
    phrasebook.energyMessage.default[String(core)] ??
    ""
  );
}

function buildAlignmentSummary(
  tokens: TokenInfo[],
  phrasebook: Phrasebook,
  core: number
): AlignmentSummaryRow[] {
  const focusMap = phrasebook.alignmentRows.focusMap;
  const rows: AlignmentSummaryRow[] = [];
  const usedKeys = new Set<string>();

  const registerRow = (key: string, displayNumber: number | string) => {
    if (!focusMap[key] || usedKeys.has(key)) {
      return;
    }
    const info = focusMap[key];
    rows.push({
      focus: info.focus,
      number: typeof displayNumber === "number" ? displayNumber : Number(displayNumber),
      tone: info.tone,
      guidance: info.guidance,
    });
    usedKeys.add(key);
  };

  tokens.forEach((token) => {
    const numericRaw = token.raw.replace(/[^\d.]/g, "");
    if (numericRaw && focusMap[numericRaw]) {
      registerRow(numericRaw, Number(numericRaw));
    }
    const flowKey = token.reduction.master
      ? String(token.reduction.master)
      : String(valueForFlow(token));
    if (focusMap[flowKey]) {
      registerRow(flowKey, Number(flowKey));
    }
  });

  const coreKey = String(core);
  if (!usedKeys.has(coreKey) && focusMap[coreKey]) {
    registerRow(coreKey, core);
  }

  if (rows.length < 4) {
    const digitKeys = Array.from(
      new Set(
        tokens.flatMap((token) => token.reduction.digits.map((digit) => String(digit)))
      )
    );
    digitKeys.forEach((key) => {
      if (rows.length >= 4) {
        return;
      }
      if (focusMap[key]) {
        registerRow(key, Number(key));
      }
    });
  }

  return rows.slice(0, 4);
}

function pickResonance(
  phrasebook: Phrasebook,
  motif: Motif | undefined,
  core: number
) {
  const motifKey = motif ?? "";
  const byMotif = phrasebook.resonance.byMotif?.[motifKey];
  if (byMotif) {
    return byMotif;
  }
  return (
    phrasebook.resonance.byCore[String(core)] ??
    phrasebook.resonance.byCore["5"]
  );
}

function pickGuidanceAspect(
  phrasebook: Phrasebook,
  motif: Motif | undefined,
  core: number
) {
  const motifKey = motif ?? "default";
  const group = phrasebook.guidanceAspect[motifKey] ?? phrasebook.guidanceAspect.default;
  return (
    group?.[String(core)] ??
    phrasebook.guidanceAspect.default?.[String(core)] ??
    {
      area: "Integration",
      blurb: "",
    }
  );
}

function pickEssenceSentence(
  phrasebook: Phrasebook,
  motif: Motif | undefined,
  tokens: TokenInfo[],
  headline: string
): string {
  const motifKey = motif ?? "default";
  const template =
    phrasebook.essenceSentence[motifKey] ??
    phrasebook.essenceSentence.default ??
    "{token}";
  const primaryToken =
    headline.length > 0 ? headline : tokens[0]?.raw ?? "This moment";
  return template.replace("{token}", primaryToken);
}

function selectHeadline(tokens: TokenInfo[], motif: Motif | undefined): string {
  const motifTokens = motif
    ? tokens.filter((token) => token.flags.includes(motif))
    : [];
  const headlineTokens =
    motifTokens.length > 0 ? motifTokens : tokens.slice(0, 2);
  const uniqueSegments = Array.from(
    new Set(headlineTokens.map((token) => token.raw))
  );
  if (uniqueSegments.length === 0) {
    return tokens[0]?.raw ?? "Snapshot";
  }
  return uniqueSegments.slice(0, 2).join(" · ");
}

function buildExplainPayload(
  input: CaptureInput,
  reading: VybeReading,
  motif: Motif | undefined
): ExplainPayload {
  const explainInput: ExplainPayload["input"] = {
    raw: input.raw,
    ...(input.context !== undefined ? { context: input.context } : {}),
    ...(input.entryNo !== undefined ? { entryNo: input.entryNo } : {}),
  };

  return {
    input: explainInput,
    tokens: reading.numerology.tokens.map((token) => ({
      raw: token.raw,
      type: token.type,
      flags: token.flags,
      reduction: token.reduction,
      ...(token.bucket !== undefined ? { bucket: token.bucket } : {}),
    })),
    motifs: reading.numerology.notes,
    coreFrequency: reading.numerology.coreFrequency,
    templateKeys: {
      title: `${motif ?? "default"}:${reading.numerology.coreFrequency}`,
      energy: `${motif ?? "default"}:${reading.numerology.coreFrequency}`,
      essence: motif ?? "default",
      resonance: String(reading.numerology.coreFrequency),
      guidance: `${motif ?? "default"}:${reading.numerology.coreFrequency}`,
    },
  };
}
