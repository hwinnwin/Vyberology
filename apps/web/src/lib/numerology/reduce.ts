export type NumValue = { raw: number; value: number; isMaster: boolean };

export function sumDigits(n: number): number {
  let s = 0;
  for (const ch of String(n)) if (ch >= "0" && ch <= "9") s += Number(ch);
  return s;
}

export function isMasterNumber(n: number): boolean {
  return n === 11 || n === 22 || n === 33;
}

/**
 * Modern full-sum reduction:
 * - Preserve master numbers (11/22/33) at the final step.
 * - If you want to preserve them as soon as they appear, pass preserveMastersEarly=true.
 */
export function reduceNumber(n: number, preserveMastersEarly = false): number {
  let total = n;

  while (total > 9) {
    if (isMasterNumber(total) && (preserveMastersEarly || String(total).length <= 2)) {
      return total;
    }
    const next = sumDigits(total);
    if (next === total) break;
    total = next;
  }
  return total;
}

export function makeNumValue(raw: number, preserveMastersEarly = false): NumValue {
  const value = reduceNumber(raw, preserveMastersEarly);
  return { raw, value, isMaster: isMasterNumber(value) };
}
