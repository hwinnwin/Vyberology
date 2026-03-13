import { NumValue } from "./reduce";
import { chakraFor, elementFor, semanticsFor, prettyChakra, prettyElement } from "./chakraMap";

/** Types the UI can consume */
export type Section = {
  title: string;
  lines: string[];
};

export type ReadingBlock = {
  theme: string;
  anchorFrame?: string;
  numbersTable: { label: string; raw: number; value: number; isMaster: boolean; meaning: string }[];
  mainPattern: string;
  chakra: string;
  element: string;
  alignmentSummary: Section;
  energyMessage: string;
  essence: string;
};

/** Helper to label a core number with meaning */
function meaningFor(label: string, v: NumValue): string {
  const n = v.value;
  const s = semanticsFor(n);
  const masterTag = v.isMaster ? " · Master" : "";
  return `${s.themes[0]} · ${s.themes[1]}${masterTag}`;
}

/** Build a compact pattern string like "11 · 9 · 1" */
function patternFrom(values: number[]): string {
  return values.map((v) => (v === 11 || v === 22 || v === 33 ? String(v) : String(v))).join(" · ");
}

/** Compose a high-level reading block the UI (or LLM) can render to Markdown. */
export function composeReading(opts: {
  title?: string;
  anchorFrame?: string;
  context?: string;
  parts: {
    lifePath: NumValue;
    expression: NumValue;
    soulUrge: NumValue;
    personality: NumValue;
    maturity: NumValue;
  };
}): ReadingBlock {
  const { anchorFrame, parts } = opts;

  const numbersTable = [
    { label: "Life Path", v: parts.lifePath },
    { label: "Expression", v: parts.expression },
    { label: "Soul Urge", v: parts.soulUrge },
    { label: "Personality", v: parts.personality },
    { label: "Maturity", v: parts.maturity },
  ].map((row) => ({
    label: row.label,
    raw: row.v.raw,
    value: row.v.value,
    isMaster: row.v.isMaster,
    meaning: meaningFor(row.label, row.v),
  }));

  // Dominant frequency: weight Life Path + Expression slightly higher
  const freqWeights: Array<[number, number]> = [
    [parts.lifePath.value, 2],
    [parts.expression.value, 2],
    [parts.soulUrge.value, 1],
    [parts.personality.value, 1],
    [parts.maturity.value, 1],
  ];

  const tally = new Map<number, number>();
  for (const [n, w] of freqWeights) tally.set(n, (tally.get(n) ?? 0) + w);

  // Pick the number with highest score; prefer masters on ties
  const top = [...tally.entries()].sort((a, b) => {
    if (a[1] === b[1]) {
      const aMaster = a[0] === 11 || a[0] === 22 || a[0] === 33;
      const bMaster = b[0] === 11 || b[0] === 22 || b[0] === 33;
      if (aMaster && !bMaster) return -1;
      if (!aMaster && bMaster) return 1;
      return a[0] - b[0];
    }
    return b[1] - a[1];
  })[0][0];

  const chakra = prettyChakra(chakraFor(top));
  const element = prettyElement(elementFor(top));
  const mainPattern = patternFrom([
    parts.lifePath.value,
    parts.expression.value,
    parts.soulUrge.value,
    parts.personality.value,
    parts.maturity.value,
  ]);

  // Theme sentence
  const themeSem = semanticsFor(top);
  const theme = `${themeSem.themes[0][0].toUpperCase() + themeSem.themes[0].slice(1)} & ${themeSem.themes[1]}`;

  // Alignment Summary bullets (kept short; LLM can elaborate if needed)
  const alignmentSummary: Section = {
    title: "Alignment Summary",
    lines: [
      `• Lead with ${themeSem.themes[0]} — let it set today’s pace.`,
      `• Support with ${themeSem.themes[1]} — avoid overcomplication.`,
      `• Watch for ${themeSem.themes[2]} — it’s the growth edge.`,
    ],
  };

  // Energy message & essence — concise; UI can show as quote cards
  const energyMessage = (() => {
    switch (top) {
      case 11:
        return "“Trust the signal — intuition is louder than usual.”";
      case 22:
        return "“Blueprints want action — build one real step today.”";
      case 33:
        return "“Teach by example — your warmth is the message.”";
      case 1:
        return "“Choose one clear step; simple beats perfect.”";
      case 2:
        return "“Listen first; alignment comes from attunement.”";
      case 3:
        return "“Say it simply; light words carry far.”";
      case 4:
        return "“Lay one brick; foundations love consistency.”";
      case 5:
        return "“Let change breathe; move with it, not against it.”";
      case 6:
        return "“Care is strength; hold the field steady.”";
      case 7:
        return "“Quiet reveals the path; reflect before you act.”";
      case 8:
        return "“Power flows when grounded; steward your impact.”";
      case 9:
        return "“Close with gratitude; space invites the new.”";
      default:
        return "“Stay present; the next step will show itself.”";
    }
  })();

  const essence = (() => {
    switch (top) {
      case 11:
        return "Trust the signal — it’s confirmation, not coincidence.";
      case 22:
        return "Make it tangible — vision becomes real through structure.";
      case 33:
        return "Lead with compassion — your voice heals as it teaches.";
      case 1:
        return "Move slow, decide clear.";
      case 2:
        return "Stay connected, not crowded.";
      case 3:
        return "Create lightly, share warmly.";
      case 4:
        return "Strong roots, steady growth.";
      case 5:
        return "Flow with change; keep your centre.";
      case 6:
        return "Harmony first — the rest follows.";
      case 7:
        return "Clarity comes from quiet.";
      case 8:
        return "Balanced power builds trust.";
      case 9:
        return "Finish well, begin clean.";
      default:
        return "Calm step, clear signal.";
    }
  })();

  return {
    theme,
    anchorFrame,
    numbersTable,
    mainPattern,
    chakra: `${chakra}`,
    element: `${element}`,
    alignmentSummary,
    energyMessage,
    essence,
  };
}

/** Utility: render a ReadingBlock to Markdown (used by UI or sent to LLM for expansion) */
export function renderReadingMarkdown(r: ReadingBlock, title = "Vyberology Reading"): string {
  const tbl = r.numbersTable
    .map((row) => `| ${row.label} | ${row.raw} → **${row.value}**${row.isMaster ? " (Master)" : ""} | ${row.meaning} |`)
    .join("\n");

  const summary = r.alignmentSummary.lines.join("\n");

  return [
    `### 🌍 ${title}`,
    r.anchorFrame ? `*Anchor:* ${r.anchorFrame}\n` : "",
    `**Theme:** ${r.theme}`,
    ``,
    `#### 🔢 Core Numbers`,
    `| Aspect | Raw → Value | Meaning |`,
    `|---|---|---|`,
    tbl,
    ``,
    `**Main Pattern:** ${r.mainPattern}`,
    `**Chakra / Element:** ${r.chakra} · ${r.element}`,
    ``,
    `#### 🌿 Energy Message`,
    r.energyMessage,
    ``,
    `#### 🜂 ${r.alignmentSummary.title}`,
    summary,
    ``,
    `#### ✴️ Essence`,
    `*${r.essence}*`,
  ]
    .filter(Boolean)
    .join("\n");
}
// --- legacy compatibility stubs ---
export function makeFrequencyProfile(values: number[]) {
  const freq: Record<number, number> = {};
  for (const v of values) freq[v] = (freq[v] ?? 0) + 1;
  return freq;
}

export function makeInsight(values: number[]) {
  const top = values.sort((a, b) => values.filter((v) => v === b).length - values.filter((v) => v === a).length)[0];
  return `Dominant frequency ${top}`;
}

export function makeDetailedSummary(values: number[]) {
  return `Core pattern: ${values.join(" · ")}`;
}
