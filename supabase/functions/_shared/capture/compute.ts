/**
 * Deterministic compute step for capture pipeline.
 * Takes observed atoms and produces computed numbers with full provenance.
 * Enforces: sub-components reduce to single digit, only composite sums
 * preserve master numbers, mirrors require 2+ independent occurrences.
 */

import type {
  Atom,
  CaptureDeterministicPayload,
  ComputedNumber,
} from "../vybe-schema.ts";
import { VYBE_SCHEMA_VERSION } from "../vybe-schema.ts";

const MASTER_NUMBERS = [11, 22, 33];

function isMaster(n: number): boolean {
  return MASTER_NUMBERS.includes(n);
}

function sumDigits(n: number): number {
  return String(Math.abs(n))
    .split("")
    .reduce((a, c) => a + Number(c), 0);
}

function reduceToSingleDigit(n: number): number {
  let v = n;
  while (v > 9) v = sumDigits(v);
  return v;
}

function reduceMasterEligible(n: number): number {
  let v = n;
  while (v > 9 && !isMaster(v)) v = sumDigits(v);
  return v;
}

/**
 * Reduces a number with full trace chain showing every intermediate step.
 * For standalone numbers: shows digit-sum expression at first step, then arrows.
 * e.g. 1333 → "1+3+3+3=10→1", 33 → "33" (master, no reduction needed)
 */
function reduceMasterEligibleWithTrace(n: number): { value: number; trace: string } {
  if (n <= 9) return { value: n, trace: `${n}` };
  if (isMaster(n)) return { value: n, trace: `${n}` };

  // First step: show digit-sum expression
  const digits = String(n).split("").map(Number);
  let total = digits.reduce((a, b) => a + b, 0);
  let trace = `${digits.join("+")}=${total}`;

  // Continue reducing until single digit or master
  while (total > 9 && !isMaster(total)) {
    const next = sumDigits(total);
    trace += `→${next}`;
    total = next;
  }

  return { value: total, trace };
}

function makeComputedId(
  kind: ComputedNumber["kind"],
  value: number | string,
  inputs: string[],
): string {
  return ["computed", kind, String(value), ...inputs].join("|");
}

function buildComputed(
  kind: ComputedNumber["kind"],
  value: number | string,
  trace: string,
  inputs: string[],
  confidence: ComputedNumber["confidence"] = "high",
): ComputedNumber {
  return {
    id: makeComputedId(kind, value, inputs),
    source: "computed",
    kind,
    value,
    trace,
    inputs,
    confidence,
    deterministic: true,
  };
}

export function buildCapturePayload(
  inputs: { label: string; value: string }[],
  atoms: Atom[],
): CaptureDeterministicPayload {
  const computed: ComputedNumber[] = [];

  // Track which atoms are time sub-components and whether they're hour or minute
  const timeTokens = atoms.filter((a) => a.kind === "time_token");
  const timeSubRole = new Map<string, "hour" | "minute">();
  for (const t of timeTokens) {
    const [hh, mm] = t.raw.split(":");
    const siblings = atoms.filter(
      (a) =>
        a.kind === "number" &&
        a.field === t.field &&
        a.label === t.label,
    );
    for (const s of siblings) {
      if (s.raw === hh) timeSubRole.set(s.id, "hour");
      else if (s.raw === mm) timeSubRole.set(s.id, "minute");
    }
  }

  // A) Reduce all number/text_number/percent_token atoms
  for (const a of atoms) {
    if (
      (a.kind === "number" ||
        a.kind === "text_number" ||
        a.kind === "percent_token") &&
      typeof a.value === "number"
    ) {
      const role = timeSubRole.get(a.id);

      if (role) {
        // Sub-components always reduce to single digit, with digit-sum trace
        const reduced = reduceToSingleDigit(a.value);
        const kind: ComputedNumber["kind"] =
          role === "hour" ? "time_hour_reduce" : "time_minute_reduce";
        // Build trace: single digits stay as-is, multi-digit shows expression
        let trace: string;
        if (a.value <= 9) {
          trace = `${a.value}`;
        } else {
          const digits = String(a.value).split("").map(Number);
          trace = `${digits.join("+")}=${reduced}`;
        }
        computed.push(
          buildComputed(kind, reduced, trace, [a.id]),
        );
      } else {
        // Standalone numbers: master-eligible, with full trace chain
        const { value: reduced, trace } = reduceMasterEligibleWithTrace(a.value);
        computed.push(buildComputed("reduce", reduced, trace, [a.id]));
      }
    }
  }

  // B) Composite time digit sum: sum all digits in the time token, preserve masters
  for (const t of timeTokens) {
    const digits = t.raw.replace(":", "").split("").map(Number);
    const digitExpr = digits.join("+");
    let total = digits.reduce((a, b) => a + b, 0);
    let trace = `${digitExpr}=${total}`;

    // Reduce further if needed, preserving masters
    while (total > 9 && !isMaster(total)) {
      const next = sumDigits(total);
      trace += `→${next}`;
      total = next;
    }

    computed.push(
      buildComputed("time_total_digit_sum", total, trace, [t.id]),
    );
  }

  // C) Mirror gating: only allow if same numeric value appears in 2+ independent sources
  const numericAtoms = atoms.filter(
    (a): a is Atom & { value: number } => typeof a.value === "number",
  );
  const byValue = new Map<number, Atom[]>();
  for (const a of numericAtoms) {
    const list = byValue.get(a.value!) ?? [];
    list.push(a);
    byValue.set(a.value!, list);
  }

  for (const master of MASTER_NUMBERS) {
    const list = byValue.get(master) ?? [];
    // Independent = unique (field, label) pairs
    const uniqueSources = new Set(
      list.map((x) => `${x.field}:${x.label ?? ""}`),
    );
    if (uniqueSources.size >= 2) {
      computed.push(
        buildComputed(
          "mirror_candidate",
          `${master}:${master}`,
          `mirror: ${uniqueSources.size} independent occurrences of ${master}`,
          list.map((x) => x.id),
        ),
      );
    }
  }

  return {
    schemaVersion: VYBE_SCHEMA_VERSION,
    atoms,
    computed,
    policy: {
      preserveMastersForCompositeSums: true,
      preserveMastersForSubcomponents: false,
      allowMirrorPatterns: true,
      mirrorRequiresIndependentOccurrences: true,
      masterNumbers: MASTER_NUMBERS,
    },
  };
}
