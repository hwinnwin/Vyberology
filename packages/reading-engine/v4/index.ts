import { assembleReading, type AssembleOptions } from "./assemble";
import { FEATURE_FLAG } from "./parse";
import type { CaptureInput, GeneratedReading, ReadingConfig } from "./types";

export { assembleReading } from "./assemble";
export * from "./types";

export interface GenerateReadingOptions extends AssembleOptions {
  featureFlagOverride?: boolean;
}

export function generateReadingV4(
  input: CaptureInput,
  options?: GenerateReadingOptions
): GeneratedReading {
  if (!isFeatureEnabled(options?.featureFlagOverride)) {
    throw new Error(
      "FEATURE_VYBE_V4_READINGS is disabled. Enable the flag to access the Volume IV engine."
    );
  }
  return assembleReading(input, options);
}

export function isFeatureEnabled(override?: boolean): boolean {
  if (typeof override === "boolean") {
    return override;
  }
  const envValue =
    typeof process !== "undefined" ? process.env?.[FEATURE_FLAG] : undefined;
  return envValue === "true";
}

export function withConfig(
  base: ReadingConfig,
  overrides?: Partial<ReadingConfig>
): ReadingConfig {
  if (!overrides) {
    return base;
  }
  return {
    phrasebook: overrides.phrasebook ?? base.phrasebook,
    thresholds: overrides.thresholds ?? base.thresholds,
  };
}
