/**
 * Volume 2 Composer Templates
 * Deterministic narrative generation from ReadingDataV1
 */

import type { ReadingDataV1, ElementTag, ChakraTag } from '@vyberology/types';

/**
 * Marker titles based on reduced number
 */
const MARKER_TITLES: Record<number, string> = {
  1: 'Marker 1 – New Beginnings',
  2: 'Marker 2 – Receptive Flow',
  3: 'Marker 3 – Stabilized Momentum',
  4: 'Marker 4 – Foundation Building',
  5: 'Marker 5 – Dynamic Change',
  6: 'Marker 6 – Harmonic Balance',
  7: 'Marker 7 – Seeking Clarity',
  8: 'Marker 8 – Material Mastery',
  9: 'Marker 9 – Completion Cycle',
  11: 'Marker 11 – Gateway Awakening',
  22: 'Marker 22 – Master Builder',
  33: 'Marker 33 – Universal Teacher',
};

/**
 * Core equation tones based on reduced number and elements
 */
const CORE_EQUATIONS: Record<number, string> = {
  1: 'Initiation × Clarity = Aligned Action',
  2: 'Receptivity × Balance = Harmonic Flow',
  3: 'Expression × Structure = Embodied Expansion',
  4: 'Foundation × Stability = Grounded Growth',
  5: 'Change × Freedom = Transformative Motion',
  6: 'Love × Responsibility = Compassionate Service',
  7: 'Wisdom × Reflection = Inner Knowing',
  8: 'Power × Material = Abundant Manifestation',
  9: 'Completion × Release = Transcendent Closure',
  11: 'Intuition × Illumination = Awakened Vision',
  22: 'Mastery × Structure = Monumental Creation',
  33: 'Love × Teaching = Universal Healing',
};

/**
 * Essence statements based on primary element and reduced number
 */
const ESSENCE_TEMPLATES: Record<string, Record<number, string>> = {
  '🜂 Fire': {
    1: 'You are standing at the threshold of initiation. The fire within calls for bold action.',
    3: 'Creative power flows through you. Express your truth with courage and clarity.',
    9: 'The cycle completes in flames of transformation. Release what no longer serves.',
  },
  '🜁 Air': {
    1: 'A fresh wind carries new perspectives. Clarity emerges from mental stillness.',
    3: 'Communication becomes your superpower. Speak your truth into being.',
    7: 'Wisdom arrives through quiet contemplation. Trust the insights that surface.',
  },
  '🜃 Earth': {
    4: 'Build your foundation stone by stone. Patience and presence create lasting structures.',
    8: 'Material mastery aligns with spiritual purpose. Abundance flows through grounded action.',
    2: 'Root deeply into receptive stillness. The earth supports your becoming.',
  },
  '🜄 Water': {
    2: 'Emotional currents guide you toward balance. Flow with what is.',
    6: 'Love becomes the organizing principle. Lead with compassion and care.',
    9: 'Deep waters cleanse and renew. Surrender to the cycle of completion.',
  },
};

/**
 * Intention statements based on chakra focus
 */
const INTENTION_TEMPLATES: Record<ChakraTag, string> = {
  'Root': 'Ground into safety. Trust the foundation beneath you.',
  'Sacral': 'Honor your creative power. Allow pleasure and play.',
  'Solar Plexus': 'Claim your will. Direct your energy with confidence.',
  'Heart': 'Open to love. Balance giving and receiving.',
  'Throat': 'Speak your truth. Express authentically.',
  'Third Eye': 'Trust your inner vision. Wisdom lives within.',
  'Crown': 'Connect to source. Remember your divine nature.',
};

/**
 * Reflection keys based on volume and marker
 */
const REFLECTION_KEYS: Record<number, string> = {
  1: 'What wants to begin through you?',
  2: 'Where are you being called to receive?',
  3: 'How can you express your truth more fully?',
  4: 'What foundation requires your attention?',
  5: 'What transformation is underway?',
  6: 'Where can you bring more balance and love?',
  7: 'What wisdom is seeking to emerge?',
  8: 'How can you embody abundance?',
  9: 'What is complete? What must be released?',
  11: 'What awakening is calling you forward?',
  22: 'What monumental work are you here to build?',
  33: 'How are you being called to serve and heal?',
};

/**
 * Generate marker title
 */
export function generateMarkerTitle(engine: ReadingDataV1): string {
  return MARKER_TITLES[engine.sums.reduced] || `Marker ${engine.sums.reduced}`;
}

/**
 * Generate core equation tone
 */
export function generateCoreEquationTone(engine: ReadingDataV1): string {
  return CORE_EQUATIONS[engine.sums.reduced] || 'Energy × Form = Embodied Frequency';
}

/**
 * Generate essence statement
 */
export function generateEssence(engine: ReadingDataV1): string {
  const primaryElement = engine.elements[0] || '🜁 Air';
  const elementEssences = ESSENCE_TEMPLATES[primaryElement] || {};

  // Try to find essence for this number + element combo
  if (elementEssences[engine.sums.reduced]) {
    return elementEssences[engine.sums.reduced];
  }

  // Fallback based on master numbers
  if (engine.sums.master === 11) {
    return 'You stand at a gateway of awakening. Intuition and illumination merge into vision.';
  }
  if (engine.sums.master === 22) {
    return 'You are a master builder. Your vision has the power to reshape reality.';
  }
  if (engine.sums.master === 33) {
    return 'Universal healing flows through you. You are called to teach and serve.';
  }

  // Generic fallback
  return `The frequency of ${engine.sums.reduced} activates within you. Patterns align, and purpose clarifies.`;
}

/**
 * Generate intention statement
 */
export function generateIntention(engine: ReadingDataV1): string {
  const primaryChakra = engine.chakras[0] || 'Heart';
  return INTENTION_TEMPLATES[primaryChakra] || 'Align with your highest frequency.';
}

/**
 * Generate reflection key
 */
export function generateReflectionKey(engine: ReadingDataV1): string {
  return REFLECTION_KEYS[engine.sums.reduced] || 'What is this moment asking of you?';
}

/**
 * Generate chakra resonance analysis
 */
export function generateChakraResonance(engine: ReadingDataV1): string {
  const chakras = engine.chakras;

  if (chakras.length === 0) {
    return 'Your energy centers are in a state of neutral equilibrium.';
  }

  if (chakras.length === 1) {
    const chakra = chakras[0];
    const analysis: Record<ChakraTag, string> = {
      'Root': 'Your Root chakra activates, calling you to ground deeply into safety and stability. This is a time to tend to your foundation—physical health, material security, and basic needs.',
      'Sacral': 'Your Sacral chakra glows with creative and emotional energy. Honor your desires, embrace pleasure, and allow your creative power to flow freely.',
      'Solar Plexus': 'Your Solar Plexus ignites with willpower and direction. This is your moment to claim your power, set clear intentions, and move forward with confidence.',
      'Heart': 'Your Heart chakra opens, inviting love, compassion, and connection. Balance giving and receiving, and lead with heart-centered wisdom.',
      'Throat': 'Your Throat chakra activates, urging authentic expression. Speak your truth, communicate clearly, and let your voice be heard.',
      'Third Eye': 'Your Third Eye awakens, enhancing intuition and inner vision. Trust the insights that arise and see beyond surface appearances.',
      'Crown': 'Your Crown chakra illuminates, connecting you to divine consciousness and universal wisdom. You are remembering your spiritual nature.',
    };
    return analysis[chakra];
  }

  // Multiple chakras
  const chakraNames = chakras.join(', ').replace(/, ([^,]*)$/, ' and $1');
  return `Multiple energy centers activate: ${chakraNames}. This creates a complex energetic signature that invites integration across different levels of being. Notice how these frequencies interact within you.`;
}
