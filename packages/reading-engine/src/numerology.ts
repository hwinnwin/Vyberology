/**
 * Numerology utility functions
 */

export type NumValue = {
  raw: number;
  value: number;
  isMaster: boolean;
};

/**
 * Sum all digits in a number
 */
export function sumDigits(n: number): number {
  let s = 0;
  for (const ch of String(n)) {
    if (ch >= '0' && ch <= '9') {
      s += Number(ch);
    }
  }
  return s;
}

/**
 * Check if a number is a master number (11, 22, 33, 44)
 */
export function isMasterNumber(n: number): boolean {
  return n === 11 || n === 22 || n === 33 || n === 44;
}

/**
 * Reduce a number to single digit (1-9) or master number (11, 22, 33, 44)
 *
 * @param n - Number to reduce
 * @param preserveMastersEarly - If true, preserve master numbers as soon as they appear
 * @returns Reduced number (1-9 or 11, 22, 33, 44)
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

/**
 * Create a NumValue object with raw and reduced values
 */
export function makeNumValue(raw: number, preserveMastersEarly = false): NumValue {
  const value = reduceNumber(raw, preserveMastersEarly);
  return { raw, value, isMaster: isMasterNumber(value) };
}
