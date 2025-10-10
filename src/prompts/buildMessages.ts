import { LUMEN_TONE } from "./toneEmbed";
import { GOLD_SHOTS } from "./goldShots";

export type DepthMode = "lite" | "standard" | "deep";

export function buildReadingMessages(params: {
  fullName: string;
  dobISO?: string;
  inputs: Array<{ label: string; value: string | number }>;
  numbers?: {
    lifePath?: { value: number, isMaster?: boolean };
    expression?: { value: number, isMaster?: boolean };
    soulUrge?: { value: number, isMaster?: boolean };
    personality?: { value: number, isMaster?: boolean };
  };
  includeChakra?: boolean;
  depth?: DepthMode; // default "standard"
}) {
  const depth = params.depth ?? "standard";
  const lengthHint =
    depth === "lite" ? "Keep to ~180–250 words." :
    depth === "deep" ? "Allow ~700–1000 words; include all sections with detail." :
    "Keep to ~350–500 words; include all sections.";

  return [
    { role: "system", content: LUMEN_TONE },
    ...GOLD_SHOTS,
    {
      role: "user",
      content: `
Generate a Vyberology reading in the exact sectioned format.
Name: ${params.fullName}
DOB: ${params.dobISO ?? "—"}
Captured Inputs:
${params.inputs.map(i => `- ${i.label}: ${i.value}`).join("\n")}

Known Numbers (modern method, keep masters):
${params.numbers ? JSON.stringify(params.numbers) : "Compute from DOB if present; otherwise infer from inputs."}

Output rules:
- Use the section headers exactly.
- Show working for Numerology Breakdown.
- Keep master 11/22/33 un-reduced at final step.
- Prefer "Insight" wording in place of "Applied Cue".
- ${lengthHint}
`.trim()
    }
  ];
}
