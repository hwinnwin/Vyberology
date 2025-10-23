import { describe, expect, it } from "vitest"; // added by Lumen (Stage 4A compare typing)
import { prepareCompareResult } from "./handler.ts"; // added by Lumen (Stage 4A compare typing)

const valid: Record<string, unknown> = { // added by Lumen (Stage 4A compare typing)
  aName: "Alex", // added by Lumen (Stage 4A compare typing)
  aDob: "1990-05-06", // added by Lumen (Stage 4A compare typing)
  bName: "Blake", // added by Lumen (Stage 4A compare typing)
  bDob: "1992-07-08", // added by Lumen (Stage 4A compare typing)
};

describe("prepareCompareResult", () => { // added by Lumen (Stage 4A compare typing)
  it("rejects invalid payload", () => { // added by Lumen (Stage 4A compare typing)
    const result = prepareCompareResult({ ...valid, aDob: "not-a-date" }); // added by Lumen (Stage 4A compare typing)
    expect(result.ok).toBe(false); // added by Lumen (Stage 4A compare typing)
  });

  it("returns a compatibility report for valid input", () => { // added by Lumen (Stage 4A compare typing)
    const result = prepareCompareResult(valid); // added by Lumen (Stage 4A compare typing)
    expect(result.ok).toBe(true); // added by Lumen (Stage 4A compare typing)
    if (result.ok) { // added by Lumen (Stage 4A compare typing)
      expect(result.value.left.fullName).toBe("Alex"); // added by Lumen (Stage 4A compare typing)
      expect(result.value.right.fullName).toBe("Blake"); // added by Lumen (Stage 4A compare typing)
      expect(result.value.narrative).toContain("Compatibility Reading"); // added by Lumen (Stage 4A compare typing)
    }
  });
});
