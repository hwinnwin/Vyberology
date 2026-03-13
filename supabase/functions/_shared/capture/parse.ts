/**
 * Deterministic atom extraction from capture inputs.
 * Only creates atoms for values that are directly observed in the raw input.
 * No mirroring, no inference, no vibes.
 */

import type { Atom, ObservedField } from "../vybe-schema.ts";

function stableId(parts: string[]): string {
  return parts.join("|").toLowerCase();
}

function fieldFromLabel(label: string): ObservedField {
  const l = label.trim().toLowerCase();
  if (l.includes("time")) return "time";
  if (l.includes("battery")) return "battery";
  if (l.includes("notif")) return "notifications";
  if (l.includes("like")) return "likes";
  if (l.includes("comment")) return "comments";
  if (l.includes("step")) return "steps";
  if (l.includes("temp")) return "temperature";
  if (l.includes("date")) return "date";
  if (l.includes("input") || l.includes("text")) return "input";
  return "unknown";
}

export function extractAtomsFromInputs(
  inputs: { label: string; value: string }[],
): Atom[] {
  const atoms: Atom[] = [];

  for (const item of inputs) {
    const field = fieldFromLabel(item.label);
    const raw = String(item.value ?? "");

    // 1) Time token HH:MM (24h)
    const timeMatch = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (timeMatch) {
      const [token, hh, mm] = timeMatch;
      atoms.push({
        id: stableId([field, item.label, "time_token", token]),
        kind: "time_token",
        raw: token,
        field,
        label: item.label,
      });
      atoms.push({
        id: stableId([field, item.label, "number", hh]),
        kind: "number",
        raw: hh,
        value: Number(hh),
        field,
        label: item.label,
      });
      atoms.push({
        id: stableId([field, item.label, "number", mm]),
        kind: "number",
        raw: mm,
        value: Number(mm),
        field,
        label: item.label,
      });
    }

    // 2) Percent tokens like 33%
    for (const m of raw.matchAll(/\b(\d{1,3})%/g)) {
      const num = Number(m[1]);
      if (Number.isFinite(num)) {
        atoms.push({
          id: stableId([field, item.label, "percent_token", m[0]]),
          kind: "percent_token",
          raw: m[0],
          value: num,
          field,
          label: item.label,
        });
      }
    }

    // Collect percent-captured positions to avoid duplication
    const percentPositions = new Set<number>();
    for (const pm of raw.matchAll(/\b(\d{1,3})%/g)) {
      percentPositions.add(pm.index!);
    }

    // 3) Standalone numbers in text (avoid duplicating time components and percent tokens)
    for (const m of raw.matchAll(/\b\d+\b/g)) {
      const token = m[0];
      if (
        timeMatch &&
        (token === timeMatch[1] || token === timeMatch[2] || token === timeMatch[0].replace(":", ""))
      ) {
        continue;
      }
      // Skip if this number is part of a percent token
      if (percentPositions.has(m.index!)) {
        continue;
      }

      const num = Number(token);
      if (Number.isFinite(num)) {
        atoms.push({
          id: stableId([field, item.label, "text_number", token]),
          kind: "text_number",
          raw: token,
          value: num,
          field,
          label: item.label,
        });
      }
    }
  }

  // De-dupe by id
  const seen = new Set<string>();
  return atoms.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}
