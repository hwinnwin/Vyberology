// --- ultra-shim for legacy numerology types ---
// goal: compile everything without refactor
// this file will later be replaced by cleaner model objects

// 1️⃣ define NumerologyNumbers as a plain object with expected keys
export type NumerologyNumbers = {
  lifePath: { value: number };
  expression: { value: number };
  soulUrge: { value: number };
  personality: { value: number };
  [key: string]: { value: number } | undefined;
};

// 2️⃣ import once from chakraMap
import { mapChakras, type LegacySemantic as ChakraResult } from "./chakraMap";
import { computeAll } from "./calculators";
import { makeFrequencyProfile } from "./composeReading";
import { summarizeWeave } from "./chakraWeave";
import { capitalizeName } from "./letterMap";

export type Profile = {
  fullName: string;
  dob: string;
  numbers: NumerologyNumbers;
  chakras: ChakraResult[]; // ← note the [] because mapChakras returns an array
};

export type ChakraAction = {
  chakra: string;
  text: string;
};

export type ActionMap = {
  focus: string;
  actions: ChakraAction[];
  mantra: string;
};

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
  const masters = new Set([11, 22, 33]);
  const sumDigits = (x: number) =>
    String(x)
      .split("")
      .reduce((a, d) => a + Number(d), 0);
  let v = n;
  while (v > 9 && !masters.has(v)) v = sumDigits(v);
  return v;
}

function lifePathBlendSummary(a: number, b: number) {
  const raw = a + b;
  const reduced = reduceTo1to9KeepMasters(raw);
  const code = `${a} + ${b} = ${raw} → ${reduced}`;
  const meaning =
    reduced === 8
      ? "Prosperity through aligned leadership and clear structures."
      : reduced === 6
        ? "Harmony, service, and community-centered growth."
        : reduced === 11
          ? "Heightened intuition and shared vision; protect quiet time."
          : reduced === 22
            ? "Blueprinting a legacy—translate vision into systems."
            : reduced === 5
              ? "Change agents—keep freedom and communication clean."
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

export function buildProfile(fullName: string, dob: string): Profile {
  const numbers = computeAll(fullName, dob);
  const core = [numbers.lifePath.value, numbers.expression.value, numbers.soulUrge.value, numbers.personality.value];
  const chakras = mapChakras(core);
  return { fullName: capitalizeName(fullName), dob, numbers, chakras };
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

  const weave = summarizeWeave(left.chakras[0], right.chakras[0]);
  const prosperity = prosperityVector(reduceTo1to9KeepMasters(lpA + lpB), exA, exB);
  const risks = riskNotes(left, right);

  const intro = `Compatibility Reading — ${left.fullName} × ${right.fullName}`;
  const leftCore = [left.numbers.lifePath.value, left.numbers.expression.value, left.numbers.soulUrge.value, left.numbers.personality.value];
  const rightCore = [right.numbers.lifePath.value, right.numbers.expression.value, right.numbers.soulUrge.value, right.numbers.personality.value];
  const freqLeft = JSON.stringify(makeFrequencyProfile(leftCore));
  const freqRight = JSON.stringify(makeFrequencyProfile(rightCore));
  const para1 = `Life Paths: ${lifePathBlend.code}. ${lifePathBlend.summary}`;
  const para2 = `Expression: ${expressionBlend.code}. ${expressionBlend.summary}`;
  const para3 = `Soul Urge: ${soulUrgeBlend.code}. ${soulUrgeBlend.summary}`;
  const para4 = `Personality: ${personalityBlend.code}. ${personalityBlend.summary}`;
  const para5 = `${weave.summary} ${prosperity}`;
  const para6 = risks.length ? `Risks: • ${risks.join(" • ")}` : "Risks: minimal; keep communication clean.";

  const narrative = [
    intro,
    "",
    `— ${left.fullName}: ${freqLeft}`,
    `— ${right.fullName}: ${freqRight}`,
    "",
    para1,
    para2,
    para3,
    para4,
    "",
    para5,
    para6,
  ].join("\n");

  // Generate action plan
  const pairReading = {
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
    actions: { focus: "", actions: [], mantra: "" }, // placeholder
  };

  const actions = composeActionsInternal(pairReading);

  return {
    ...pairReading,
    actions,
  };
}

// Internal action composer (to avoid circular import)
function composeActionsInternal(reading: Omit<PairReading, "actions"> & { actions: ActionMap }): ActionMap {
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
      {
        chakra: "Crown",
        text: "Hold a weekly strategy ritual — one visionary, one builder. Protect this rhythm as sacred time.",
      },
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

  if (risks.length)
    actions.push({
      chakra: "Throat",
      text: "⚠️ Aware of risks: " + risks.join("; ") + ". Mitigate through clear communication and rest cycles.",
    });

  return { focus, actions, mantra };
}
