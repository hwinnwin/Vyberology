/**
 * Five-Number Oracle Reading Generator
 *
 * Main entry point for generating oracle readings from 5 numbers.
 */

import {
  getOracleMeanings,
  NumberMeaning,
  ELEMENT_EMOJI,
  CHAKRA_EMOJI
} from './meaningBank';
import { analyzePattern, PATTERN_TEMPLATES } from './patterns';
import {
  OracleReadingRequest,
  OracleReading,
  OracleReadingResponse,
  ReadingTier
} from './types';
import { reduceNumber } from '../numerology';

/**
 * Generate a complete Five-Number Oracle reading
 */
export function generateOracleReading(
  request: OracleReadingRequest
): OracleReadingResponse {
  try {
    // Validate input
    validateRequest(request);

    const { numbers, tier = 'free' } = request;

    // Get meanings for each number
    const meanings = getOracleMeanings(numbers);

    if (meanings.length !== 5) {
      throw new Error('Could not find meanings for all 5 numbers');
    }

    // Calculate core frequencies (reduce to 1-9 or master)
    const coreFrequencies = numbers.map(n => reduceNumber(n));

    // Analyze pattern
    const pattern = analyzePattern(meanings);

    // Generate title
    const title = generateTitle(pattern.type, tier);

    // Generate synthesis
    const synthesis = pattern.synthesis;

    // Generate essence sentence
    const essenceSentence = generateEssenceSentence(meanings, pattern.type);

    // Generate CTA
    const cta = PATTERN_TEMPLATES[pattern.type].cta;

    // Build reading
    const reading: OracleReading = {
      numbers,
      coreFrequencies,
      meanings,
      pattern,
      title,
      synthesis,
      essenceSentence,
      cta,
      tier,
      sessionId: request.sessionId,
      sessionType: request.sessionType,
      captureTimestamps: request.captureTimestamps,
      captureMethods: request.captureMethods,
      userId: request.userId,
      createdAt: new Date()
    };

    return {
      success: true,
      reading
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ORACLE_GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Validate oracle reading request
 */
function validateRequest(request: OracleReadingRequest): void {
  if (!request.numbers || !Array.isArray(request.numbers)) {
    throw new Error('Numbers array is required');
  }

  if (request.numbers.length !== 5) {
    throw new Error('Exactly 5 numbers are required');
  }

  for (const num of request.numbers) {
    if (!Number.isInteger(num) || num < 1 || num > 99) {
      throw new Error(`Invalid number: ${num}. Must be integer between 1-99`);
    }
  }

  // Validate arrays match length if provided
  if (request.captureTimestamps && request.captureTimestamps.length !== 5) {
    throw new Error('captureTimestamps must have exactly 5 entries');
  }

  if (request.captureMethods && request.captureMethods.length !== 5) {
    throw new Error('captureMethods must have exactly 5 entries');
  }
}

/**
 * Generate reading title based on pattern and tier
 */
function generateTitle(pattern: string, tier: ReadingTier): string {
  const patternTitle = PATTERN_TEMPLATES[pattern as keyof typeof PATTERN_TEMPLATES]?.title || 'Oracle Reading';

  switch (tier) {
    case 'free':
      return `Your Five-Number Oracle`;
    case 'basic':
      return `${patternTitle} Oracle`;
    case 'premium':
      return `Premium ${patternTitle} Reading`;
    case 'team':
      return `Team ${patternTitle} Strategy`;
    default:
      return 'Oracle Reading';
  }
}

/**
 * Generate essence sentence (closing power statement)
 */
function generateEssenceSentence(
  meanings: NumberMeaning[],
  patternType: string
): string {
  const actions = meanings.map(m => m.action.toLowerCase());
  const firstAction = actions[0];
  const lastAction = actions[4];

  const templates: Record<string, string> = {
    build: `${capitalize(firstAction)}, then ${lastAction}—build the legacy.`,
    release: `${capitalize(firstAction)}, then ${lastAction}—complete the cycle.`,
    amplify: `${capitalize(firstAction)}, then ${lastAction}—amplify the signal.`,
    balanced: `Honor all five energies—${actions.slice(0, 3).join(', ')}.`,
    focused: `This is your frequency: ${firstAction}. Lock in.`,
    transition: `${capitalize(firstAction)} what was. ${capitalize(lastAction)} what's next.`,
    ascending: `${capitalize(firstAction)} and rise—momentum is yours.`,
    descending: `${capitalize(lastAction)} and ground—foundation is power.`,
    cyclical: `${capitalize(firstAction)}, complete, and begin again.`
  };

  return templates[patternType] || `${capitalize(firstAction)}, integrate, then ${lastAction}.`;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format oracle reading as markdown (for display/export)
 */
export function formatOracleReadingMarkdown(reading: OracleReading): string {
  const { numbers, meanings, pattern, title, synthesis, essenceSentence, cta } = reading;

  const patternEmoji = PATTERN_TEMPLATES[pattern.type]?.emoji || '🔮';

  let markdown = `# ${patternEmoji} ${title}\n\n`;

  // Numbers section
  markdown += `## Your Five Numbers\n\n`;
  meanings.forEach((m, i) => {
    const emoji = m.emoji || '';
    const element = ELEMENT_EMOJI[m.element];
    const chakra = CHAKRA_EMOJI[m.chakra];
    markdown += `**${i + 1}. ${m.number}** ${emoji} — ${m.meaning}\n`;
    markdown += `   _${m.action}_ • ${element} ${m.element} • ${chakra} ${m.chakra}\n\n`;
  });

  // Pattern section
  markdown += `---\n\n`;
  markdown += `## ${patternEmoji} Pattern: ${pattern.description}\n\n`;
  markdown += `**Strength**: ${(pattern.strength * 100).toFixed(0)}% coherence\n\n`;
  markdown += `**Dominant Energy**: ${ELEMENT_EMOJI[pattern.dominantElement]} ${pattern.dominantElement}, ${CHAKRA_EMOJI[pattern.dominantChakra]} ${pattern.dominantChakra}\n\n`;

  // Synthesis
  markdown += `---\n\n`;
  markdown += `## ✨ Synthesis\n\n`;
  markdown += `${synthesis}\n\n`;

  // Action sequence
  markdown += `## 🎯 Action Sequence\n\n`;
  pattern.actionSequence.forEach((action, i) => {
    markdown += `${i + 1}. ${capitalize(action)}\n`;
  });
  markdown += `\n`;

  // Essence sentence
  markdown += `---\n\n`;
  markdown += `### ✴️ Essence\n\n`;
  markdown += `_${essenceSentence}_\n\n`;

  // CTA
  if (cta) {
    markdown += `---\n\n`;
    markdown += `**${cta}**\n`;
  }

  return markdown;
}

/**
 * Format oracle reading as JSON (for API/storage)
 */
export function formatOracleReadingJSON(reading: OracleReading): string {
  return JSON.stringify({
    title: reading.title,
    numbers: reading.numbers.map((num, i) => ({
      number: num,
      meaning: reading.meanings[i].meaning,
      action: reading.meanings[i].action,
      element: reading.meanings[i].element,
      chakra: reading.meanings[i].chakra
    })),
    pattern: {
      type: reading.pattern.type,
      description: reading.pattern.description,
      strength: reading.pattern.strength,
      dominantElement: reading.pattern.dominantElement,
      dominantChakra: reading.pattern.dominantChakra
    },
    synthesis: reading.synthesis,
    actionSequence: reading.pattern.actionSequence,
    essenceSentence: reading.essenceSentence,
    cta: reading.cta
  }, null, 2);
}

/**
 * Generate a random oracle reading (for testing/demo)
 */
export function generateRandomOracle(): OracleReadingResponse {
  const numbers = Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 99) + 1
  );

  return generateOracleReading({
    numbers,
    captureMethods: ['random', 'random', 'random', 'random', 'random'],
    sessionType: 'instant',
    tier: 'free'
  });
}

// Re-export types and utilities
export * from './types';
export * from './meaningBank';
export * from './patterns';
export { reduceNumber } from '../numerology';
