import { describe, expect, it } from "vitest";
import { assembleReading } from "../../v4/assemble";
import { detectMotifs, dominantMotif } from "../../v4/motifs";
import { extractTokens } from "../../v4/parse";
import { isFeatureEnabled, withConfig } from "../../v4/index";
import type { CaptureInput, ReadingConfig } from "../../v4/types";
import phrasebookData from "../../v4/phrasebook.json" assert { type: "json" };

describe("parse and motif helpers", () => {
  it("extracts and normalises all token types with buckets", () => {
    const tokens = extractTokens(
      "05:56 99% 18°C 12 km 6.7 L/100km 8.4 L 155000 CT999 88%",
      {
        percentThresholds: {
          nearFull: 98,
          seventies: [70, 79],
        },
      }
    );

    const time = tokens.find((token) => token.type === "time");
    const distance = tokens.find((token) => token.type === "distance");
    const tagged = tokens.find((token) => token.type === "tagged-code");

    expect(tokens.length).toBeGreaterThanOrEqual(9);
    expect(tokens.length).toBeLessThanOrEqual(10);
    expect(time?.value).toMatchObject({ hours: 5, minutes: 56 });
    expect(
      tokens.some(
        (token) => token.type === "percent" && token.bucket === "near_full"
      )
    ).toBe(true);
    expect(
      tokens.some((token) => token.type === "percent" && token.bucket === "88")
    ).toBe(true);
    expect(distance?.value).toMatchObject({ value: 12, unit: "km" });
    const hasFuelValue = tokens.some(
      (token) =>
        token.type === "fuel" &&
        Math.abs((token.value as { value: number }).value - 8.4) < 0.001
    );
    expect(hasFuelValue).toBe(true);
    expect(tagged?.value).toMatchObject({ prefix: "CT", digits: "999" });

    const efficiencyTokens = extractTokens("11.1 L/100km");
    expect(
      efficiencyTokens.some((token) => token.type === "consumption")
    ).toBe(true);
  });

  it("detects complex motif sets with arrival priority", () => {
    const tokens = extractTokens("05:55 05:56 05:57 1144 77 km 11.1 L 88%");
    const motifs = detectMotifs(tokens, "arriving home after a long drive");

    expect(motifs).toContain("arrival");
    expect(motifs).toContain("shift_555");
    expect(motifs).toContain("progression");
    expect(motifs).toContain("builder_44_1144");
    expect(motifs).toContain("abundance_signature");
    expect(motifs).toContain("gateway_11");
  });

  it("detects arrival motif for the 77 km distance marker alone", () => {
    const tokens = extractTokens("77 km");
    const motifs = detectMotifs(tokens);
    expect(motifs).toContain("arrival");
  });

  it("detects stack, triple, and percent motifs", () => {
    const tokens = extractTokens("06:06 606 616 636 555 99% 1144 88%");
    const motifs = detectMotifs(tokens);
    expect(motifs).toContain("heart_6_stack");
    expect(motifs).toContain("shift_555");
    expect(motifs).toContain("builder_44_1144");
    expect(motifs).toContain("abundance_signature");
    expect(motifs).toContain("percent_near_full");
    expect(motifs).toContain("triple");
  });

  it("returns undefined from dominantMotif when no motifs exist", () => {
    const tokens = extractTokens("");
    const motifs = detectMotifs(tokens);
    expect(dominantMotif(tokens, motifs)).toBeUndefined();
  });
});

describe("feature flag utilities", () => {
  it("reads the environment flag", () => {
    const original = process.env.FEATURE_VYBE_V4_READINGS;
    process.env.FEATURE_VYBE_V4_READINGS = "true";
    expect(isFeatureEnabled()).toBe(true);
    process.env.FEATURE_VYBE_V4_READINGS = "false";
    expect(isFeatureEnabled()).toBe(false);
    if (original === undefined) {
      delete process.env.FEATURE_VYBE_V4_READINGS;
    } else {
      process.env.FEATURE_VYBE_V4_READINGS = original;
    }
  });

  it("merges configuration overrides", () => {
    const base: ReadingConfig = {
      phrasebook: phrasebookData,
      thresholds: { nearFullPercent: 95, seventies: [70, 79] },
    };
    const merged = withConfig(base, {
      thresholds: { nearFullPercent: 90, seventies: [65, 75] },
    });

    expect(merged.thresholds.nearFullPercent).toBe(90);
    expect(merged.phrasebook).toBe(base.phrasebook);
  });

  it("returns the base configuration when overrides are omitted", () => {
    const base: ReadingConfig = {
      phrasebook: phrasebookData,
      thresholds: { nearFullPercent: 95, seventies: [70, 79] },
    };
    expect(withConfig(base)).toBe(base);
  });
});

describe("assembly fallbacks", () => {
  it("handles empty captures by falling back to defaults", () => {
    const input: CaptureInput = { raw: "", entryNo: 1 };
    const { reading } = assembleReading(input, { explain: true });

    expect(reading.header.title).toContain("Snapshot");
    expect(reading.essenceSentence).toContain("Snapshot");
    expect(reading.resonance.elements.length).toBeGreaterThan(0);
    expect(reading.alignmentSummary.length).toBe(0);
  });

  it("maps layered meaning for temperature tokens", () => {
    const input: CaptureInput = { raw: "05:56 18°C", entryNo: 2 };
    const { reading } = assembleReading(input, {
      config: {
        phrasebook: phrasebookData,
        thresholds: { nearFullPercent: 95, seventies: [70, 79] },
      },
    });

    const tempRow = reading.layeredMeaning.find((row) => row.segment === "18°C");
    expect(tempRow?.essence).toContain("Temperature cue");
  });

  // added by Claude Code (Stage 3) — updated to match new phrasebook focus names
  it("deduplicates alignment summary entries for repeated digits", () => {
    const input: CaptureInput = { raw: "15:51 30%", entryNo: 8 };
    const { reading } = assembleReading(input);
    const expressionRows = reading.alignmentSummary.filter((row) => row.focus === "Expression");
    expect(expressionRows).toHaveLength(1);
  });

  it("falls back to token-only essence when templates are missing", () => {
    const cloned = JSON.parse(JSON.stringify(phrasebookData));
    delete cloned.essenceSentence.mirror_time;
    delete cloned.essenceSentence.default;
    delete cloned.alignmentRows.focusMap["5"];
    delete cloned.layered.time;
    const input: CaptureInput = { raw: "15:51", entryNo: 7 };
    const { reading } = assembleReading(input, {
      config: {
        phrasebook: cloned,
        thresholds: { nearFullPercent: 95, seventies: [70, 79] },
      },
    });

    expect(reading.essenceSentence).toBe("15:51");
    expect(reading.layeredMeaning[0].essence).toBe("");
  });
});
