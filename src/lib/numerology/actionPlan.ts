import { PairReading } from "./compat";

export type ChakraAction = {
  chakra: string;
  text: string;
};

export type ActionMap = {
  focus: string;
  actions: ChakraAction[];
  mantra: string;
};

/**
 * Generate a short practical plan with chakra tags.
 * Keeps Vyberology tone: calm authority + creative clarity.
 */
export function composeActions(reading: PairReading): ActionMap {
  const lp = reading.synergy.lifePathBlend;
  const ex = reading.synergy.expressionBlend;
  const su = reading.synergy.soulUrgeBlend;
  const risks = reading.synergy.risks || [];

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

  const actions: ChakraAction[] = [];

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

