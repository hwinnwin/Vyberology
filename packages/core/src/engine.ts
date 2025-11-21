/**
 * Volume 1 Reading Engine
 * Main pipeline: input → extract → calculate → map → trace
 */

import type { ReadingInput, ReadingDataV1 } from '@vyberology/types';
import { extractNumbers } from './extract.js';
import { fullSum } from './fullsum.js';
import { mapElements } from './elements.js';
import { mapChakras } from './chakras.js';

/**
 * Build complete ReadingDataV1 from input
 * This is the main Volume 1 engine pipeline
 *
 * @param input - ReadingInput with text/image data
 * @returns Complete ReadingDataV1 with tokens, sums, elements, chakras, phase, and trace
 *
 * @example
 * const input: ReadingInput = {
 *   sourceType: 'text',
 *   rawText: '10:24 • 67% • 144 likes',
 *   metadata: { context: 'Instagram screenshot', timestamp: '2025-11-21T10:24:00Z' }
 * };
 * const reading = buildEngine(input);
 * console.log(reading.sums.reduced); // 3
 * console.log(reading.elements); // ['🜁 Air', '🜃 Earth']
 */
export function buildEngine(input: ReadingInput): ReadingDataV1 {
  const trace: Record<string, unknown> = {};

  // Step 1: Extract numbers from text
  const sourceText = input.sourceType === 'image' ? input.ocrText : input.rawText;

  if (!sourceText) {
    throw new Error('No text provided for reading generation');
  }

  trace.sourceText = sourceText;
  trace.sourceType = input.sourceType;

  const tokens = extractNumbers(sourceText);
  trace.extractedTokens = tokens;

  if (tokens.length === 0) {
    throw new Error('No numbers found in input text');
  }

  // Step 2: Calculate full-sum numerology
  const values = tokens.map(t => t.value);
  const sums = fullSum(values);
  trace.fullSumCalculation = {
    values,
    ...sums,
  };

  // Step 3: Map elements
  const context = input.metadata?.context || '';
  const elements = mapElements({ tokens, sums }, context);
  trace.elementMapping = {
    context,
    elements,
  };

  // Step 4: Map chakras
  const chakras = mapChakras({ tokens, sums }, context);
  trace.chakraMapping = {
    context,
    chakras,
  };

  // Step 5: Determine phase (Volume 1 default)
  const phase = {
    volume: 1 as const,
    cycle: undefined,
    marker: undefined,
  };

  trace.phaseAssignment = phase;

  // Return complete ReadingDataV1
  return {
    tokens,
    sums,
    elements,
    chakras,
    phase,
    trace,
  };
}
