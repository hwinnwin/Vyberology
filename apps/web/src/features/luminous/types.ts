export type OrderKey =
  | "Dawnbearer"
  | "Heartforged"
  | "Starweaver"
  | "Stonecaller"
  | "Stormbound"
  | "Shadowmancer";

export interface OrderDefinition {
  name: OrderKey;
  sigil: string;
  originBlockId: string;
  trialBlockId: string;
  destinyBlockId: string;
  signatureAbilityId: string;
  lightTraits: string[];
  veilTraits: string[];
  defaultLumenheart: string;
}

export interface StoryBlocks {
  origin: Record<string, string>;
  trial: Record<string, string>;
  destiny: Record<string, string>;
  signatureAbility: Record<string, string>;
  openings: Record<string, string>;
  closings: Record<string, string>;
}

export interface QuizResult {
  finalOrder: OrderKey;
  scores: Record<OrderKey, number>;
  lifePath: number;
  lumenheart: string;
}

export interface LuminousUserInfo {
  name: string;
  email: string;
  dob: string;
  dedication?: string;
}
