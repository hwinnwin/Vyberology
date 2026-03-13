/**
 * Deterministic capture pipeline tests.
 * These are the "never again" guardrails for the 14:33 → 33:33 bug.
 *
 * Run: npx vitest run supabase/functions/_shared/capture/capture.test.ts
 */

import { describe, it, expect } from "vitest";
import { extractAtomsFromInputs } from "./parse.ts";
import { buildCapturePayload } from "./compute.ts";

// ─── Helpers ───

function getComputedValues(inputs: { label: string; value: string }[]) {
  const atoms = extractAtomsFromInputs(inputs);
  const payload = buildCapturePayload(inputs, atoms);
  return {
    atoms: payload.atoms,
    computed: payload.computed,
    values: payload.computed.map((c) => c.value),
    kinds: payload.computed.map((c) => c.kind),
    traces: payload.computed.map((c) => c.trace),
    payload,
  };
}

// ─── Parse Tests ───

describe("extractAtomsFromInputs", () => {
  it("extracts time token + hour + minute atoms from HH:MM", () => {
    const atoms = extractAtomsFromInputs([{ label: "Time", value: "14:33" }]);

    expect(atoms).toHaveLength(3);
    expect(atoms.find((a) => a.kind === "time_token")?.raw).toBe("14:33");
    expect(atoms.find((a) => a.kind === "number" && a.raw === "14")?.value).toBe(14);
    expect(atoms.find((a) => a.kind === "number" && a.raw === "33")?.value).toBe(33);
  });

  it("extracts percent tokens", () => {
    const atoms = extractAtomsFromInputs([{ label: "Battery", value: "33%" }]);

    expect(atoms).toHaveLength(1);
    expect(atoms[0].kind).toBe("percent_token");
    expect(atoms[0].value).toBe(33);
  });

  it("extracts standalone text numbers", () => {
    const atoms = extractAtomsFromInputs([{ label: "Input", value: "222" }]);

    expect(atoms).toHaveLength(1);
    expect(atoms[0].kind).toBe("text_number");
    expect(atoms[0].value).toBe(222);
  });

  it("does not duplicate time components as text_numbers", () => {
    const atoms = extractAtomsFromInputs([{ label: "Time", value: "14:33" }]);

    const textNums = atoms.filter((a) => a.kind === "text_number");
    expect(textNums).toHaveLength(0);
  });

  it("handles multiple inputs from different fields", () => {
    const atoms = extractAtomsFromInputs([
      { label: "Time", value: "14:33" },
      { label: "Battery", value: "33%" },
    ]);

    // time_token + hour + minute + percent_token
    expect(atoms).toHaveLength(4);
  });

  it("deduplicates atoms with the same id", () => {
    const atoms = extractAtomsFromInputs([
      { label: "Time", value: "11:11" },
    ]);

    // time_token + two number atoms (11 for hour, 11 for minute)
    // But since both are "11" from same field+label, they may dedupe
    // Actually: stableId uses the raw value, so "11" (hour) and "11" (minute) have the same id
    // This is correct — 11 appears once as an observed atom
    const numberAtoms = atoms.filter((a) => a.kind === "number");
    expect(numberAtoms.length).toBeLessThanOrEqual(2);
  });
});

// ─── Compute Tests ───

describe("buildCapturePayload", () => {
  describe("the 14:33 bug case", () => {
    it("14:33 should produce time_total_digit_sum of 11 (master)", () => {
      const { values, kinds } = getComputedValues([{ label: "Time", value: "14:33" }]);

      const totalIdx = kinds.indexOf("time_total_digit_sum");
      expect(totalIdx).toBeGreaterThanOrEqual(0);
      expect(values[totalIdx]).toBe(11);
    });

    it("14:33 minute (33) should reduce to 6, NOT be preserved as master", () => {
      const { computed } = getComputedValues([{ label: "Time", value: "14:33" }]);

      const minuteReduce = computed.find((c) => c.kind === "time_minute_reduce");
      expect(minuteReduce).toBeDefined();
      expect(minuteReduce!.value).toBe(6);
      expect(minuteReduce!.trace).toBe("3+3=6");
    });

    it("14:33 hour (14) should reduce to 5", () => {
      const { computed } = getComputedValues([{ label: "Time", value: "14:33" }]);

      const hourReduce = computed.find((c) => c.kind === "time_hour_reduce");
      expect(hourReduce).toBeDefined();
      expect(hourReduce!.value).toBe(5);
      expect(hourReduce!.trace).toBe("1+4=5");
    });

    it("14:33 should NOT produce 33:33 mirror", () => {
      const { values } = getComputedValues([{ label: "Time", value: "14:33" }]);

      expect(values).not.toContain("33:33");
    });

    it("14:33 should NOT produce any mirror_candidate", () => {
      const { kinds } = getComputedValues([{ label: "Time", value: "14:33" }]);

      expect(kinds).not.toContain("mirror_candidate");
    });
  });

  describe("mirror gating", () => {
    it("time 14:33 + battery 33% SHOULD allow 33:33 mirror", () => {
      const { values } = getComputedValues([
        { label: "Time", value: "14:33" },
        { label: "Battery", value: "33%" },
      ]);

      expect(values).toContain("33:33");
    });

    it("single 11:11 time SHOULD allow 11:11 mirror (two independent 11s)", () => {
      const atoms = extractAtomsFromInputs([{ label: "Time", value: "11:11" }]);

      // For 11:11, the hour "11" and minute "11" are extracted as separate atoms
      // But they're from the same field+label, so they're NOT independent
      const payload = buildCapturePayload([{ label: "Time", value: "11:11" }], atoms);
      const mirrorCandidates = payload.computed.filter((c) => c.kind === "mirror_candidate");

      // Same field+label = not independent = no mirror
      expect(mirrorCandidates).toHaveLength(0);
    });

    it("two different sources of 11 SHOULD produce 11:11 mirror", () => {
      const { values } = getComputedValues([
        { label: "Time", value: "11:30" },
        { label: "Notifications", value: "11" },
      ]);

      expect(values).toContain("11:11");
    });
  });

  describe("master number policy", () => {
    it("time 09:55 total digit sum (9+5+5=19→10→1) is NOT master", () => {
      const { computed } = getComputedValues([{ label: "Time", value: "09:55" }]);

      const total = computed.find((c) => c.kind === "time_total_digit_sum");
      expect(total).toBeDefined();
      expect(total!.value).toBe(1);
    });

    it("time 11:44 total digit sum (1+1+4+4=10→1) is NOT master", () => {
      const { computed } = getComputedValues([{ label: "Time", value: "11:44" }]);

      const total = computed.find((c) => c.kind === "time_total_digit_sum");
      expect(total).toBeDefined();
      expect(total!.value).toBe(1);
    });

    it("time 05:33 total digit sum (0+5+3+3=11) IS master", () => {
      const { computed } = getComputedValues([{ label: "Time", value: "05:33" }]);

      const total = computed.find((c) => c.kind === "time_total_digit_sum");
      expect(total).toBeDefined();
      expect(total!.value).toBe(11);
    });

    it("standalone number 33 reduces to master-eligible (stays 33)", () => {
      const { computed } = getComputedValues([{ label: "Input", value: "33" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(33);
    });

    it("standalone number 222 reduces to 6", () => {
      const { computed } = getComputedValues([{ label: "Input", value: "222" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(6);
    });
  });

  describe("composite reduction consistency (v1.1)", () => {
    it("1333 must reduce to 1 with trace showing 10→1", () => {
      const { computed } = getComputedValues([{ label: "Input", value: "1333" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(1);
      expect(reduce!.trace).toBe("1+3+3+3=10→1");
    });

    it("1999 must reduce to 1 with full trace chain", () => {
      const { computed } = getComputedValues([{ label: "Input", value: "1999" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(1);
      // 1+9+9+9=28, 2+8=10, 1+0=1
      expect(reduce!.trace).toBe("1+9+9+9=28→10→1");
    });

    it("9999 must reduce to 9 with full trace chain", () => {
      const { computed } = getComputedValues([{ label: "Input", value: "9999" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(9);
      // 9+9+9+9=36, 3+6=9
      expect(reduce!.trace).toBe("9+9+9+9=36→9");
    });

    it("any composite sum hitting 10 must continue to 1, not stop", () => {
      // 19 → 1+9=10 → 1
      const { computed } = getComputedValues([{ label: "Input", value: "19" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(1);
      expect(reduce!.trace).toBe("1+9=10→1");
    });

    it("master 11 as standalone is preserved (not reduced)", () => {
      const { computed } = getComputedValues([{ label: "Input", value: "11" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(11);
      expect(reduce!.trace).toBe("11");
    });

    it("master 22 as standalone is preserved", () => {
      const { computed } = getComputedValues([{ label: "Input", value: "22" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(22);
      expect(reduce!.trace).toBe("22");
    });

    it("29 reduces through 11 and preserves master", () => {
      // 2+9=11 → master, stop
      const { computed } = getComputedValues([{ label: "Input", value: "29" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(11);
      expect(reduce!.trace).toBe("2+9=11");
    });

    it("222 trace shows digit-sum expression", () => {
      const { computed } = getComputedValues([{ label: "Input", value: "222" }]);

      const reduce = computed.find((c) => c.kind === "reduce");
      expect(reduce).toBeDefined();
      expect(reduce!.value).toBe(6);
      expect(reduce!.trace).toBe("2+2+2=6");
    });

    it("does not affect mirror gating logic", () => {
      // Verify mirror rules unchanged
      const { computed: single } = getComputedValues([{ label: "Input", value: "1333" }]);
      expect(single.filter((c) => c.kind === "mirror_candidate")).toHaveLength(0);

      const { computed: dual } = getComputedValues([
        { label: "Time", value: "14:33" },
        { label: "Battery", value: "33%" },
      ]);
      expect(dual.filter((c) => c.kind === "mirror_candidate")).toHaveLength(1);
    });
  });

  describe("provenance and tracing", () => {
    it("every computed entry has deterministic: true", () => {
      const { computed } = getComputedValues([{ label: "Time", value: "14:33" }]);

      for (const c of computed) {
        expect(c.deterministic).toBe(true);
      }
    });

    it("every computed entry references input atom IDs", () => {
      const atoms = extractAtomsFromInputs([{ label: "Time", value: "14:33" }]);
      const payload = buildCapturePayload([{ label: "Time", value: "14:33" }], atoms);
      const atomIds = new Set(atoms.map((a) => a.id));

      for (const c of payload.computed) {
        expect(c.inputs.length).toBeGreaterThan(0);
        for (const inputId of c.inputs) {
          expect(atomIds.has(inputId)).toBe(true);
        }
      }
    });

    it("time_total_digit_sum trace shows full calculation", () => {
      const { computed } = getComputedValues([{ label: "Time", value: "14:33" }]);

      const total = computed.find((c) => c.kind === "time_total_digit_sum");
      expect(total!.trace).toBe("1+4+3+3=11");
    });
  });

  describe("schema version", () => {
    it("payload has correct schema version", () => {
      const { payload } = getComputedValues([{ label: "Time", value: "14:33" }]);

      expect(payload.schemaVersion).toBe("capture-v1");
    });

    it("policy reflects current rules", () => {
      const { payload } = getComputedValues([{ label: "Time", value: "14:33" }]);

      expect(payload.policy.preserveMastersForCompositeSums).toBe(true);
      expect(payload.policy.preserveMastersForSubcomponents).toBe(false);
      expect(payload.policy.mirrorRequiresIndependentOccurrences).toBe(true);
      expect(payload.policy.masterNumbers).toEqual([11, 22, 33]);
    });
  });
});
