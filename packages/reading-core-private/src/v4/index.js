import { assembleReading } from "./assemble";
import { FEATURE_FLAG } from "./parse";
export { assembleReading } from "./assemble";
export * from "./types";
export function generateReadingV4(input, options) {
    if (!isFeatureEnabled(options?.featureFlagOverride)) {
        throw new Error("FEATURE_VYBE_V4_READINGS is disabled. Enable the flag to access the Volume IV engine.");
    }
    return assembleReading(input, options);
}
export function isFeatureEnabled(override) {
    if (typeof override === "boolean") {
        return override;
    }
    const envValue = typeof process !== "undefined" ? process.env?.[FEATURE_FLAG] : undefined;
    return envValue === "true";
}
export function withConfig(base, overrides) {
    if (!overrides) {
        return base;
    }
    return {
        phrasebook: overrides.phrasebook ?? base.phrasebook,
        thresholds: overrides.thresholds ?? base.thresholds,
    };
}
