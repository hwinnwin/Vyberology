import type { Result } from "@vybe/reading-engine"; // added by Lumen (Stage 4A)

// added by Lumen (Stage 4A OCR typing)
export type OcrRequest = {
  imageUrl: string;
  lang?: string;
  mode?: "fast" | "accurate";
};

export type ReadingEntry = {
  input_text: string;
  normalized_number: string;
  numerology_data: NumerologyEntry;
  chakra_data: ChakraEntry;
  context: string;
  tags: string[];
};

export type OcrOk = {
  text: string;
  numbers: string[];
  readings: ReadingEntry[];
  meta?: Record<string, unknown>;
};

export type OcrErr =
  | { code: "BAD_REQUEST"; message: string }
  | { code: "ENGINE_ERROR"; message: string };

export interface OcrDeps {
  runOcr: (payload: OcrRequest & { mode: "fast" | "accurate" }) => Promise<OcrRunResult>;
}

export type OcrRunResult = {
  text: string;
  meta?: Record<string, unknown>;
};

const NUMEROLOGY_MAP: Record<string, NumerologyEntry> = {
  "0": { headline: "Divine Zero", keywords: ["infinite potential", "reset", "source"], guidance: "You stand at the threshold of infinite possibility." },
  "1": { headline: "The Initiator", keywords: ["new beginning", "leadership", "independence"], guidance: "You are being called to step forward and lead." },
  "2": { headline: "The Harmonizer", keywords: ["balance", "cooperation", "partnership"], guidance: "Seek harmony and balance." },
  "3": { headline: "The Creator", keywords: ["joy", "expression", "creativity"], guidance: "Express yourself freely." },
  "4": { headline: "The Builder", keywords: ["structure", "foundation", "stability"], guidance: "Build solid foundations." },
  "5": { headline: "Freedom Seeker", keywords: ["change", "adapt", "freedom"], guidance: "Embrace change and new experiences." },
  "6": { headline: "The Nurturer", keywords: ["care", "harmony", "responsibility"], guidance: "Care for yourself and others." },
  "7": { headline: "The Seeker", keywords: ["wisdom", "spirit", "introspection"], guidance: "Seek deeper understanding." },
  "8": { headline: "The Powerhouse", keywords: ["abundance", "authority", "power"], guidance: "Step into your power." },
  "9": { headline: "The Humanitarian", keywords: ["completion", "legacy", "wisdom"], guidance: "A cycle is completing." },
  "11": { headline: "The Visionary", keywords: ["intuition", "downloads", "spiritual insight"], guidance: "You are receiving divine downloads." },
  "22": { headline: "The Master Builder", keywords: ["architecture", "legacy", "manifestation"], guidance: "You have the power to build something lasting." },
  "33": { headline: "The Master Teacher", keywords: ["love", "healing", "compassion"], guidance: "You are here to heal and teach through love." },
  "44": { headline: "The Master Organizer", keywords: ["systems", "empire", "discipline"], guidance: "Build powerful systems and structures." },
};

const CHAKRA_MAP: Record<string, ChakraEntry> = {
  "1": { name: "Root Chakra", element: "Earth", focus: "grounding, survival, security", color: "red" },
  "2": { name: "Sacral Chakra", element: "Water", focus: "creativity, emotion, sensuality", color: "orange" },
  "3": { name: "Solar Plexus Chakra", element: "Fire", focus: "power, confidence, action", color: "yellow" },
  "4": { name: "Heart Chakra", element: "Air", focus: "love, compassion, connection", color: "green" },
  "5": { name: "Throat Chakra", element: "Sound", focus: "communication, truth, expression", color: "blue" },
  "6": { name: "Third Eye Chakra", element: "Light", focus: "intuition, vision, insight", color: "indigo" },
  "7": { name: "Crown Chakra", element: "Thought", focus: "consciousness, unity, enlightenment", color: "violet" },
  "8": { name: "Earth Star Chakra", element: "Earth", focus: "connection to Earth, ancestors", color: "brown" },
  "9": { name: "Soul Star Chakra", element: "Spirit", focus: "divine purpose, cosmic connection", color: "white" },
};

const MASTER_CHAKRA_AMPLIFICATIONS: Record<string, ChakraEntry> = {
  "11": { ...CHAKRA_MAP["7"], amplified: true, message: "Crown chakra amplified" },
  "22": { ...CHAKRA_MAP["1"], amplified: true, message: "Root chakra amplified" },
  "33": { ...CHAKRA_MAP["4"], amplified: true, message: "Heart chakra amplified" },
  "44": { ...CHAKRA_MAP["8"], amplified: true, message: "Earth Star amplified" },
};

const NUMBER_PATTERN = /\b\d+(:\d+)?%?\b/g; // 11:11, 75%, plain digits
const ISO_ORIGIN = /^(https?):\/\/\S+/i;

export function isOcrRequest(value: unknown): value is OcrRequest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.imageUrl !== "string" || !ISO_ORIGIN.test(record.imageUrl)) return false;
  if (record.lang && typeof record.lang !== "string") return false;
  if (record.mode && record.mode !== "fast" && record.mode !== "accurate") return false;
  return true;
}

export async function prepareOcrResult(
  deps: OcrDeps,
  payload: unknown
): Promise<Result<OcrOk, OcrErr>> {
  if (!isOcrRequest(payload)) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "imageUrl is required" } };
  }

  const sanitized: OcrRequest & { mode: "fast" | "accurate" } = {
    imageUrl: payload.imageUrl,
    lang: payload.lang,
    mode: payload.mode ?? "accurate",
  };

  try {
    const runResult = await deps.runOcr(sanitized);
    const text = runResult.text ?? "";
    const numbers = extractNumbers(text);
    const readings = numbers.map((numText) => buildReading(numText));

    return {
      ok: true,
      value: {
        text,
        numbers,
        readings,
        meta: runResult.meta,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "ENGINE_ERROR",
        message: error instanceof Error ? error.message : "OCR processing failed",
      },
    };
  }
}

function extractNumbers(text: string): string[] {
  if (!text) return [];
  const matches = text.match(NUMBER_PATTERN);
  if (!matches) return [];
  const unique = new Set<string>();
  matches.forEach((match) => unique.add(match.trim()));
  return Array.from(unique);
}

function buildReading(raw: string): ReadingEntry {
  const normalized = normalizeNumber(raw);
  return {
    input_text: raw,
    normalized_number: normalized,
    numerology_data: NUMEROLOGY_MAP[normalized] ?? NUMEROLOGY_MAP["0"],
    chakra_data: MASTER_CHAKRA_AMPLIFICATIONS[normalized] ?? CHAKRA_MAP[normalized] ?? CHAKRA_MAP["1"],
    context: "Extracted from image",
    tags: ["ocr", "screenshot"],
  };
}

function normalizeNumber(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return "0";
  let num = parseInt(digits, 10);
  const masterNumbers = new Set([11, 22, 33, 44]);
  while (num > 9 && !masterNumbers.has(num)) {
    num = String(num)
      .split("")
      .reduce((total, digit) => total + Number(digit), 0);
  }
  return String(num);
}

export interface NumerologyEntry {
  headline: string;
  keywords: string[];
  guidance: string;
}

export interface ChakraEntry {
  name: string;
  element: string;
  focus: string;
  color: string;
  amplified?: boolean;
  message?: string;
}
