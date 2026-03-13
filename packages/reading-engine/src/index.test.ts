import { describe, expect, it } from "vitest";
import {
  renderVolumeIV,
  sumToCoreNumber,
  type NumberToken,
  type ReadingBlocks,
} from "./index";

const CORE_EXPECTATIONS: Record<
  number,
  { element: string; chakra: string; tone: string }
> = {
  1: { element: "Fire", chakra: "Root", tone: "Initiator Pulse" },
  2: { element: "Water", chakra: "Sacral", tone: "Resonant Flow" },
  3: { element: "Air", chakra: "Solar Plexus", tone: "Creative Current" },
  4: { element: "Earth", chakra: "Heart", tone: "Foundation Grid" },
  5: { element: "Air", chakra: "Throat", tone: "Messenger Wave" },
  6: { element: "Earth", chakra: "Heart", tone: "Harmonic Steward" },
  7: { element: "Water", chakra: "Third Eye", tone: "Mystic Signal" },
  8: { element: "Earth", chakra: "Solar Plexus", tone: "Authority Forge" },
  9: { element: "Fire", chakra: "Heart", tone: "Global Ember" },
  11: { element: "Air", chakra: "Third Eye", tone: "Harmonic Bridge" },
};

describe("sumToCoreNumber", () => {
  it("reduces composite numbers to a core digit", () => {
    expect(sumToCoreNumber("1985-06-12")).toBe(5);
  });

  it("reduces large multi-digit inputs repeatedly until a core is reached", () => {
    expect(sumToCoreNumber("123456789")).toBe(9);
  });

  it("preserves master 11 totals", () => {
    expect(sumToCoreNumber("38")).toBe(11);
    expect(sumToCoreNumber("11")).toBe(11);
  });

  it("returns the provided fallback when no digits exist", () => {
    expect(sumToCoreNumber("no digits", { fallback: 7 })).toBe(7);
  });
});

const expectBlockKeys = (blocks: ReadingBlocks) => {
  expect(Object.keys(blocks)).toEqual([
    "header",
    "elemental",
    "chakra",
    "resonance",
    "essence",
    "intention",
    "reflection",
  ]);
};

describe("renderVolumeIV", () => {
  const analyticsTokens: NumberToken[] = [
    { raw: "07:45", unit: "time", values: [7, 45], confidence: 0.92 },
    { raw: "63%", unit: "percent", values: [63], confidence: 0.81 },
    { raw: "42", unit: "count", values: [42], confidence: 0.76 },
    { raw: "18°C", unit: "temperature", values: [18], confidence: 0.94 },
  ];

  it("returns all delivery blocks when requested", () => {
    const result = renderVolumeIV(
      { coreNumber: 4, tokens: [] },
      { format: "blocks", explain: true }
    );

    expectBlockKeys(result.blocks);
    expect(result.blocks.resonance).not.toContain("Anchors");
    expect(result.blocks.resonance.toLowerCase()).not.toContain("temperature");
    expect(result.text).toBe(Object.values(result.blocks).join("\n\n"));
    expect(result.rationale?.derivations.blocks).toEqual(result.blocks);
  });

  it("stays silent about temperature without qualified tokens", () => {
    const withoutTemp: NumberToken[] = [
      { raw: "45%", unit: "percent", values: [45], confidence: 0.8 },
    ];
    const lowConfidence: NumberToken[] = [
      ...withoutTemp,
      { raw: "72°F", unit: "temperature", values: [72], confidence: 0.55 },
    ];
    const withTemp: NumberToken[] = [
      ...withoutTemp,
      { raw: "72°F", unit: "temperature", values: [72], confidence: 0.91 },
    ];

    expect(
      renderVolumeIV({ coreNumber: 7, tokens: withoutTemp }).blocks.resonance.toLowerCase()
    ).not.toContain("temperature");
    expect(
      renderVolumeIV({ coreNumber: 7, tokens: lowConfidence }).blocks.resonance.toLowerCase()
    ).not.toContain("temperature");
    expect(
      renderVolumeIV({ coreNumber: 7, tokens: withTemp }).blocks.resonance.toLowerCase()
    ).toContain("temperature cue 72°F".toLowerCase());
  });

  it("mentions anchors, time, percent, and count when tokens exist", () => {
    const result = renderVolumeIV({ coreNumber: 5, tokens: analyticsTokens });
    const resonance = result.blocks.resonance;

    expect(resonance).toContain("Anchors 7, 45, 63, 42");
    expect(resonance).toContain("Time markers 07:45");
    expect(resonance).toContain("Percent cues 63%");
    expect(resonance).toContain("Count markers 42");
    expect(resonance).toContain("Temperature cue 18°C");
  });

  it("produces deterministic mappings for supported cores", () => {
    const coreKeys = Object.keys(CORE_EXPECTATIONS)
      .map((value) => Number(value))
      .filter((core): core is keyof typeof CORE_EXPECTATIONS => core in CORE_EXPECTATIONS);
    coreKeys.forEach((core) => {
      const { blocks } = renderVolumeIV({ coreNumber: Number(core), tokens: [] });
      const expectations = CORE_EXPECTATIONS[core];

      expect(blocks.header).toContain(`Core ${core}`);
      expect(blocks.elemental).toContain(expectations.element);
      expect(blocks.chakra).toContain(expectations.chakra);
      expect(blocks.header).toContain(expectations.tone);
    });
  });

  it("switches tone vocab without changing logical gates", () => {
    const calm = renderVolumeIV({ coreNumber: 3, tokens: analyticsTokens });
    const direct = renderVolumeIV(
      { coreNumber: 3, tokens: analyticsTokens },
      { tone: "direct" }
    );
    const encouraging = renderVolumeIV(
      { coreNumber: 3, tokens: analyticsTokens },
      { tone: "encouraging" }
    );

    expect(calm.blocks.intention).not.toBe(direct.blocks.intention);
    expect(encouraging.blocks.reflection).not.toBe(calm.blocks.reflection);
    expect(direct.blocks.resonance.toLowerCase()).toContain("temperature cue");
  });

  it("matches snapshot for calm tone delivery", () => {
    const result = renderVolumeIV(
      { coreNumber: 8, tokens: analyticsTokens },
      { format: "blocks", tone: "calm" }
    );

    expect(result.blocks).toMatchSnapshot();
  });

  it("matches snapshot for master 11 without auxiliary tokens", () => {
    const result = renderVolumeIV(
      { coreNumber: 11, tokens: [] },
      { format: "blocks", tone: "encouraging" }
    );

    expect(result.blocks).toMatchSnapshot();
  });
});
