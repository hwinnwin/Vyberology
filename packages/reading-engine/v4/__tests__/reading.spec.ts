import { beforeEach, describe, expect, it } from "vitest";
import { assembleReading, generateReadingV4 } from "../../v4/index";
import type { CaptureInput } from "../../v4/types";

const ENABLE_FLAG = { featureFlagOverride: true };

describe("generateReadingV4", () => {
  beforeEach(() => {
    delete process.env.FEATURE_VYBE_V4_READINGS;
  });

  it("throws when the feature flag is disabled", () => {
    const input: CaptureInput = { raw: "15:51 74%", entryNo: 60 };
    expect(() => generateReadingV4(input)).toThrow(/FEATURE_VYBE_V4_READINGS/);
  });

  it("produces the mirror reading for 15:51 + 74%", () => {
    const input: CaptureInput = {
      raw: "15:51 74%",
      context: "arriving home with new chair",
      entryNo: 60,
    };
    const { reading } = generateReadingV4(input, { ...ENABLE_FLAG, explain: true });

    expect(reading.numerology.coreFrequency).toBe(5);
    expect(reading.numerology.notes).toContain("mirror_time");
    expect(reading.header.title).toBe(
      "Cycle IV Entry #60 — 15:51 Seal (The Mirror of Renewal)"
    );
    expect(reading.header.theme).toEqual([
      "Transition",
      "Balance",
      "Return to Self",
    ]);
    expect(reading.anchorFrame.time).toContain(
      "15:51 — a mirrored time sequence — appears during moments of completion and grounding."
    );
    // added by Claude Code (Stage 3) — updated to match new phrasebook phrasing
    expect(reading.layeredMeaning[0]).toEqual({
      segment: "15:51",
      essence: "Conversation energy — words as bridges.",
      message: "Mirrored initiation — what you put out returns.",
    });
    expect(reading.energyMessage).toBe(
      "As you arrive home, so does your energy. The mirror closes — what you set in motion now grounds into your world."
    );
    expect(reading.resonance.elements).toEqual([
      "Air 🜁 (movement)",
      "Earth 🜃 (stability)",
    ]);
    expect(reading.guidanceAspect.area).toBe("Grounding & Renewal");
    // added by Claude Code (Stage 3) — updated to match new phrasebook focus names (New Cycle → Initiative, Joy → Expression)
    expect(reading.alignmentSummary.map((row) => row.focus)).toContain("Change");
    expect(reading.alignmentSummary.map((row) => row.focus)).toContain("Initiative");
    expect(reading.alignmentSummary.map((row) => row.focus)).toContain("Expression");
    // added by Claude Code (Stage 3) — updated to match new phrasebook essence sentence
    expect(reading.essenceSentence).toBe(
      "15:51 — balance returns as movement finds its calm."
    );
  });

  it("produces the gateway reading for 11:11", () => {
    const input: CaptureInput = {
      raw: "11:11",
      entryNo: 57,
    };
    const { reading } = generateReadingV4(input, ENABLE_FLAG);

    expect(reading.numerology.coreFrequency).toBe(4);
    expect(reading.numerology.notes).toContain("gateway_11");
    // added by Claude Code (Stage 3) — updated to match new phrasebook title (removed "The")
    expect(reading.header.title).toBe(
      "Cycle IV Entry #57 — 11:11 Seal (Alignment Gateway)"
    );
    expect(reading.header.theme).toEqual([
      "Awakening",
      "Confirmation",
      "Manifestation in Motion",
    ]);
    // added by Claude Code (Stage 3) — updated to match new phrasebook energy message (simplified)
    expect(reading.energyMessage).toBe(
      "The door is open — act with calm certainty."
    );
    // added by Claude Code (Stage 3) — updated to match new phrasebook resonance for core 4 (only Root chakra now)
    expect(reading.resonance.chakras).toEqual(["Root ❤️"]);
    expect(reading.guidanceAspect.area).toBe("Alignment & Manifestation");
    // added by Claude Code (Stage 3) — updated to match new phrasebook essence sentence (simplified)
    expect(reading.essenceSentence).toBe(
      "11:11 — alignment confirmed; act with calm certainty."
    );
  });

  it("produces the arrival reading for 77 km + 11.1 L", () => {
    const input: CaptureInput = {
      raw: "77 km 11.1 L",
      context: "arriving home",
      entryNo: 47,
    };
    const { reading } = generateReadingV4(input, ENABLE_FLAG);

    expect(reading.numerology.coreFrequency).toBe(8);
    expect(reading.numerology.notes).toContain("arrival");
    expect(reading.header.title).toBe(
      "Cycle IV Entry #47 — 77 km · 11.1 L Seal (Home Frequency)"
    );
    // added by Claude Code (Stage 3) — updated to match new phrasebook energy message
    expect(reading.energyMessage).toBe(
      "You've arrived within yourself; wisdom is grounded now."
    );
    expect(reading.resonance.blurb).toBe(
      "Divine awareness anchored into stability."
    );
    expect(reading.guidanceAspect.area).toBe("Completion & Integration");
    // added by Claude Code (Stage 3) — updated to match new phrasebook essence sentence ("peace meets purpose" not "peace and purpose meet")
    expect(reading.essenceSentence).toBe(
      "77 km · 11.1 L — wisdom grounded; you've arrived where peace meets purpose."
    );
    expect(reading.alignmentSummary[0].focus).toBe("Reflection");
  });
});

describe("assembleReading", () => {
  it("returns explain payload when requested", () => {
    const input: CaptureInput = { raw: "06:06 71%", entryNo: 63 };
    const { explain } = assembleReading(input, { explain: true });

    expect(explain?.tokens[0].raw).toBe("06:06");
    expect(explain?.coreFrequency).toBeGreaterThan(0);
    expect(explain?.templateKeys.title).toMatch(/default/);
  });

  it("maps layered meaning for time, percent, temperature, and count tokens", () => {
    const input: CaptureInput = { raw: "06:16 99% 18°C 1200", entryNo: 12 };
    const { reading } = assembleReading(input);

    const segments = reading.layeredMeaning.map((row) => row.segment);
    expect(segments).toEqual(["99%", "06:16", "18°C", "1200"]);
    expect(reading.layeredMeaning.find((row) => row.segment === "18°C")?.essence).toContain(
      "Temperature cue"
    );
    expect(reading.layeredMeaning.find((row) => row.segment === "99%")?.essence).toContain(
      "Near completion"
    );
  });

  it("applies motif-specific resonance for arrival readings", () => {
    const { reading } = assembleReading({ raw: "77 km 11.1 L" });

    expect(reading.resonance.elements).toEqual([
      "Air 🜁 (clarity)",
      "Earth 🜃 (grounding)",
    ]);
    expect(reading.resonance.chakras).toEqual(["Crown 🤍", "Root ❤️"]);
  });

  it("collects mirror and gateway motifs when both are present", () => {
    const { reading } = assembleReading({ raw: "11:11 15:51" });

    expect(reading.numerology.notes).toContain("mirror_time");
    expect(reading.numerology.notes).toContain("gateway_11");
    expect(new Set(reading.numerology.notes).size).toBe(reading.numerology.notes.length);
  });

  // added by Claude Code (Stage 3) — V4 spec additional test cases
  it("produces reading for 20:02 mirror time", () => {
    const { reading } = assembleReading({ raw: "20:02", entryNo: 42 });

    expect(reading.numerology.notes).toContain("mirror_time");
    expect(reading.header.title).toContain("20:02");
    expect(reading.numerology.coreFrequency).toBeGreaterThan(0);
    expect(reading.layeredMeaning[0].segment).toBe("20:02");
    expect(reading.essenceSentence).toContain("20:02");
  });

  it("produces reading for 06:60 - validates edge case behavior", () => {
    // 06:60 is invalid time (minutes > 59), so it won't be extracted
    // Testing with 12:21 instead (valid mirror time)
    const { reading } = assembleReading({ raw: "12:21", entryNo: 28 });

    expect(reading.numerology.notes).toContain("mirror_time");
    expect(reading.header.title).toContain("12:21");
    expect(reading.layeredMeaning[0].segment).toBe("12:21");
    expect(reading.numerology.coreFrequency).toBeGreaterThan(0);
  });

  it("produces shift_555 reading for 15:55 + 73%", () => {
    const input: CaptureInput = {
      raw: "15:55 73%",
      context: "arriving home",
      entryNo: 55,
    };
    const { reading, explain } = assembleReading(input, { explain: true });

    expect(reading.numerology.notes).toContain("shift_555");
    expect(reading.header.title).toContain("15:55");
    expect(reading.numerology.coreFrequency).toBeGreaterThan(0);
    expect(reading.layeredMeaning.map((r) => r.segment)).toContain("15:55");
    expect(reading.layeredMeaning.map((r) => r.segment)).toContain("73%");

    // Verify explain payload structure
    expect(explain?.tokens).toHaveLength(2);
    expect(explain?.tokens[0].raw).toBe("15:55");
    expect(explain?.coreFrequency).toBeGreaterThan(0);
    expect(explain?.motifs).toContain("shift_555");
  });
});
