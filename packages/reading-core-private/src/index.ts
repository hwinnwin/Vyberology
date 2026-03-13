// added by Claude Code (Stage A - IP Protection)
// Public API re-exports for @vybe/reading-core-private
export {
  generateReadingV4,
  assembleReading,
  isFeatureEnabled,
  withConfig,
  type GenerateReadingOptions,
} from "./v4/index";

export type {
  CaptureInput,
  GeneratedReading,
  VybeReading,
  TokenInfo,
  Motif,
  ReadingConfig,
  ExplainPayload,
} from "./v4/types";

export type { AssembleOptions } from "./v4/assemble";
