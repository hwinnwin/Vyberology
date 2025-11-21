/**
 * Elemental mapping logic
 * Maps numeric patterns to Fire, Air, Earth, Water based on deterministic rules
 */

import type { ElementTag, NumberToken, ReadingDataV1 } from '@vyberology/types';

/**
 * Context keywords that influence elemental interpretation
 */
const ELEMENT_KEYWORDS = {
  fire: ['action', 'drive', 'passion', 'energy', 'power', 'intensity', 'momentum'],
  air: ['time', 'thought', 'communication', 'clarity', 'perspective', 'mental'],
  earth: ['money', 'material', 'physical', 'practical', 'stable', 'grounded', 'body'],
  water: ['emotion', 'flow', 'feeling', 'intuition', 'fluid', 'deep', 'heart'],
} as const;

/**
 * Check if text contains keywords for a specific element
 */
function hasElementKeywords(text: string, element: keyof typeof ELEMENT_KEYWORDS): boolean {
  const lowerText = text.toLowerCase();
  return ELEMENT_KEYWORDS[element].some(keyword => lowerText.includes(keyword));
}

/**
 * Count occurrences of specific digits in tokens
 */
function countDigits(tokens: NumberToken[], digits: number[]): number {
  return tokens.reduce((count, token) => {
    const digitStr = token.value.toString();
    return count + digits.reduce((sum, digit) => {
      return sum + (digitStr.split(String(digit)).length - 1);
    }, 0);
  }, 0);
}

/**
 * Map reading data to elemental alignments
 * Uses deterministic rules based on:
 * - Number patterns (digit frequency)
 * - Reduced sum values
 * - Master numbers
 * - Context keywords
 *
 * Rules (applied in order, multiple elements possible):
 * 1. Fire: Master 11/22/33 OR reduced 1/9 OR action keywords
 * 2. Air: Many 1s/3s OR time patterns (colons) OR mental keywords
 * 3. Earth: Reduced 4/8 OR many 4s/8s OR material keywords
 * 4. Water: Reduced 2/6/9 OR many 2s/6s/9s OR emotional keywords
 *
 * @param data - Partial ReadingDataV1 with tokens and sums
 * @param context - Optional context string for keyword analysis
 * @returns Array of ElementTag symbols
 */
export function mapElements(
  data: Pick<ReadingDataV1, 'tokens' | 'sums'>,
  context?: string
): ElementTag[] {
  const elements = new Set<ElementTag>();
  const { tokens, sums } = data;
  const contextText = context || '';

  // Rule 1: Fire - Master numbers, 1/9, action keywords
  if (sums.master || [1, 9].includes(sums.reduced)) {
    elements.add('🜂 Fire');
  }
  if (hasElementKeywords(contextText, 'fire')) {
    elements.add('🜂 Fire');
  }

  // Rule 2: Air - Many 1s/3s, time patterns, mental keywords
  const onesAndThrees = countDigits(tokens, [1, 3]);
  const hasTimePattern = tokens.some(t => t.raw.includes(':'));

  if (onesAndThrees >= 3 || hasTimePattern) {
    elements.add('🜁 Air');
  }
  if (hasElementKeywords(contextText, 'air')) {
    elements.add('🜁 Air');
  }

  // Rule 3: Earth - 4/8 reduced, many 4s/8s, material keywords
  const foursAndEights = countDigits(tokens, [4, 8]);

  if ([4, 8].includes(sums.reduced) || foursAndEights >= 2) {
    elements.add('🜃 Earth');
  }
  if (hasElementKeywords(contextText, 'earth')) {
    elements.add('🜃 Earth');
  }

  // Rule 4: Water - 2/6/9 reduced, many 2s/6s/9s, emotional keywords
  const twosAndSixes = countDigits(tokens, [2, 6, 9]);

  if ([2, 6].includes(sums.reduced) || twosAndSixes >= 2) {
    elements.add('🜄 Water');
  }
  if (hasElementKeywords(contextText, 'water')) {
    elements.add('🜄 Water');
  }

  // Default: If no elements matched, assign based on reduced number
  if (elements.size === 0) {
    const defaultMap: Record<number, ElementTag> = {
      1: '🜂 Fire',
      2: '🜄 Water',
      3: '🜁 Air',
      4: '🜃 Earth',
      5: '🜁 Air',
      6: '🜄 Water',
      7: '🜁 Air',
      8: '🜃 Earth',
      9: '🜄 Water',
    };

    const defaultElement = defaultMap[sums.reduced];
    if (defaultElement) {
      elements.add(defaultElement);
    }
  }

  return Array.from(elements);
}
