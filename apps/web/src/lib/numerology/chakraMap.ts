/** Chakra + Element semantics used across Vyberology.
 *  Numbers map to primary chakra focus + elemental tone.
 *  Masters (11/22/33) get dual-centre activations.
 */

export type ChakraKey =
  | "root"
  | "sacral"
  | "solar"
  | "heart"
  | "throat"
  | "thirdEye"
  | "crown"
  | "thirdEye+heart" // 11
  | "heart+throat" // 33
  | "solar+root"; // 22

export type ElementKey = "earth" | "water" | "fire" | "air" | "ether";

export type Semantic = {
  chakra: ChakraKey;
  element: ElementKey | ElementKey[];
  themes: string[]; // short keywords used in UI badges
  note: string; // one-liner for internal copy
};

export function chakraFor(n: number): ChakraKey {
  // preserve master numbers explicitly
  if (n === 11) return "thirdEye+heart";
  if (n === 22) return "solar+root";
  if (n === 33) return "heart+throat";

  switch (n) {
    case 1:
      return "solar";
    case 2:
      return "sacral";
    case 3:
      return "throat";
    case 4:
      return "root";
    case 5:
      return "throat";
    case 6:
      return "heart";
    case 7:
      return "thirdEye";
    case 8:
      return "solar";
    case 9:
      return "crown";
    default:
      return "heart";
  }
}

export function elementFor(n: number): ElementKey | ElementKey[] {
  if (n === 11) return ["air", "ether"];
  if (n === 22) return ["earth", "fire"];
  if (n === 33) return ["water", "air"];

  switch (n) {
    case 1:
      return "fire";
    case 2:
      return "water";
    case 3:
      return "air";
    case 4:
      return "earth";
    case 5:
      return "air";
    case 6:
      return "water";
    case 7:
      return "ether";
    case 8:
      return "fire";
    case 9:
      return "ether";
    default:
      return "air";
  }
}

export function semanticsFor(n: number): Semantic {
  const chakra = chakraFor(n);
  const element = elementFor(n);

  const baseThemes: Record<number, string[]> = {
    1: ["initiative", "clarity", "leadership"],
    2: ["cooperation", "attunement", "balance"],
    3: ["creativity", "expression", "joy"],
    4: ["foundation", "order", "stability"],
    5: ["change", "adaptability", "freedom"],
    6: ["care", "harmony", "responsibility"],
    7: ["insight", "reflection", "study"],
    8: ["power", "impact", "stewardship"],
    9: ["completion", "release", "compassion"],
    11: ["intuition", "illumination", "signal"],
    22: ["architecture", "execution", "scale"],
    33: ["teaching", "service", "communication"],
  };

  const note: Record<number, string> = {
    1: "New path, decisive step.",
    2: "Listen, align, collaborate.",
    3: "Speak and create lightly.",
    4: "Make it real, brick by brick.",
    5: "Move with change; don’t force.",
    6: "Lead with care; hold the room.",
    7: "Quiet mind clarifies the path.",
    8: "Power with balance creates trust.",
    9: "Finish with grace; make space.",
    11: "Volume up: intuition online.",
    22: "Blueprints want action now.",
    33: "Share the wisdom with warmth.",
  };

  const themes = baseThemes[n] ?? ["alignment"];
  const summary = note[n] ?? "Aligned step available.";

  return { chakra, element, themes, note: summary };
}

// Optional: pretty label helpers for UI
export function prettyChakra(key: ChakraKey): string {
  const map: Record<ChakraKey, string> = {
    root: "Root",
    sacral: "Sacral",
    solar: "Solar Plexus",
    heart: "Heart",
    throat: "Throat",
    thirdEye: "Third Eye",
    crown: "Crown",
    "thirdEye+heart": "Third Eye × Heart",
    "heart+throat": "Heart × Throat",
    "solar+root": "Solar × Root",
  };
  return map[key] ?? "Chakra";
}

export function prettyElement(key: ElementKey | ElementKey[]): string {
  if (Array.isArray(key)) return key.map((k) => k[0].toUpperCase() + k.slice(1)).join(" + ");
  return key[0].toUpperCase() + key.slice(1);
}
// --- legacy compatibility stubs (for old PairReadingCard / chakraWeave) ---

// previously Semantic used dominant / bridge fields
// we fake them so older code compiles
export type LegacySemantic = Semantic & {
  dominant?: string;
  bridge?: string;
};

export function toLegacySemantic(s: Semantic): LegacySemantic {
  return {
    ...s,
    dominant: s.themes[0],
    bridge: s.themes[1] ?? s.themes[0],
  };
}

/** mapChakrasLegacy keeps type consistent with old imports */
export function mapChakras(nums: number[]): LegacySemantic[] {
  return nums.map((n) => toLegacySemantic(semanticsFor(n)));
}

// provide the same type alias older files expected
export type ChakraResult = LegacySemantic;
