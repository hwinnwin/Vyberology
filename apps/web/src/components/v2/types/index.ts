/**
 * VYBEROLOGY V2.0 - TYPE DEFINITIONS
 * Mystic Minimal Aesthetic + Lumen Engine Map
 */

export type ElementType = 'fire' | 'earth' | 'air' | 'water';

export type ChakraType =
  | 'root'
  | 'sacral'
  | 'solar'
  | 'heart'
  | 'throat'
  | 'thirdEye'
  | 'crown';

// Legacy compatibility
export type Element = ElementType;
export type Chakra = ChakraType | 'solar-plexus' | 'third-eye';

export interface ReadingData {
  // Core content
  markerTitle: string; // "Marker 144 — Stabilized Momentum"
  resonanceText: string; // 2-4 sentence resonance (alias: resonance for UI compat)
  essenceLine: string; // One distilled sentence
  intention: string; // Single focus statement
  reflectionKey: string; // Reflective question or insight

  // Energetics
  element: ElementType; // "fire" | "earth" | "air" | "water"
  chakra: ChakraType; // "heart", "solar", etc.

  // Numbers
  numbers: number[]; // raw numbers used in the reading
  masterNumbers: number[]; // extracted master numbers (11, 22, 33)

  // Metadata (optional but recommended)
  createdAt?: string; // timestamp ISO
  version?: string; // "V2.0"
  source?: 'manual' | 'ocr' | 'auto'; // origin of reading

  // Legacy UI compatibility
  resonance?: string; // Alias for resonanceText
}

export interface ShareCardConfig {
  format: 'vertical' | 'square'; // 1080x1920 or 1080x1080
  reading: ReadingData;
  includeWatermark?: boolean;
}

export interface ElementConfig {
  glyph: string;
  color: string;
  label: string;
}

export interface ChakraConfig {
  color: string;
  label: string;
  opacity: number;
}
