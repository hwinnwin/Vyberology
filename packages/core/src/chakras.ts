/**
 * Chakra mapping logic
 * Maps numeric patterns to chakra energy centers based on deterministic rules
 */

import type { ChakraTag, NumberToken, ReadingDataV1 } from '@vyberology/types';

/**
 * Context keywords that influence chakra interpretation
 */
const CHAKRA_KEYWORDS = {
  root: ['survival', 'safety', 'security', 'grounded', 'foundation', 'basic'],
  sacral: ['creative', 'pleasure', 'sexuality', 'emotion', 'desire', 'passion'],
  solarPlexus: ['will', 'power', 'confidence', 'control', 'action', 'direction'],
  heart: ['love', 'compassion', 'connection', 'healing', 'relationships', 'balance'],
  throat: ['expression', 'communication', 'voice', 'truth', 'speak', 'authentic'],
  thirdEye: ['intuition', 'vision', 'insight', 'perception', 'wisdom', 'awareness'],
  crown: ['spiritual', 'consciousness', 'enlightenment', 'divine', 'unity', 'transcendent'],
} as const;

/**
 * Check if text contains keywords for a specific chakra
 */
function hasChakraKeywords(text: string, chakra: keyof typeof CHAKRA_KEYWORDS): boolean {
  const lowerText = text.toLowerCase();
  return CHAKRA_KEYWORDS[chakra].some(keyword => lowerText.includes(keyword));
}

/**
 * Count occurrences of specific digit in all tokens
 */
function countDigit(tokens: NumberToken[], digit: number): number {
  return tokens.reduce((count, token) => {
    const digitStr = token.value.toString();
    return count + (digitStr.split(String(digit)).length - 1);
  }, 0);
}

/**
 * Map reading data to chakra alignments
 * Uses deterministic rules based on:
 * - Reduced sum values (primary mapping)
 * - Master numbers (Crown emphasis)
 * - Digit patterns (frequency-based)
 * - Context keywords
 *
 * Primary mapping (by reduced number):
 * - Root (1): Reduced 1/4/8
 * - Sacral (2): Reduced 2/5
 * - Solar Plexus (3): Reduced 3
 * - Heart (4): Reduced 6/9
 * - Throat (5): Reduced 5
 * - Third Eye (6): Reduced 7
 * - Crown (7): Master numbers, repeated 1s
 *
 * @param data - Partial ReadingDataV1 with tokens and sums
 * @param context - Optional context string for keyword analysis
 * @returns Array of ChakraTag names
 */
export function mapChakras(
  data: Pick<ReadingDataV1, 'tokens' | 'sums'>,
  context?: string
): ChakraTag[] {
  const chakras = new Set<ChakraTag>();
  const { tokens, sums } = data;
  const contextText = context || '';

  // Primary mapping by reduced number
  const reducedMap: Record<number, ChakraTag> = {
    1: 'Root',
    2: 'Sacral',
    3: 'Solar Plexus',
    4: 'Root',
    5: 'Throat',
    6: 'Heart',
    7: 'Third Eye',
    8: 'Root',
    9: 'Heart',
  };

  const primaryChakra = reducedMap[sums.reduced];
  if (primaryChakra) {
    chakras.add(primaryChakra);
  }

  // Master numbers emphasize Crown
  if (sums.master) {
    chakras.add('Crown');
  }

  // Many 1s suggest Crown activation (awakening)
  const onesCount = countDigit(tokens, 1);
  if (onesCount >= 4) {
    chakras.add('Crown');
  }

  // Many 3s suggest Solar Plexus (will/power)
  const threesCount = countDigit(tokens, 3);
  if (threesCount >= 3) {
    chakras.add('Solar Plexus');
  }

  // Many 6s suggest Heart (love/harmony)
  const sixesCount = countDigit(tokens, 6);
  if (sixesCount >= 2) {
    chakras.add('Heart');
  }

  // Keyword-based additions
  if (hasChakraKeywords(contextText, 'root')) chakras.add('Root');
  if (hasChakraKeywords(contextText, 'sacral')) chakras.add('Sacral');
  if (hasChakraKeywords(contextText, 'solarPlexus')) chakras.add('Solar Plexus');
  if (hasChakraKeywords(contextText, 'heart')) chakras.add('Heart');
  if (hasChakraKeywords(contextText, 'throat')) chakras.add('Throat');
  if (hasChakraKeywords(contextText, 'thirdEye')) chakras.add('Third Eye');
  if (hasChakraKeywords(contextText, 'crown')) chakras.add('Crown');

  return Array.from(chakras);
}
