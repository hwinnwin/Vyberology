/**
 * Volume 2 Reading Composer
 * Main composition logic
 */

import type { ReadingDataV1, ComposedReadingV2 } from '@vyberology/types';
import {
  generateMarkerTitle,
  generateCoreEquationTone,
  generateEssence,
  generateIntention,
  generateReflectionKey,
  generateChakraResonance,
} from './templates.js';

const VERSION = '2.0.0';

/**
 * Compose complete narrative reading from engine data
 *
 * @param engine - ReadingDataV1 from Volume 1 core engine
 * @returns ComposedReadingV2 with narrative blocks and metadata
 *
 * @example
 * const engine: ReadingDataV1 = buildEngine(input);
 * const composed = composeReading(engine);
 * console.log(composed.markerTitle); // "Marker 3 – Stabilized Momentum"
 * console.log(composed.essence); // "Creative power flows through you..."
 */
export function composeReading(engine: ReadingDataV1): ComposedReadingV2 {
  return {
    markerTitle: generateMarkerTitle(engine),
    coreEquationTone: generateCoreEquationTone(engine),
    elementalAlignment: engine.elements,
    chakraFocus: engine.chakras,
    chakraResonance: generateChakraResonance(engine),
    essence: generateEssence(engine),
    intention: generateIntention(engine),
    reflectionKey: generateReflectionKey(engine),
    meta: {
      engine,
      version: VERSION,
    },
  };
}
