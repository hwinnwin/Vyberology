import { describe, it, expect } from "vitest";
import { sumVowels, sumVowelsStrict, soulUrgeFromName, soulUrgeDeepFromName, computeAll } from "../calculators";

describe("Dual Soul Urge", () => {
  it("sumVowels includes Y", () => {
    expect(sumVowels("Huynh Duc Tung Nguyen")).toBe(31);
  });

  it("sumVowelsStrict excludes Y", () => {
    expect(sumVowelsStrict("Huynh Duc Tung Nguyen")).toBe(17);
  });

  it("soulUrgeFromName returns Active Soul Frequency (Y = vowel)", () => {
    const result = soulUrgeFromName("Huynh Duc Tung Nguyen");
    expect(result).toEqual({ raw: 31, value: 4, isMaster: false });
  });

  it("soulUrgeDeepFromName returns Deep Soul Blueprint (Y = consonant)", () => {
    const result = soulUrgeDeepFromName("Huynh Duc Tung Nguyen");
    expect(result).toEqual({ raw: 17, value: 8, isMaster: false });
  });

  it("computeAll includes both soulUrge and soulUrgeDeep", () => {
    const result = computeAll("Huynh Duc Tung Nguyen", "1999-12-11");
    expect(result.soulUrge).toEqual({ raw: 31, value: 4, isMaster: false });
    expect(result.soulUrgeDeep).toEqual({ raw: 17, value: 8, isMaster: false });
  });

  it("name without Y produces unified soul frequencies", () => {
    const result = computeAll("Jane Doe", "1990-01-15");
    expect(result.soulUrge.value).toBe(result.soulUrgeDeep.value);
  });

  it("preserves master numbers in soulUrgeDeep", () => {
    const result = soulUrgeDeepFromName("Bedro");
    expect(result).toEqual({ raw: 11, value: 11, isMaster: true });
  });
});
