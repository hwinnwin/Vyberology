// --- final compat shim for index.ts ---
export type NumerologyNumbers = {
  lifePath: { value: number; isMaster?: boolean };
  expression: { value: number; isMaster?: boolean };
  soulUrge: { value: number; isMaster?: boolean };
  personality: { value: number; isMaster?: boolean };
  [key: string]: { value: number; isMaster?: boolean } | undefined;
};

// single import set — remove any duplicate lines
import { mapChakras, type LegacySemantic as ChakraResult } from "./chakraMap";
import { makeFrequencyProfile, makeInsight, makeDetailedSummary } from "./composeReading";
import { computeAll } from "./calculators";
import { capitalizeName } from "./letterMap";

export type ReadingResult = {
  input: { fullName: string; dob: string };
  numbers: NumerologyNumbers;
  chakras: ChakraResult[]; // mapChakras returns array
  reading: {
    frequencyProfile: string; // stringified for UI
    energyField: string;
    insight: string;
    detailedSummary: string;
  };
};

// helper to feed chakra mapper
function toCoreArray(n: NumerologyNumbers): number[] {
  return [n.lifePath?.value, n.expression?.value, n.soulUrge?.value, n.personality?.value].filter(
    (v) => typeof v === "number",
  ) as number[];
}

export function generateReading(fullName: string, dobISO: string): ReadingResult {
  const capitalizedName = capitalizeName(fullName);
  const numbers = computeAll(fullName, dobISO);

  const core = toCoreArray(numbers);
  const chakras = mapChakras(core); // ChakraResult[]

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

// re-exports
export * from "./calculators";
export * from "./chakraMap";
export * from "./reduce";
