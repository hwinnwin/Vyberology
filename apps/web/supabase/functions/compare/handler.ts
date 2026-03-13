import type { CoreNumbers, NumerologyValue, Result } from "@vybe/reading-engine"; // added by Lumen (Stage 4A)

// added by Lumen (Stage 4A compare typing)
export type CompareRequest = { // added by Lumen (Stage 4A compare typing)
  aName: string;
  aDob: string;
  bName: string;
  bDob: string;
};

export type CompareErr = { code: "BAD_REQUEST"; message: string }; // added by Lumen (Stage 4A compare typing)

export type ChakraName = 'Root' | 'Sacral' | 'Solar Plexus' | 'Heart' | 'Throat' | 'Third Eye' | 'Crown'; // added by Lumen (Stage 4A compare typing)

export interface ChakraMapping { // added by Lumen (Stage 4A compare typing)
  lifePath: ChakraName;
  expression: ChakraName;
  soulUrge: ChakraName;
  personality: ChakraName;
  maturity: ChakraName;
}

export interface ChakraSummary { // added by Lumen (Stage 4A compare typing)
  dominant: ChakraName;
  bridge: ChakraName;
  mapping: ChakraMapping;
}

export interface CompatibilityProfile { // added by Lumen (Stage 4A compare typing)
  fullName: string;
  dob: string;
  numbers: CoreNumbers;
  chakras: ChakraSummary;
}

export interface BlendSummary { code: string; summary: string; } // added by Lumen (Stage 4A compare typing)

export interface ChakraWeaveSummary { // added by Lumen (Stage 4A compare typing)
  dominant: string;
  bridge: string;
  summary: string;
}

export interface ActionItem { chakra: string; text: string; } // added by Lumen (Stage 4A compare typing)

export interface ActionPlan { // added by Lumen (Stage 4A compare typing)
  focus: string;
  actions: ActionItem[];
  mantra: string;
}

export interface SynergySummary { // added by Lumen (Stage 4A compare typing)
  lifePathBlend: BlendSummary;
  expressionBlend: BlendSummary;
  soulUrgeBlend: BlendSummary;
  personalityBlend: BlendSummary;
  chakraWeave: ChakraWeaveSummary;
  prosperityVector: string;
  risks: string[];
}

export interface CompareOk { // added by Lumen (Stage 4A compare typing)
  left: CompatibilityProfile;
  right: CompatibilityProfile;
  synergy: SynergySummary;
  narrative: string;
  actions: ActionPlan;
}

// Pythagorean map A=1..I=9, J=1..R=9, S=1..Z=8
const LETTER_MAP: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
};

const VOWELS = new Set(['A','E','I','O','U','Y']);

const FOLD: Record<string,string> = {
  Á:'A',À:'A',Â:'A',Ä:'A',Ã:'A',Å:'A',Ā:'A',
  É:'E',È:'E',Ê:'E',Ë:'E',Ē:'E',
  Í:'I',Ì:'I',Î:'I',Ï:'I',Ī:'I',
  Ó:'O',Ò:'O',Ô:'O',Ö:'O',Õ:'O',Ō:'O',
  Ú:'U',Ù:'U',Û:'U',Ü:'U',Ū:'U',
  Ý:'Y',Ÿ:'Y',Ñ:'N',Ç:'C',Ś:'S',Ż:'Z',Ź:'Z',Ł:'L'
};

function capitalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeName(input: string): string {
  if (!input) return '';
  return input
    .toUpperCase()
    .split('')
    .map(ch => {
      const code = ch.charCodeAt(0);
      if (LETTER_MAP[ch]) return ch;
      if (FOLD[ch]) return FOLD[ch];
      if (code >= 65 && code <= 90) return ch;
      return '';
    })
    .join('');
}

function sumDigits(n: number): number {
  let s = 0;
  for (const ch of String(n)) s += (ch >= '0' && ch <= '9') ? Number(ch) : 0;
  return s;
}

function isMasterNumber(n: number): boolean {
  return n === 11 || n === 22 || n === 33;
}

function reduceNumber(n: number): number {
  if (isMasterNumber(n)) return n;
  
  let total = n;
  while (total > 9 && !isMasterNumber(total)) {
    total = sumDigits(total);
  }
  return total;
}

function makeNumValue(raw: number) {
  const reduced = reduceNumber(raw);
  return { raw, value: reduced, isMaster: isMasterNumber(reduced) };
}

function lettersToSum(name: string, predicate: (ch: string)=>boolean): number {
  const norm = normalizeName(name);
  let sum = 0;
  for (const ch of norm) {
    if (predicate(ch)) sum += LETTER_MAP[ch] || 0;
  }
  return sum;
}

function sumAllLetters(name: string): number {
  return lettersToSum(name, () => true);
}
function sumVowels(name: string): number {
  return lettersToSum(name, ch => VOWELS.has(ch));
}
function sumConsonants(name: string): number {
  return lettersToSum(name, ch => !VOWELS.has(ch));
}

function lifePathFromDOB(dobISO: string) {
  const match = dobISO.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const digits = dobISO.replace(/[^0-9]/g, '');
    const raw = digits.split('').reduce((a, d) => a + Number(d), 0);
    return makeNumValue(raw);
  }
  
  const [, year, month, day] = match;
  const raw = Number(day) + Number(month) + Number(year);
  return makeNumValue(raw);
}

function expressionFromName(name: string) {
  const raw = sumAllLetters(name);
  return makeNumValue(raw);
}

function soulUrgeFromName(name: string) {
  const raw = sumVowels(name);
  return makeNumValue(raw);
}

function personalityFromName(name: string) {
  const raw = sumConsonants(name);
  return makeNumValue(raw);
}

function maturityNumber(expression: NumerologyValue, lifePath: NumerologyValue): NumerologyValue { // added by Lumen (Stage 4A compare typing)
  const raw = expression.value + lifePath.value; // added by Lumen (Stage 4A compare typing)
  return makeNumValue(raw); // added by Lumen (Stage 4A compare typing)
}

function computeAll(fullName: string, dobISO: string): CoreNumbers { // added by Lumen (Stage 4A compare typing)
  const lifePath = lifePathFromDOB(dobISO);
  const expression = expressionFromName(fullName);
  const soulUrge = soulUrgeFromName(fullName);
  const personality = personalityFromName(fullName);
  const maturity = maturityNumber(expression, lifePath);
  return { lifePath, expression, soulUrge, personality, maturity };
}

function buildProfile(fullName: string, dob: string): CompatibilityProfile { // added by Lumen (Stage 4A compare typing)
  const capitalizedName = capitalizeName(fullName);
  const numbers = computeAll(fullName, dob);
  const chakras = mapChakras(numbers);
  return { fullName: capitalizedName, dob, numbers, chakras };
}

function reduceTo1to9KeepMasters(n: number): number {
  if (isMasterNumber(n)) return n;
  let v = n;
  while (v > 9 && !isMasterNumber(v)) v = sumDigits(v);
  return v;
}


const NUM_TO_CHAKRA: Record<number, ChakraName> = {
  1:'Root', 8:'Root',
  2:'Sacral', 11:'Sacral',
  3:'Solar Plexus', 9:'Solar Plexus',
  4:'Heart', 6:'Heart',
  5:'Throat',
  7:'Third Eye',
  22:'Crown', 33:'Crown'
};

const ISO = /^\d{4}-\d{2}-\d{2}$/; // added by Lumen (Stage 4A compare typing)

export function isCompareRequest(value: unknown): value is CompareRequest { // added by Lumen (Stage 4A compare typing)
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.aName === "string" && record.aName.trim().length > 0 &&
    typeof record.bName === "string" && record.bName.trim().length > 0 &&
    typeof record.aDob === "string" && ISO.test(record.aDob as string) &&
    typeof record.bDob === "string" && ISO.test(record.bDob as string);
}

function mapNum(n: number): Chakra {
  return NUM_TO_CHAKRA[n] ?? 'Root';
}

function mapChakras(nums: CoreNumbers): ChakraSummary { // added by Lumen (Stage 4A compare typing)
  const mapping: ChakraMapping = {
    lifePath: mapNum(nums.lifePath.value),
    expression: mapNum(nums.expression.value),
    soulUrge: mapNum(nums.soulUrge.value),
    personality: mapNum(nums.personality.value),
    maturity: mapNum(nums.maturity.value),
  };

  const counts = new Map<ChakraName, number>();
  (Object.values(mapping) as ChakraName[]).forEach((chakra) => {
    counts.set(chakra, (counts.get(chakra) ?? 0) + 1);
  });

  let dominant: ChakraName = "Root";
  let max = -1;
  counts.forEach((count, chakra) => {
    if (count > max) {
      dominant = chakra;
      max = count;
    }
  });

  const masters = [nums.lifePath, nums.expression, nums.soulUrge, nums.personality, nums.maturity]
    .filter((value) => value.isMaster)
    .map((value) => mapNum(value.value));

  let bridge: ChakraName;
  if (masters.length) {
    bridge = masters.includes("Crown") ? "Crown" : masters[0];
  } else {
    let second: ChakraName = dominant;
    let secondCount = -1;
    counts.forEach((count, chakra) => {
      if (chakra === dominant) return;
      if (count > secondCount) {
        second = chakra;
        secondCount = count;
      }
    });
    bridge = second === dominant ? "Root" : second;
  }

  return { dominant, bridge, mapping };
}

const LABELS: Record<number,string> = {
  1:'Initiator', 2:'Peacemaker', 3:'Creator', 4:'Builder',
  5:'Messenger', 6:'Harmonizer', 7:'Seer', 8:'Executive',
  9:'Humanitarian', 11:'Visionary', 22:'Master Builder', 33:'Master Teacher'
};

function tag(n: number): string {
  return LABELS[n] ? `${n} (${LABELS[n]})` : String(n);
}

function makeFrequencyProfile(nums: CoreNumbers): string {
  const parts = [
    `Life Path ${tag(nums.lifePath.value)}`,
    `Expression ${tag(nums.expression.value)}`,
    `Soul Urge ${tag(nums.soulUrge.value)}`,
    `Personality ${tag(nums.personality.value)}`,
    `Maturity ${tag(nums.maturity.value)}`
  ];
  return parts.join(' · ');
}

function lifePathBlendSummary(a: number, b: number) {
  const raw = a + b;
  const reduced = reduceTo1to9KeepMasters(raw);
  const code = `${a} + ${b} = ${raw} → ${reduced}`;
  const meaning =
    reduced === 8 ? "Prosperity through aligned leadership and clear structures." :
    reduced === 6 ? "Harmony, service, and community-centered growth." :
    reduced === 11 ? "Heightened intuition and shared vision; protect quiet time." :
    reduced === 22 ? "Blueprinting a legacy—translate vision into systems." :
    reduced === 5 ? "Change agents—keep freedom and communication clean." :
    "Blend your strengths; choose one clear owner per decision.";
  return { code, summary: meaning };
}

function simpleBlend(a: number, b: number, axis: string) {
  const code = `${a} × ${b}`;
  let meaning = "";
  if (axis === "Expression") {
    if (a === 8 && b === 8) meaning = "Double 8: mutual enterprise energy; set roles to avoid power clashes.";
    else if ((a === 22 || b === 22)) meaning = "22 present: turn concepts into reliable systems and SOPs.";
    else meaning = "Balance style and structure; define how decisions become action.";
  } else if (axis === "Soul Urge") {
    if ((a === 22 || b === 22)) meaning = "Deep drive to build something lasting; honor pacing and foundations.";
    else if (a === 8 && b === 8) meaning = "Shared desire for influence/prosperity; align ethics and value creation.";
    else meaning = "Name your true motives; let shared values lead choices.";
  } else {
    if (a === 5 || b === 5) meaning = "Keep flexibility—structure that breathes.";
    else meaning = "Complement daily rhythms; choose a shared cadence.";
  }
  return { code, summary: meaning };
}

function prosperityVector(lp: number, exA: number, exB: number): string {
  if (exA === 8 && exB === 8) return "Prosperity Vector: Dual 8 → revenue through clear offers, pricing, and delivery SLAs.";
  if (exA === 22 || exB === 22) return "Prosperity Vector: 22 present → productize systems; package outcomes, not hours.";
  if (lp === 8) return "Prosperity Vector: LP 8 influence → lead with numbers and outcomes.";
  return "Prosperity Vector: clarify the offer; ship small, iterate fast.";
}

function riskNotes(a: CompatibilityProfile, b: CompatibilityProfile): string[] { // added by Lumen (Stage 4A compare typing)
  const risks: string[] = [];
  if (a.numbers.expression.value === 8 && b.numbers.expression.value === 8)
    risks.push("Power collisions possible—set decision domains up front.");
  if (a.numbers.lifePath.value === 11 || b.numbers.lifePath.value === 11)
    risks.push("Sensitivity overload—protect quiet focus blocks.");
  if (a.numbers.personality.value === 5 || b.numbers.personality.value === 5)
    risks.push("Restlessness—lock a weekly ritual to stabilize momentum.");
  return risks;
}

function summarizeWeave(a: ChakraSummary, b: ChakraSummary): ChakraWeaveSummary { // added by Lumen (Stage 4A compare typing)
  const dom = `${a.dominant} ↔ ${b.dominant}`;
  const bridge = `${a.bridge} ↔ ${b.bridge}`;
  const text = `Chakra Weave: Dominants ${dom}; Bridges ${bridge}. This pairing favors mutual regulation: lead from the shared dominant, and use the bridges to translate vision into structure.`;
  return { dominant: dom, bridge, summary: text };
}

function composeActions(lp: BlendSummary, ex: BlendSummary, su: BlendSummary, risks: string[]): ActionPlan { // added by Lumen (Stage 4A compare typing)
  const highMaster =
    lp.code.includes("11") || lp.code.includes("22") || su.code.includes("22");
  const isDouble8 = ex.code.includes("8 × 8");
  const isFreedomPair = ex.code.includes("5") || lp.summary.includes("change");
  const isHarmonic = lp.summary.includes("Harmony");

  let focus = "";
  if (highMaster) focus = "Legacy Building";
  else if (isDouble8) focus = "Prosperity Leadership";
  else if (isFreedomPair) focus = "Creative Expansion";
  else if (isHarmonic) focus = "Emotional Balance";
  else focus = "Alignment Practice";

  const actions: ActionItem[] = [];

  if (focus === "Legacy Building") {
    actions.push(
      { chakra: "Crown", text: "Hold a weekly strategy ritual — one visionary, one builder. Protect this rhythm as sacred time." },
      { chakra: "Solar Plexus", text: "Translate each intuitive idea into a concrete deliverable within 48 hours." },
      { chakra: "Heart", text: "Anchor growth in service: measure success by value created, not hours spent." }
    );
  } else if (focus === "Prosperity Leadership") {
    actions.push(
      { chakra: "Solar Plexus", text: "Split decision domains: Vision vs. Operations — no overlap." },
      { chakra: "Root", text: "Set one measurable prosperity metric and review it every 11 days." },
      { chakra: "Heart", text: "Ground expansion through gratitude practice to balance power and presence." }
    );
  } else if (focus === "Creative Expansion") {
    actions.push(
      { chakra: "Sacral", text: "Schedule one creative free-flow session per week; no goals, just ideation." },
      { chakra: "Throat", text: "Document every spark immediately (voice note or Lumen capture)." },
      { chakra: "Third Eye", text: "Rotate responsibilities monthly to keep flow fresh and insight sharp." }
    );
  } else if (focus === "Emotional Balance") {
    actions.push(
      { chakra: "Root", text: "Begin meetings with a two-minute grounding breath." },
      { chakra: "Heart", text: "End each week sharing one appreciation each — keeps the Heart channel open." },
      { chakra: "Throat", text: "Journal moments of friction; identify the lesson before next step." }
    );
  } else {
    actions.push(
      { chakra: "Third Eye", text: "Start mornings with a three-line intention log to align focus." },
      { chakra: "Solar Plexus", text: "Close each day reviewing one aligned action and one to improve." },
      { chakra: "Crown", text: "Revisit your shared vision quarterly; adjust only after full review." }
    );
  }

  let mantra = "Aligned energy builds timeless structures.";
  if (focus === "Creative Expansion")
    mantra = "Freedom fuels our creation; presence holds it steady.";
  if (focus === "Emotional Balance")
    mantra = "Love is the system; structure is how it moves.";
  if (focus === "Legacy Building")
    mantra = "Our purpose becomes pattern; our work becomes light.";

  if (risks.length)
    actions.push({
      chakra: "Throat",
      text:
        "⚠️ Aware of risks: " +
        risks.join("; ") +
        ". Mitigate through clear communication and rest cycles."
    });

  return { focus, actions, mantra };
}


function compareProfiles(aName: string, aDob: string, bName: string, bDob: string): CompareOk { // added by Lumen (Stage 4A compare typing)
  const left = buildProfile(aName, aDob);
  const right = buildProfile(bName, bDob);

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

  const weave = summarizeWeave(left.chakras, right.chakras);
  const prosperity = prosperityVector(reduceTo1to9KeepMasters(lpA + lpB), exA, exB);
  const risks = riskNotes(left, right);

  const intro = `Compatibility Reading — ${left.fullName} × ${right.fullName}`;
  const freqLeft = makeFrequencyProfile(left.numbers);
  const freqRight = makeFrequencyProfile(right.numbers);
  const para1 = `Life Paths: ${lifePathBlend.code}. ${lifePathBlend.summary}`;
  const para2 = `Expression: ${expressionBlend.code}. ${expressionBlend.summary}`;
  const para3 = `Soul Urge: ${soulUrgeBlend.code}. ${soulUrgeBlend.summary}`;
  const para4 = `Personality: ${personalityBlend.code}. ${personalityBlend.summary}`;
  const para5 = `${weave.summary} ${prosperity}`;
  const para6 = risks.length ? `Risks: • ${risks.join(" • ")}` : "Risks: minimal; keep communication clean.";

  const narrative = [
    intro, "",
    `— ${left.fullName}: ${freqLeft}`,
    `— ${right.fullName}: ${freqRight}`,
    "", para1, para2, para3, para4, "", para5, para6
  ].join("\n");

  const actions = composeActions(lifePathBlend, expressionBlend, soulUrgeBlend, risks);

  return {
    left,
    right,
    synergy: {
      lifePathBlend,
      expressionBlend,
      soulUrgeBlend,
      personalityBlend,
      chakraWeave: weave,
      prosperityVector: prosperity,
      risks,
    },
    narrative,
    actions,
  };
}

export function prepareCompareResult(payload: unknown): Result<CompareOk, CompareErr> { // added by Lumen (Stage 4A compare typing)
  if (!isCompareRequest(payload)) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "aName, aDob, bName, and bDob are required" } };
  }

  const trimmed: CompareRequest = {
    aName: payload.aName.trim(),
    aDob: payload.aDob,
    bName: payload.bName.trim(),
    bDob: payload.bDob,
  };

  const value = compareProfiles(trimmed.aName, trimmed.aDob, trimmed.bName, trimmed.bDob);
  return { ok: true, value };
}
