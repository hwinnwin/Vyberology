/**
 * Shared numerology engine for Supabase Edge Functions.
 * Mirrors the client-side calculations in apps/web/src/lib/numerology/.
 */

// ─── Types ───
export type NumValue = { raw: number; value: number; isMaster: boolean };

export type NumerologyNumbers = {
  lifePath: NumValue;
  expression: NumValue;
  soulUrge: NumValue;
  soulUrgeDeep: NumValue;
  personality: NumValue;
  maturity: NumValue;
};

export type ChakraKey =
  | "root" | "sacral" | "solar" | "heart" | "throat"
  | "thirdEye" | "crown"
  | "thirdEye+heart" | "heart+throat" | "solar+root";

export type ElementKey = "earth" | "water" | "fire" | "air" | "ether";

export type Semantic = {
  chakra: ChakraKey;
  element: ElementKey | ElementKey[];
  themes: string[];
  note: string;
  dominant?: string;
  bridge?: string;
};

export type ReadingResult = {
  input: { fullName: string; dob: string };
  numbers: NumerologyNumbers;
  chakras: Semantic[];
  reading: {
    frequencyProfile: string;
    energyField: string;
    insight: string;
    detailedSummary: string;
  };
};

// ─── Reduction ───
export function sumDigits(n: number): number {
  let s = 0;
  for (const ch of String(n)) if (ch >= "0" && ch <= "9") s += Number(ch);
  return s;
}

export function isMasterNumber(n: number): boolean {
  return n === 11 || n === 22 || n === 33;
}

export function reduceNumber(n: number, preserveMastersEarly = false): number {
  let total = n;
  while (total > 9) {
    if (isMasterNumber(total) && (preserveMastersEarly || String(total).length <= 2)) {
      return total;
    }
    const next = sumDigits(total);
    if (next === total) break;
    total = next;
  }
  return total;
}

export function makeNumValue(raw: number, preserveMastersEarly = false): NumValue {
  const value = reduceNumber(raw, preserveMastersEarly);
  return { raw, value, isMaster: isMasterNumber(value) };
}

// ─── Letter Map (Pythagorean) ───
const LETTER_MAP: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);
const VOWELS_STRICT = new Set(["A", "E", "I", "O", "U"]);

const FOLD: Record<string, string> = {
  "Á": "A", "À": "A", "Â": "A", "Ä": "A", "Ã": "A", "Å": "A", "Ā": "A",
  "É": "E", "È": "E", "Ê": "E", "Ë": "E", "Ē": "E",
  "Í": "I", "Ì": "I", "Î": "I", "Ï": "I", "Ī": "I",
  "Ó": "O", "Ò": "O", "Ô": "O", "Ö": "O", "Õ": "O", "Ō": "O",
  "Ú": "U", "Ù": "U", "Û": "U", "Ü": "U", "Ū": "U",
  "Ç": "C", "Ñ": "N",
};

function normalizeName(input: string): string {
  if (!input) return "";
  return input
    .toUpperCase()
    .split("")
    .map((ch) => (LETTER_MAP[ch] ? ch : (FOLD[ch] ?? (/[A-Z]/.test(ch) ? ch : ""))))
    .join("");
}

export function capitalizeName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ─── Calculators ───
function lettersToSum(name: string, predicate: (ch: string) => boolean): number {
  const norm = normalizeName(name);
  let sum = 0;
  for (const ch of norm) if (predicate(ch)) sum += LETTER_MAP[ch] || 0;
  return sum;
}

export function lifePathFromDOB(dobISO: string): NumValue {
  const m = dobISO.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) {
    const digits = dobISO.replace(/\D+/g, "");
    const raw = digits.split("").reduce((a, d) => a + Number(d), 0);
    return makeNumValue(raw, true);
  }
  const [, year, month, day] = m;
  const raw = Number(day) + Number(month) + Number(year);
  return makeNumValue(raw, true);
}

export function expressionFromName(name: string): NumValue {
  return makeNumValue(lettersToSum(name, () => true), true);
}

export function soulUrgeFromName(name: string): NumValue {
  return makeNumValue(lettersToSum(name, (ch) => VOWELS.has(ch)), true);
}

export function soulUrgeDeepFromName(name: string): NumValue {
  return makeNumValue(lettersToSum(name, (ch) => VOWELS_STRICT.has(ch)), true);
}

export function personalityFromName(name: string): NumValue {
  return makeNumValue(lettersToSum(name, (ch) => !VOWELS.has(ch)), true);
}

export function maturityNumber(expression: NumValue, lifePath: NumValue): NumValue {
  return makeNumValue(expression.value + lifePath.value, true);
}

export function computeAll(fullName: string, dobISO: string): NumerologyNumbers {
  const lifePath = lifePathFromDOB(dobISO);
  const expression = expressionFromName(fullName);
  const soulUrge = soulUrgeFromName(fullName);
  const soulUrgeDeep = soulUrgeDeepFromName(fullName);
  const personality = personalityFromName(fullName);
  const maturity = maturityNumber(expression, lifePath);
  return { lifePath, expression, soulUrge, soulUrgeDeep, personality, maturity };
}

// ─── Chakra / Element Mapping ───
export function chakraFor(n: number): ChakraKey {
  if (n === 11) return "thirdEye+heart";
  if (n === 22) return "solar+root";
  if (n === 33) return "heart+throat";
  switch (n) {
    case 1: return "solar";
    case 2: return "sacral";
    case 3: return "throat";
    case 4: return "root";
    case 5: return "throat";
    case 6: return "heart";
    case 7: return "thirdEye";
    case 8: return "solar";
    case 9: return "crown";
    default: return "heart";
  }
}

export function elementFor(n: number): ElementKey | ElementKey[] {
  if (n === 11) return ["air", "ether"];
  if (n === 22) return ["earth", "fire"];
  if (n === 33) return ["water", "air"];
  switch (n) {
    case 1: return "fire";
    case 2: return "water";
    case 3: return "air";
    case 4: return "earth";
    case 5: return "air";
    case 6: return "water";
    case 7: return "ether";
    case 8: return "fire";
    case 9: return "ether";
    default: return "air";
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

  const noteMap: Record<number, string> = {
    1: "New path, decisive step.",
    2: "Listen, align, collaborate.",
    3: "Speak and create lightly.",
    4: "Make it real, brick by brick.",
    5: "Move with change; don't force.",
    6: "Lead with care; hold the room.",
    7: "Quiet mind clarifies the path.",
    8: "Power with balance creates trust.",
    9: "Finish with grace; make space.",
    11: "Volume up: intuition online.",
    22: "Blueprints want action now.",
    33: "Share the wisdom with warmth.",
  };

  const themes = baseThemes[n] ?? ["alignment"];
  const note = noteMap[n] ?? "Aligned step available.";

  return { chakra, element, themes, note, dominant: themes[0], bridge: themes[1] ?? themes[0] };
}

export function prettyChakra(key: ChakraKey | string): string {
  const map: Record<string, string> = {
    root: "Root", sacral: "Sacral", solar: "Solar Plexus", heart: "Heart",
    throat: "Throat", thirdEye: "Third Eye", crown: "Crown",
    "thirdEye+heart": "Third Eye × Heart", "heart+throat": "Heart × Throat",
    "solar+root": "Solar × Root",
  };
  return map[key] ?? "Chakra";
}

export function prettyElement(key: ElementKey | ElementKey[]): string {
  if (Array.isArray(key)) return key.map((k) => k[0].toUpperCase() + k.slice(1)).join(" + ");
  return key[0].toUpperCase() + key.slice(1);
}

export function mapChakras(nums: number[]): Semantic[] {
  return nums.map((n) => semanticsFor(n));
}

// ─── Full Reading Generator ───
function makeFrequencyProfile(values: number[]) {
  const freq: Record<number, number> = {};
  for (const v of values) freq[v] = (freq[v] ?? 0) + 1;
  return freq;
}

function makeInsight(values: number[]) {
  const sorted = [...values].sort(
    (a, b) => values.filter((v) => v === b).length - values.filter((v) => v === a).length
  );
  return `Dominant frequency ${sorted[0]}`;
}

function makeDetailedSummary(values: number[]) {
  return `Core pattern: ${values.join(" · ")}`;
}

export function generateReading(fullName: string, dobISO: string): ReadingResult {
  const capitalizedName = capitalizeName(fullName);
  const numbers = computeAll(fullName, dobISO);

  const core = [
    numbers.lifePath.value,
    numbers.expression.value,
    numbers.soulUrge.value,
    numbers.personality.value,
  ];
  const chakras = mapChakras(core);

  const frequencyProfile = JSON.stringify(makeFrequencyProfile(core));
  const dom = chakras[0]?.dominant ?? "—";
  const br = chakras[0]?.bridge ?? "—";
  const energyField = `Dominant: ${dom} · Bridge: ${br}`;
  const insight = makeInsight(core);
  const detailedSummary = makeDetailedSummary(core);

  return {
    input: { fullName: capitalizedName, dob: dobISO },
    numbers,
    chakras,
    reading: { frequencyProfile, energyField, insight, detailedSummary },
  };
}

// ─── Compatibility ───
export type Profile = {
  fullName: string;
  dob: string;
  numbers: NumerologyNumbers;
  chakras: Semantic[];
};

export type ChakraAction = { chakra: string; text: string };
export type ActionMap = { focus: string; actions: ChakraAction[]; mantra: string };

export type PairReading = {
  left: Profile;
  right: Profile;
  synergy: {
    lifePathBlend: { code: string; summary: string };
    expressionBlend: { code: string; summary: string };
    soulUrgeBlend: { code: string; summary: string };
    personalityBlend?: { code: string; summary: string };
    chakraWeave: { dominant: string; bridge: string; summary: string };
    prosperityVector: string;
    risks: string[];
  };
  narrative: string;
  actions: ActionMap;
};

function reduceTo1to9KeepMasters(n: number): number {
  let v = n;
  while (v > 9 && !isMasterNumber(v)) v = sumDigits(v);
  return v;
}

function buildProfile(fullName: string, dob: string): Profile {
  const numbers = computeAll(fullName, dob);
  const core = [numbers.lifePath.value, numbers.expression.value, numbers.soulUrge.value, numbers.personality.value];
  const chakras = mapChakras(core);
  return { fullName: capitalizeName(fullName), dob, numbers, chakras };
}

function lifePathBlendSummary(a: number, b: number) {
  const raw = a + b;
  const reduced = reduceTo1to9KeepMasters(raw);
  const code = `${a} + ${b} = ${raw} → ${reduced}`;
  const meaning =
    reduced === 8 ? "Prosperity through aligned leadership and clear structures."
    : reduced === 6 ? "Harmony, service, and community-centered growth."
    : reduced === 11 ? "Heightened intuition and shared vision; protect quiet time."
    : reduced === 22 ? "Blueprinting a legacy—translate vision into systems."
    : reduced === 5 ? "Change agents—keep freedom and communication clean."
    : "Blend your strengths; choose one clear owner per decision.";
  return { code, summary: meaning };
}

function simpleBlend(a: number, b: number, axis: "Expression" | "Soul Urge" | "Personality") {
  const code = `${a} × ${b}`;
  let meaning = "";
  if (axis === "Expression") {
    if (a === 8 && b === 8) meaning = "Double 8: mutual enterprise energy; set roles to avoid power clashes.";
    else if (a === 22 || b === 22) meaning = "22 present: turn concepts into reliable systems and SOPs.";
    else meaning = "Balance style and structure; define how decisions become action.";
  } else if (axis === "Soul Urge") {
    if (a === 22 || b === 22) meaning = "Deep drive to build something lasting; honor pacing and foundations.";
    else if (a === 8 && b === 8) meaning = "Shared desire for influence/prosperity; align ethics and value creation.";
    else meaning = "Name your true motives; let shared values lead choices.";
  } else {
    if (a === 5 || b === 5) meaning = "Keep flexibility—structure that breathes.";
    else meaning = "Complement daily rhythms; choose a shared cadence.";
  }
  return { code, summary: meaning };
}

function prosperityVector(lp: number, exA: number, exB: number): string {
  if (exA === 8 && exB === 8)
    return "Prosperity Vector: Dual 8 → revenue through clear offers, pricing, and delivery SLAs.";
  if (exA === 22 || exB === 22)
    return "Prosperity Vector: 22 present → productize systems; package outcomes, not hours.";
  if (lp === 8) return "Prosperity Vector: LP 8 influence → lead with numbers and outcomes.";
  return "Prosperity Vector: clarify the offer; ship small, iterate fast.";
}

function riskNotes(a: Profile, b: Profile): string[] {
  const risks: string[] = [];
  if (a.numbers.expression.value === 8 && b.numbers.expression.value === 8)
    risks.push("Power collisions possible—set decision domains up front.");
  if (a.numbers.lifePath.value === 11 || b.numbers.lifePath.value === 11)
    risks.push("Sensitivity overload—protect quiet focus blocks.");
  if (a.numbers.personality.value === 5 || b.numbers.personality.value === 5)
    risks.push("Restlessness—lock a weekly ritual to stabilize momentum.");
  return risks;
}

function composeActions(reading: PairReading): ActionMap {
  const lp = reading.synergy.lifePathBlend;
  const ex = reading.synergy.expressionBlend;
  const su = reading.synergy.soulUrgeBlend;
  const risks = reading.synergy.risks || [];

  const highMaster = lp.code.includes("11") || lp.code.includes("22") || su.code.includes("22");
  const isDouble8 = ex.code.includes("8 × 8");
  const isFreedomPair = ex.code.includes("5") || lp.summary.includes("change");
  const isHarmonic = lp.summary.includes("Harmony");

  let focus = "";
  if (highMaster) focus = "Legacy Building";
  else if (isDouble8) focus = "Prosperity Leadership";
  else if (isFreedomPair) focus = "Creative Expansion";
  else if (isHarmonic) focus = "Emotional Balance";
  else focus = "Alignment Practice";

  const actions: ChakraAction[] = [];

  if (focus === "Legacy Building") {
    actions.push(
      { chakra: "Crown", text: "Hold a weekly strategy ritual — one visionary, one builder. Protect this rhythm as sacred time." },
      { chakra: "Solar Plexus", text: "Translate each intuitive idea into a concrete deliverable within 48 hours." },
      { chakra: "Heart", text: "Anchor growth in service: measure success by value created, not hours spent." },
    );
  } else if (focus === "Prosperity Leadership") {
    actions.push(
      { chakra: "Solar Plexus", text: "Split decision domains: Vision vs. Operations — no overlap." },
      { chakra: "Root", text: "Set one measurable prosperity metric and review it every 11 days." },
      { chakra: "Heart", text: "Ground expansion through gratitude practice to balance power and presence." },
    );
  } else if (focus === "Creative Expansion") {
    actions.push(
      { chakra: "Sacral", text: "Schedule one creative free-flow session per week; no goals, just ideation." },
      { chakra: "Throat", text: "Document every spark immediately (voice note or Lumen capture)." },
      { chakra: "Third Eye", text: "Rotate responsibilities monthly to keep flow fresh and insight sharp." },
    );
  } else if (focus === "Emotional Balance") {
    actions.push(
      { chakra: "Root", text: "Begin meetings with a two-minute grounding breath." },
      { chakra: "Heart", text: "End each week sharing one appreciation each — keeps the Heart channel open." },
      { chakra: "Throat", text: "Journal moments of friction; identify the lesson before next step." },
    );
  } else {
    actions.push(
      { chakra: "Third Eye", text: "Start mornings with a three-line intention log to align focus." },
      { chakra: "Solar Plexus", text: "Close each day reviewing one aligned action and one to improve." },
      { chakra: "Crown", text: "Revisit your shared vision quarterly; adjust only after full review." },
    );
  }

  let mantra = "Aligned energy builds timeless structures.";
  if (focus === "Creative Expansion") mantra = "Freedom fuels our creation; presence holds it steady.";
  if (focus === "Emotional Balance") mantra = "Love is the system; structure is how it moves.";
  if (focus === "Legacy Building") mantra = "Our purpose becomes pattern; our work becomes light.";

  if (risks.length) {
    actions.push({
      chakra: "Throat",
      text: "⚠️ Aware of risks: " + risks.join("; ") + ". Mitigate through clear communication and rest cycles.",
    });
  }

  return { focus, actions, mantra };
}

export function compareProfiles(leftName: string, leftDob: string, rightName: string, rightDob: string): PairReading {
  const left = buildProfile(leftName, leftDob);
  const right = buildProfile(rightName, rightDob);

  const lpA = left.numbers.lifePath.value;
  const lpB = right.numbers.lifePath.value;
  const exA = left.numbers.expression.value;
  const exB = right.numbers.expression.value;
  const suA = left.numbers.soulUrge.value;
  const suB = right.numbers.soulUrge.value;
  const peA = left.numbers.personality.value;
  const peB = right.numbers.personality.value;

  const lifePathBlend = lifePathBlendSummary(lpA, lpB);
  const expressionBlend = simpleBlend(exA, exB, "Expression");
  const soulUrgeBlend = simpleBlend(suA, suB, "Soul Urge");
  const personalityBlend = simpleBlend(peA, peB, "Personality");

  // Simplified chakra weave (no external import needed)
  const domLeft = left.chakras[0]?.dominant ?? "—";
  const domRight = right.chakras[0]?.dominant ?? "—";
  const brLeft = left.chakras[0]?.bridge ?? "—";
  const brRight = right.chakras[0]?.bridge ?? "—";
  const weave = {
    dominant: `${domLeft} × ${domRight}`,
    bridge: `${brLeft} × ${brRight}`,
    summary: `Dominant themes (${domLeft}, ${domRight}) create the shared focus. Bridge themes (${brLeft}, ${brRight}) keep balance.`,
  };

  const prosperity = prosperityVector(reduceTo1to9KeepMasters(lpA + lpB), exA, exB);
  const risks = riskNotes(left, right);

  const leftCore = [lpA, exA, suA, peA];
  const rightCore = [lpB, exB, suB, peB];
  const freqLeft = JSON.stringify(makeFrequencyProfile(leftCore));
  const freqRight = JSON.stringify(makeFrequencyProfile(rightCore));

  const narrative = [
    `Compatibility Reading — ${left.fullName} × ${right.fullName}`,
    "",
    `— ${left.fullName}: ${freqLeft}`,
    `— ${right.fullName}: ${freqRight}`,
    "",
    `Life Paths: ${lifePathBlend.code}. ${lifePathBlend.summary}`,
    `Expression: ${expressionBlend.code}. ${expressionBlend.summary}`,
    `Soul Urge: ${soulUrgeBlend.code}. ${soulUrgeBlend.summary}`,
    `Personality: ${personalityBlend.code}. ${personalityBlend.summary}`,
    "",
    `${weave.summary} ${prosperity}`,
    risks.length ? `Risks: • ${risks.join(" • ")}` : "Risks: minimal; keep communication clean.",
  ].join("\n");

  const pairReading: PairReading = {
    left,
    right,
    synergy: { lifePathBlend, expressionBlend, soulUrgeBlend, personalityBlend, chakraWeave: weave, prosperityVector: prosperity, risks },
    narrative,
    actions: { focus: "", actions: [], mantra: "" },
  };

  pairReading.actions = composeActions(pairReading);
  return pairReading;
}
