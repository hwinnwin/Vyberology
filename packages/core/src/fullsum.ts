/**
 * Full-sum numerology with master number preservation
 * Implements traditional numerology reduction: 11, 22, 33 are preserved
 */

import type { MasterNumber } from '@vyberology/types';

export interface FullSumResult {
  fullSum: number;
  reduced: number;
  master?: MasterNumber;
}

const MASTER_NUMBERS = [11, 22, 33] as const;

/**
 * Check if a number is a master number (11, 22, 33)
 */
function isMasterNumber(n: number): n is MasterNumber {
  return MASTER_NUMBERS.includes(n as MasterNumber);
}

/**
 * Reduce a number to single digit, preserving master numbers
 * @internal
 */
function reduce(n: number): { reduced: number; master?: MasterNumber } {
  // If already a master number, preserve it
  if (isMasterNumber(n)) {
    return { reduced: n, master: n };
  }

  // If single digit, done
  if (n < 10) {
    return { reduced: n };
  }

  // Sum the digits
  const sum = n
    .toString()
    .split('')
    .map(Number)
    .reduce((acc, digit) => acc + digit, 0);

  // Check if the sum is a master number
  if (isMasterNumber(sum)) {
    return { reduced: sum, master: sum };
  }

  // Recurse if still multi-digit
  if (sum >= 10) {
    return reduce(sum);
  }

  return { reduced: sum };
}

/**
 * Calculate full-sum numerology from array of numbers
 * Concatenates all digits, then reduces while preserving master numbers
 *
 * @param values - Array of numeric values to process
 * @returns FullSumResult with fullSum, reduced value, and optional master number
 *
 * @example
 * fullSum([10, 24, 67, 144])
 * // Concatenate: "10" + "24" + "67" + "144" = "1024671144"
 * // Sum digits: 1+0+2+4+6+7+1+1+4+4 = 30
 * // Reduce: 3+0 = 3
 * // Returns: { fullSum: 30, reduced: 3 }
 *
 * @example
 * fullSum([1, 1, 1, 1, 4, 4])
 * // Concatenate: "111144"
 * // Sum: 1+1+1+1+4+4 = 12
 * // Reduce: 1+2 = 3
 * // Returns: { fullSum: 12, reduced: 3 }
 *
 * @example
 * fullSum([9, 2])
 * // Concatenate: "92"
 * // Sum: 9+2 = 11 (master number!)
 * // Returns: { fullSum: 11, reduced: 11, master: 11 }
 */
export function fullSum(values: number[]): FullSumResult {
  if (values.length === 0) {
    return { fullSum: 0, reduced: 0 };
  }

  // Concatenate all numbers as strings, then split into individual digits
  const allDigits = values
    .map(v => Math.abs(Math.floor(v)).toString())
    .join('')
    .split('')
    .map(Number);

  // Sum all digits
  const total = allDigits.reduce((acc, digit) => acc + digit, 0);

  // Reduce while preserving master numbers
  const result = reduce(total);

  return {
    fullSum: total,
    ...result,
  };
}
