export type Element = "fire" | "water" | "earth" | "air";

export interface NumerologyResult {
  hours: number;
  minutes: number;
  sum: number;
  coreNumber: number;
  element: Element;
  isMasterNumber: boolean;
  inputTime: string;
}

export interface Reading {
  id: string;
  created_at: string;
  user_id: string | null;
  input_time: string;
  core_number: number;
  element: string;
  reading_text: string;
}

export interface ReadingResponse {
  essence: string;
  message: string;
  invitation: string;
}

export interface ElementInfo {
  name: Element;
  emoji: string;
  color: string;
  qualities: string[];
}

export const ELEMENT_INFO: Record<Element, ElementInfo> = {
  fire: {
    name: "fire",
    emoji: "🔥",
    color: "text-orange-500",
    qualities: ["Action", "Creativity", "Passion"],
  },
  water: {
    name: "water",
    emoji: "💧",
    color: "text-blue-500",
    qualities: ["Balance", "Harmony", "Healing"],
  },
  earth: {
    name: "earth",
    emoji: "🌍",
    color: "text-green-600",
    qualities: ["Stability", "Abundance", "Grounding"],
  },
  air: {
    name: "air",
    emoji: "💨",
    color: "text-cyan-400",
    qualities: ["Change", "Wisdom", "Freedom"],
  },
};

export const MASTER_NUMBERS = [11, 22, 33] as const;

export const NUMBER_MEANINGS: Record<number, string> = {
  1: "New beginnings, leadership, independence",
  2: "Balance, partnership, diplomacy",
  3: "Creativity, expression, joy",
  4: "Foundation, stability, hard work",
  5: "Change, freedom, adventure",
  6: "Harmony, responsibility, love",
  7: "Wisdom, introspection, spirituality",
  8: "Abundance, power, manifestation",
  9: "Completion, wisdom, humanitarianism",
  11: "Master Illuminator - spiritual insight, intuition",
  22: "Master Builder - manifesting dreams into reality",
  33: "Master Teacher - compassion, healing, upliftment",
};
