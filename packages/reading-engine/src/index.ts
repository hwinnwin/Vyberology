type ElementKey = "fire" | "air" | "earth" | "water";

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
  settings?: { preserveMaster11?: boolean };
};

type ElementInfo = {
  key: ElementKey;
  glyph: string;
  name: string;
  qualities: string;
  stabilizer: string;
};

type ChakraInfo = {
  key: string;
  name: string;
  focus: string;
  mantra: string;
};

type ToneInfo = {
  label: string;
  directive: string;
  calibration: string;
};

type NumberProfile = {
  element: ElementInfo;
  chakra: ChakraInfo;
  tone: ToneInfo;
};

type ToneKey = "calm" | "direct" | "encouraging";

const DEFAULT_MASTERS = [11];

const CORE_PROFILES: Record<number, NumberProfile> = {
  1: {
    element: {
      key: "fire",
      glyph: "🜂",
      name: "Fire",
      qualities: "initiation · focused drive",
      stabilizer: "Channel your surge through one clear priority.",
    },
    chakra: {
      key: "muladhara",
      name: "Root",
      focus: "stability + action",
      mantra: "I anchor bold steps in grounded courage.",
    },
    tone: {
      label: "Initiator Pulse",
      directive: "Spark momentum and commit to decisive movement.",
      calibration: "Balance instinct with a breath before acting.",
    },
  },
  2: {
    element: {
      key: "water",
      glyph: "🜄",
      name: "Water",
      qualities: "receptivity · attunement",
      stabilizer: "Let collaboration shape the rhythm.",
    },
    chakra: {
      key: "svadhisthana",
      name: "Sacral",
      focus: "flow + desire",
      mantra: "I honor feeling as an intelligent guide.",
    },
    tone: {
      label: "Resonant Flow",
      directive: "Co-create through reflective listening and soft leadership.",
      calibration: "Hold boundaries so empathy does not flood you.",
    },
  },
  3: {
    element: {
      key: "air",
      glyph: "🜁",
      name: "Air",
      qualities: "expression · pattern clarity",
      stabilizer: "Name the insight that wants to be shared.",
    },
    chakra: {
      key: "manipura",
      name: "Solar Plexus",
      focus: "power + will",
      mantra: "I radiate playful confidence with focus.",
    },
    tone: {
      label: "Creative Current",
      directive: "Translate sparks into stories that invite others in.",
      calibration: "Ground ideas with one tangible experiment.",
    },
  },
  4: {
    element: {
      key: "earth",
      glyph: "🜃",
      name: "Earth",
      qualities: "structure · reliability",
      stabilizer: "Build the container before filling it.",
    },
    chakra: {
      key: "anahata",
      name: "Heart",
      focus: "coherence + compassion",
      mantra: "I design systems that let trust root deeply.",
    },
    tone: {
      label: "Foundation Grid",
      directive: "Sequence the work and let rhythm create safety.",
      calibration: "Release perfection where good structure already stands.",
    },
  },
  5: {
    element: {
      key: "air",
      glyph: "🜁",
      name: "Air",
      qualities: "adaptability · signal amplification",
      stabilizer: "Refresh the channel by changing scenery.",
    },
    chakra: {
      key: "vishuddha",
      name: "Throat",
      focus: "voice + truth",
      mantra: "I speak the bridge between worlds with clarity.",
    },
    tone: {
      label: "Messenger Wave",
      directive: "Broadcast insight and circulate new possibilities.",
      calibration: "Anchor in a personal truth so you do not scatter.",
    },
  },
  6: {
    element: {
      key: "earth",
      glyph: "🜃",
      name: "Earth",
      qualities: "nurturing · stewardship",
      stabilizer: "Tend the environment so care can multiply.",
    },
    chakra: {
      key: "anahata",
      name: "Heart",
      focus: "coherence + compassion",
      mantra: "I weave devotion into every action.",
    },
    tone: {
      label: "Harmonic Steward",
      directive: "Hold relational space with consistent devotion.",
      calibration: "Share the load—care also means letting others help.",
    },
  },
  7: {
    element: {
      key: "water",
      glyph: "🜄",
      name: "Water",
      qualities: "depth · inner sight",
      stabilizer: "Design time for contemplation before output.",
    },
    chakra: {
      key: "ajna",
      name: "Third Eye",
      focus: "clarity + vision",
      mantra: "I trust the quiet data beneath the noise.",
    },
    tone: {
      label: "Mystic Signal",
      directive: "Synthesize patterns and name the deeper throughline.",
      calibration: "Share your findings—do not vanish into analysis.",
    },
  },
  8: {
    element: {
      key: "earth",
      glyph: "🜃",
      name: "Earth",
      qualities: "mastery · calibration",
      stabilizer: "Audit the structure, then tighten with precision.",
    },
    chakra: {
      key: "manipura",
      name: "Solar Plexus",
      focus: "structure + mastery",
      mantra: "I direct power with discernment and accountability.",
    },
    tone: {
      label: "Authority Forge",
      directive: "Apply strategic pressure where excellence is required.",
      calibration: "Pair command with mentorship to avoid rigidity.",
    },
  },
  9: {
    element: {
      key: "fire",
      glyph: "🜂",
      name: "Fire",
      qualities: "service · transmutation",
      stabilizer: "Let purpose feed compassion, not martyrdom.",
    },
    chakra: {
      key: "anahata",
      name: "Heart",
      focus: "universal service",
      mantra: "I circulate generosity without depletion.",
    },
    tone: {
      label: "Global Ember",
      directive: "Illuminate collective needs and offer catalytic support.",
      calibration: "Hold personal edges so the mission remains sustainable.",
    },
  },
  11: {
    element: {
      key: "air",
      glyph: "🜁",
      name: "Air",
      qualities: "insight · transmission",
      stabilizer: "Translate the download into human language.",
    },
    chakra: {
      key: "ajna",
      name: "Third Eye",
      focus: "intuitive leadership",
      mantra: "I bridge higher signal with grounded action.",
    },
    tone: {
      label: "Harmonic Bridge",
      directive: "Align visionary ideas with an embodied next step.",
      calibration: "Share the mission so leadership stays collaborative.",
    },
  },
};

const FALLBACK_PROFILE = CORE_PROFILES[1];

const reduceDigits = (value: number) =>
  value
    .toString()
    .split("")
    .reduce((acc, char) => acc + Number(char), 0);

const collectDigits = (input: string) =>
  (input.match(/\d/g) ?? []).map((digit) => Number(digit));

export function sumToCoreNumber(
  input: string,
  options?: { preserveMasters?: number[]; fallback?: number }
): number {
  const digits = collectDigits(input);
  if (digits.length === 0) {
    return options?.fallback ?? 0;
  }

  const preserved = new Set(
    (options?.preserveMasters ?? DEFAULT_MASTERS).filter((value) => value > 0)
  );

  const literalValue = Number(digits.join(""));
  if (!Number.isNaN(literalValue) && preserved.has(literalValue)) {
    return literalValue;
  }

  let current = digits.reduce((total, digit) => total + digit, 0);

  while (current > 9 && !preserved.has(current)) {
    current = reduceDigits(current);
  }

  if (current === 0 && options?.fallback !== undefined) {
    return options.fallback;
  }

  return current;
}

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

type DeliveryContext = {
  core: number;
  toneLabel: string;
  profile: NumberProfile;
  anchors: number[];
  tokens: NumberToken[];
  temperatureToken?: NumberToken;
};

type TonePreset = {
  header(ctx: DeliveryContext): string;
  resonanceIntro(ctx: DeliveryContext): string;
  essence(ctx: DeliveryContext): string;
  intention(ctx: DeliveryContext): string;
  reflection(ctx: DeliveryContext): string;
};

const TONE_PRESETS: Record<ToneKey, TonePreset> = {
  calm: {
    header: (ctx) => `Marker · Core ${ctx.core} · Tone: ${ctx.toneLabel}`,
    resonanceIntro: (ctx) =>
      `Resonance: ${ctx.profile.chakra.name} expression settles through ${ctx.profile.element.name.toLowerCase()} form`,
    essence: (ctx) =>
      `Essence: Steady guidance for core ${ctx.core} honors ${ctx.profile.element.qualities}.`,
    intention: (ctx) =>
      `Intention: Move gently with ${lowerWithoutPeriod(ctx.profile.tone.directive)}`,
    reflection: (ctx) =>
      `Reflection: Notice how ${lowerWithoutPeriod(ctx.profile.tone.calibration)}`,
  },
  direct: {
    header: (ctx) => `Core ${ctx.core} · Tone ${ctx.toneLabel}`,
    resonanceIntro: (ctx) =>
      `Resonance: ${ctx.profile.chakra.name} power channels through ${ctx.profile.element.name.toLowerCase()} structure`,
    essence: (ctx) =>
      `Essence: Stay sharp—${ctx.profile.element.name} discipline keeps core ${ctx.core} on target.`,
    intention: (ctx) =>
      `Intention: Execute on ${lowerWithoutPeriod(ctx.profile.tone.directive)}`,
    reflection: (ctx) =>
      `Check-in: Verify where ${lowerWithoutPeriod(ctx.profile.tone.calibration)}`,
  },
  encouraging: {
    header: (ctx) => `Beacon · Core ${ctx.core} · Tone: ${ctx.toneLabel}`,
    resonanceIntro: (ctx) =>
      `Resonance: ${ctx.profile.chakra.name} radiance plays with ${ctx.profile.element.name.toLowerCase()} momentum`,
    essence: (ctx) =>
      `Essence: Celebrate how core ${ctx.core} uplifts through ${ctx.profile.element.qualities}.`,
    intention: (ctx) =>
      `Intention: Lean forward with ${lowerWithoutPeriod(ctx.profile.tone.directive)}`,
    reflection: (ctx) =>
      `Reflection: Wonder where ${lowerWithoutPeriod(ctx.profile.tone.calibration)}`,
  },
};

const toneKeyFromOption = (tone?: string): ToneKey => {
  switch ((tone ?? "").toLowerCase()) {
    case "direct":
      return "direct";
    case "encouraging":
      return "encouraging";
    default:
      return "calm";
  }
};

const lowerWithoutPeriod = (value: string) =>
  value.trim().replace(/\.$/, "").toLowerCase();

const ensurePeriod = (value: string) =>
  `${value.trim().replace(/[.?!]+$/, "")}.`;

export function renderVolumeIV(
  signals: Signals,
  opts?: { explain?: boolean; format?: "text" | "blocks"; tone?: ToneKey }
): DeliveredReading {
  const preserve = signals.settings?.preserveMaster11 === false ? [] : DEFAULT_MASTERS;
  const normalizedCore = sumToCoreNumber(String(signals.coreNumber), {
    preserveMasters: preserve,
    fallback: signals.coreNumber,
  });

  const profile =
    CORE_PROFILES[signals.coreNumber] ??
    CORE_PROFILES[normalizedCore] ??
    FALLBACK_PROFILE;

  const tokens = Array.isArray(signals.tokens) ? signals.tokens : [];

  const timeTokens = tokens.filter((token) => token.unit === "time");
  const percentTokens = tokens.filter((token) => token.unit === "percent");
  const countTokens = tokens.filter((token) => token.unit === "count");

  const anchors = Array.from(
    new Set(
      tokens
        .flatMap((token) => token.values)
        .filter((value) => Number.isFinite(value))
    )
  );

  const temperatureToken = tokens.find(
    (token) => token.unit === "temperature" && token.confidence >= 0.6
  );

  const toneLabel = signals.toneHint ?? profile.tone.label;
  const toneKey = toneKeyFromOption(opts?.tone);
  const tonePreset = TONE_PRESETS[toneKey];

  const detailSegments: string[] = [];
  if (anchors.length) {
    detailSegments.push(`Anchors ${anchors.join(", ")}`);
  }
  if (timeTokens.length) {
    detailSegments.push(`Time markers ${timeTokens.map((t) => t.raw).join(", ")}`);
  }
  if (percentTokens.length) {
    detailSegments.push(`Percent cues ${percentTokens.map((t) => t.raw).join(", ")}`);
  }
  if (countTokens.length) {
    detailSegments.push(`Count markers ${countTokens.map((t) => t.raw).join(", ")}`);
  }
  if (temperatureToken) {
    detailSegments.push(`Temperature cue ${temperatureToken.raw}`);
  }

  const deliveryContext: DeliveryContext = {
    core: signals.coreNumber,
    toneLabel,
    profile,
    anchors,
    tokens,
    temperatureToken,
  };

  const baseResonance = tonePreset.resonanceIntro(deliveryContext).trim();
  let resonance = baseResonance.endsWith(".") ? baseResonance : `${baseResonance}.`;
  if (detailSegments.length) {
    resonance = `${resonance} ${detailSegments.join(" · ")}.`;
  }

  const blocks: ReadingBlocks = {
    header: tonePreset.header(deliveryContext),
    elemental: `Element • ${profile.element.name} ${profile.element.glyph} — ${profile.element.qualities}. ${profile.element.stabilizer}`,
    chakra: `Chakra • ${profile.chakra.name} — focus on ${profile.chakra.focus}. Mantra: ${profile.chakra.mantra}`,
    resonance,
    essence: ensurePeriod(tonePreset.essence(deliveryContext)),
    intention: ensurePeriod(tonePreset.intention(deliveryContext)),
    reflection: ensurePeriod(tonePreset.reflection(deliveryContext)),
  };

  const text =
    opts?.format === "blocks"
      ? Object.values(blocks).join("\n\n")
      : Object.values(blocks).join("\n\n");

  const rationale = opts?.explain
    ? {
        inputs: {
          core: signals.coreNumber,
          normalizedCore,
          tokens,
          toneHint: signals.toneHint,
          settings: signals.settings,
        },
        derivations: {
          element: profile.element,
          chakra: profile.chakra,
          tone: { label: toneLabel, base: profile.tone.label, preset: toneKey },
          anchors,
          temperature: temperatureToken?.values ?? null,
          tokensByUnit: {
            time: timeTokens.map((t) => t.raw),
            percent: percentTokens.map((t) => t.raw),
            count: countTokens.map((t) => t.raw),
          },
          blocks,
        },
        render_decisions: [
          { section: "header", because: "core number supplied" },
          { section: "element", because: "core → element profile" },
          { section: "chakra", because: "core → chakra profile" },
          {
            section: "anchors",
            because: anchors.length ? "numeric anchors available" : "no anchors",
          },
          {
            section: "temperature",
            decision: temperatureToken ? "included" : "omitted",
            because: temperatureToken
              ? "confidence ≥ 0.6"
              : "no qualifying temperature token",
          },
          { section: "tone", because: toneKey },
        ],
      }
    : undefined;

  return { text, blocks, rationale };
}

export {
  assembleReading as assembleReadingV4,
  generateReadingV4,
  isFeatureEnabled as isV4ReadingEnabled,
} from "../v4/index";
