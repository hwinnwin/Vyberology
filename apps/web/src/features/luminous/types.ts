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
  tagline: string;
  essence: string;
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
  secondaryOrder: OrderKey;
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

export type BlockType = "text" | "list" | "quote";

export interface BookBlock {
  id: string;
  type: BlockType;
  editable: boolean;
  template: string;
}

export interface BookSection {
  id: string;
  title: string;
  description?: string;
  blocks: BookBlock[];
}

export interface LuminousBookTemplate {
  id: string;
  titleTemplate: string;
  sections: BookSection[];
}

export interface ResolvedBlock {
  id: string;
  type: BlockType;
  editable: boolean;
  value: string;
  defaultValue: string;
  edited: boolean;
}

export interface ResolvedSection {
  id: string;
  title: string;
  description?: string;
  blocks: ResolvedBlock[];
}

export interface ResolvedBook {
  title: string;
  sections: ResolvedSection[];
}
