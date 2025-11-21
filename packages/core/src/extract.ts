/**
 * Extract numbers from text input
 * Preserves order, position, and raw string representation
 */

import type { NumberToken } from '@vyberology/types';

/**
 * Extract all numbers from input text
 * Supports integers and decimals (e.g., "10:24", "67%", "3.14")
 *
 * @param text - Raw input text containing numbers
 * @returns Array of NumberToken objects with value, raw string, and index
 *
 * @example
 * extractNumbers("10:24 • 67% • 144 likes")
 * // Returns: [
 * //   { value: 10, raw: "10", index: 0 },
 * //   { value: 24, raw: "24", index: 1 },
 * //   { value: 67, raw: "67", index: 2 },
 * //   { value: 144, raw: "144", index: 3 }
 * // ]
 */
export function extractNumbers(text: string): NumberToken[] {
  const tokens: NumberToken[] = [];

  // Match integers and decimals
  const regex = /\d+(?:\.\d+)?/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const value = Number(raw);

    // Skip if conversion failed (shouldn't happen with our regex)
    if (isNaN(value)) continue;

    tokens.push({
      value,
      raw,
      index: index++,
    });
  }

  return tokens;
}
