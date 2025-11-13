/**
 * Five-Number Oracle Pattern Synthesis
 *
 * Detects harmonic patterns across 5 numbers and generates
 * unified interpretations with actionable guidance.
 */

import { NumberMeaning, Element, Chakra, ELEMENT_EMOJI, CHAKRA_EMOJI } from './meaningBank';

export type HarmonicPattern =
  | 'build'        // Foundation → Action (4→11→8→5→22)
  | 'release'      // Completion → Freedom (9→7→5→3→1)
  | 'amplify'      // Signal → Expression (11→33→3→8→14)
  | 'balanced'     // Even distribution across elements/chakras
  | 'focused'      // Strong concentration in one energy
  | 'transition'   // Clear before/after shift
  | 'ascending'    // Rising momentum
  | 'descending'   // Releasing momentum
  | 'cyclical';    // Return to origin

export interface PatternAnalysis {
  type: HarmonicPattern;
  strength: number;           // 0-1: coherence score
  description: string;        // One-sentence pattern summary
  dominantElement: Element;
  dominantChakra: Chakra;
  synthesis: string;          // 2-3 sentence unified message
  actionSequence: string[];   // Ordered action steps (5 items)
}

/**
 * Analyze 5 numbers and detect harmonic pattern
 */
export function analyzePattern(meanings: NumberMeaning[]): PatternAnalysis {
  if (meanings.length !== 5) {
    throw new Error('Oracle requires exactly 5 numbers');
  }

  const numbers = meanings.map(m => m.number);
  const elements = meanings.map(m => m.element);
  const chakras = meanings.map(m => m.chakra);
  const actions = meanings.map(m => m.action);

  // Detect pattern type
  const patternType = detectPatternType(numbers, elements, chakras);

  // Calculate coherence strength
  const strength = calculateCoherence(elements, chakras);

  // Find dominant energies
  const dominantElement = findDominantElement(elements);
  const dominantChakra = findDominantChakra(chakras);

  // Generate synthesis message
  const synthesis = generateSynthesis(meanings, patternType, dominantElement, dominantChakra);

  // Build action sequence
  const actionSequence = actions;

  return {
    type: patternType,
    strength,
    description: getPatternDescription(patternType),
    dominantElement,
    dominantChakra,
    synthesis,
    actionSequence
  };
}

/**
 * Detect the harmonic pattern type
 */
function detectPatternType(
  numbers: number[],
  elements: Element[],
  chakras: Chakra[]
): HarmonicPattern {
  // Check for pre-defined signature patterns
  if (matchesBuildPattern(numbers)) return 'build';
  if (matchesReleasePattern(numbers)) return 'release';
  if (matchesAmplifyPattern(numbers)) return 'amplify';

  // Check for ascending/descending sequences
  if (isAscending(numbers)) return 'ascending';
  if (isDescending(numbers)) return 'descending';

  // Check for cyclical (first and last similar)
  if (isCyclical(numbers)) return 'cyclical';

  // Check for transition (clear shift in middle)
  if (hasTransition(elements, chakras)) return 'transition';

  // Check for focus vs balance
  const elementDiversity = new Set(elements).size;
  const chakraDiversity = new Set(chakras).size;

  if (elementDiversity <= 2 || chakraDiversity <= 2) {
    return 'focused';
  }

  if (elementDiversity >= 3 && chakraDiversity >= 4) {
    return 'balanced';
  }

  return 'balanced'; // Default
}

/**
 * Pattern matchers
 */
function matchesBuildPattern(numbers: number[]): boolean {
  // Build: Foundation → Signal → Power → Pivot → Platform
  // Example: 4→11→8→5→22 or similar structure energy
  const hasFoundation = numbers.some(n => [4, 40, 44].includes(n));
  const hasPower = numbers.some(n => [8, 80, 88].includes(n));
  const hasMaster = numbers.some(n => [11, 22, 33, 44].includes(n));

  return hasFoundation && (hasPower || hasMaster);
}

function matchesReleasePattern(numbers: number[]): boolean {
  // Release: Completion → Reflection → Freedom → Expression → Start
  // Example: 9→7→5→3→1 or similar completion energy
  const hasCompletion = numbers.some(n => [9, 90, 99].includes(n));
  const hasRelease = numbers.some(n => [5, 50, 55].includes(n));
  const hasNew = numbers.some(n => [1, 10].includes(n));

  return hasCompletion && (hasRelease || hasNew);
}

function matchesAmplifyPattern(numbers: number[]): boolean {
  // Amplify: Signal → Teach → Express → Power → Frequency
  // Example: 11→33→3→8→14 or similar amplification energy
  const hasSignal = numbers.some(n => [11, 17, 29].includes(n));
  const hasTeach = numbers.some(n => [33, 37, 70].includes(n));
  const hasExpress = numbers.some(n => [3, 30, 39].includes(n));

  return hasSignal && (hasTeach || hasExpress);
}

function isAscending(numbers: number[]): boolean {
  let ascending = 0;
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > numbers[i - 1]) ascending++;
  }
  return ascending >= 3; // Majority ascending
}

function isDescending(numbers: number[]): boolean {
  let descending = 0;
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] < numbers[i - 1]) descending++;
  }
  return descending >= 3; // Majority descending
}

function isCyclical(numbers: number[]): boolean {
  // First and last number have similar energy (within 5)
  const diff = Math.abs(numbers[0] - numbers[4]);
  return diff <= 5 || diff >= 90; // Close or wrapping around
}

function hasTransition(elements: Element[], chakras: Chakra[]): boolean {
  // Clear shift in energy between first half and second half
  const firstHalfElements = new Set(elements.slice(0, 3));
  const secondHalfElements = new Set(elements.slice(2, 5));

  const elementOverlap = [...firstHalfElements].filter(e =>
    secondHalfElements.has(e)
  ).length;

  // Less than 50% overlap = transition
  return elementOverlap <= 1;
}

/**
 * Calculate coherence strength (0-1)
 */
function calculateCoherence(elements: Element[], chakras: Chakra[]): number {
  let score = 0;

  // Element coherence (30%)
  const elementCounts = countOccurrences(elements);
  const maxElementCount = Math.max(...Object.values(elementCounts));
  const elementCoherence = maxElementCount / elements.length;
  score += elementCoherence * 0.3;

  // Chakra coherence (30%)
  const chakraCounts = countOccurrences(chakras);
  const maxChakraCount = Math.max(...Object.values(chakraCounts));
  const chakraCoherence = maxChakraCount / chakras.length;
  score += chakraCoherence * 0.3;

  // Diversity bonus (40%) - balanced patterns can be high strength too
  const elementDiversity = Object.keys(elementCounts).length;
  const chakraDiversity = Object.keys(chakraCounts).length;

  if (elementDiversity >= 3 && chakraDiversity >= 3) {
    // Balanced = strong
    score += 0.4;
  } else if (elementDiversity === 1 || chakraDiversity === 1) {
    // Focused = strong
    score += 0.4;
  } else {
    // Mixed = moderate
    score += 0.2;
  }

  return Math.min(score, 1.0);
}

/**
 * Find dominant element
 */
function findDominantElement(elements: Element[]): Element {
  const counts = countOccurrences(elements);
  return Object.entries(counts).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0] as Element;
}

/**
 * Find dominant chakra
 */
function findDominantChakra(chakras: Chakra[]): Chakra {
  const counts = countOccurrences(chakras);
  return Object.entries(counts).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0] as Chakra;
}

/**
 * Generate synthesis message
 */
function generateSynthesis(
  meanings: NumberMeaning[],
  pattern: HarmonicPattern,
  element: Element,
  chakra: Chakra
): string {
  const patternIntro = PATTERN_SYNTHESIS_TEMPLATES[pattern];
  const elementNote = `This pull leans ${ELEMENT_EMOJI[element]} ${element}`;
  const chakraNote = `${CHAKRA_EMOJI[chakra]} ${chakra} energy`;

  // Extract key themes
  const themes = meanings.flatMap(m => m.keywords).slice(0, 4).join(', ');

  return `${patternIntro} ${elementNote}, ${chakraNote}—${themes}. ${getPatternGuidance(pattern)}`;
}

/**
 * Pattern synthesis templates
 */
const PATTERN_SYNTHESIS_TEMPLATES: Record<HarmonicPattern, string> = {
  build: 'This is a Builder sequence: Anchor → Signal → Monetize → Test → Systemize.',
  release: 'This is a Release sequence: Complete → Reflect → Free → Express → Begin.',
  amplify: 'This is an Amplifier sequence: Receive → Teach → Create → Empower → Align.',
  balanced: 'This is a Balanced pull with diverse energies working in harmony.',
  focused: 'This is a Focused pull with concentrated energy in one domain.',
  transition: 'This is a Transition pull showing a clear shift from old to new.',
  ascending: 'This is an Ascending pull building momentum toward expansion.',
  descending: 'This is a Descending pull releasing and returning to foundation.',
  cyclical: 'This is a Cyclical pull completing one loop to begin another.'
};

/**
 * Pattern guidance
 */
function getPatternGuidance(pattern: HarmonicPattern): string {
  const guidance: Record<HarmonicPattern, string> = {
    build: 'Take one foundational action today, then systemize the win.',
    release: 'Complete one unfinished task, then begin something new.',
    amplify: 'Share your expertise publicly—teach what you know.',
    balanced: 'Honor all energies present; integrate, don\'t choose.',
    focused: 'Double down on this single frequency—go deep, not wide.',
    transition: 'Honor the ending, then step fully into what\'s next.',
    ascending: 'Ride the momentum—accelerate with intention.',
    descending: 'Return to foundation—ground before the next launch.',
    cyclical: 'Close the loop with gratitude, then restart wiser.'
  };

  return guidance[pattern];
}

/**
 * Get pattern description
 */
function getPatternDescription(pattern: HarmonicPattern): string {
  const descriptions: Record<HarmonicPattern, string> = {
    build: 'Foundation → Action: Building something to last',
    release: 'Completion → Freedom: Letting go to make space',
    amplify: 'Signal → Expression: Turning insight into impact',
    balanced: 'Diverse energies harmonizing across domains',
    focused: 'Concentrated power in a single direction',
    transition: 'Clear shift from one phase to another',
    ascending: 'Rising momentum toward expansion',
    descending: 'Releasing momentum toward foundation',
    cyclical: 'Completing one cycle to begin the next'
  };

  return descriptions[pattern];
}

/**
 * Utility: Count occurrences
 */
function countOccurrences<T extends string>(arr: T[]): Record<T, number> {
  return arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

/**
 * Export pattern templates for UI/content
 */
export const PATTERN_TEMPLATES = {
  build: {
    title: 'Builder Pattern',
    emoji: '🏗️',
    colors: ['#8B4513', '#DAA520'],
    cta: 'Comment BUILDER for your foundation guide'
  },
  release: {
    title: 'Release Pattern',
    emoji: '🌊',
    colors: ['#4682B4', '#87CEEB'],
    cta: 'Comment RELEASE for your completion ritual'
  },
  amplify: {
    title: 'Amplifier Pattern',
    emoji: '📣',
    colors: ['#FF6347', '#FFD700'],
    cta: 'Comment AMPLIFY for your broadcast checklist'
  },
  balanced: {
    title: 'Balanced Pattern',
    emoji: '⚖️',
    colors: ['#32CD32', '#9370DB'],
    cta: 'Comment BALANCE for your integration guide'
  },
  focused: {
    title: 'Focused Pattern',
    emoji: '🎯',
    colors: ['#DC143C', '#FF1493'],
    cta: 'Comment FOCUS for your single-frequency guide'
  },
  transition: {
    title: 'Transition Pattern',
    emoji: '🦋',
    colors: ['#9370DB', '#FF69B4'],
    cta: 'Comment SHIFT for your transition ritual'
  },
  ascending: {
    title: 'Ascending Pattern',
    emoji: '🚀',
    colors: ['#FF4500', '#FFD700'],
    cta: 'Comment RISE for your momentum guide'
  },
  descending: {
    title: 'Descending Pattern',
    emoji: '🏔️',
    colors: ['#2F4F4F', '#696969'],
    cta: 'Comment GROUND for your foundation ritual'
  },
  cyclical: {
    title: 'Cyclical Pattern',
    emoji: '🔄',
    colors: ['#4169E1', '#00CED1'],
    cta: 'Comment CYCLE for your closing ritual'
  }
};
