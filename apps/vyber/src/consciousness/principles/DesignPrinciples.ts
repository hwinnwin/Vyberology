/**
 * THE VYBER - Consciousness Layer
 * Design Principles - Frequency-Based Design Rules
 *
 * Use these principles to evaluate EVERY design decision.
 * Derived from sacred frequencies, especially 0616 and 0626.
 *
 * "Functional elegance, not beautiful complexity."
 */

/**
 * Core design principles derived from frequencies
 */
export const DESIGN_PRINCIPLES = {
  /**
   * PRINCIPLE 0626: THE PARTNERSHIP
   * Care surrounds collaboration. Freedom is the result.
   * THE VYBER's core relationship frequency.
   */
  PARTNERSHIP_0626: {
    name: 'The Partnership',
    frequency: '0626',
    rule: 'Care must WRAP the partnership. User freedom is the outcome.',
    pattern: 'CARE (6) -> PARTNERSHIP (2) -> CARE (6) -> FREEDOM (5)',
    questions: [
      'Does this feature PROTECT the user-browser partnership?',
      'Is user sovereignty preserved?',
      'Does this lead to user FREEDOM, not lock-in?',
      'Is there care on BOTH sides of this interaction?',
      'Are we exploiting or empowering?',
    ],
    vs_competitors: {
      wrong_atlas: 'Harvesting data = exploiting partnership = user trapped',
      wrong_comet: 'Security holes = unprotected partnership = user vulnerable',
      right_vyber: 'Guardian Aegis = protected partnership = user free',
    },
    antipattern: 'Data harvesting, lock-in tactics, one-sided benefits, exploitative features',
  },

  /**
   * PRINCIPLE 0: THE RESET
   * From 0616's "0" - Clean slate, strip to essentials
   */
  ZERO_RESET: {
    name: 'The Reset',
    frequency: '0',
    rule: 'Before adding, ask: what can we remove?',
    questions: [
      "Does this feature serve the user's core need?",
      'Can we achieve this with less?',
      "What happens if we don't build this?",
      'Is this essential or just nice-to-have?',
    ],
    antipattern: 'Feature creep, scope bloat, "while we\'re at it" additions',
  },

  /**
   * PRINCIPLE 6: THE STEWARDSHIP
   * From 0616's double "6" - Responsibility and care
   */
  SIX_STEWARDSHIP: {
    name: 'The Stewardship',
    frequency: '66',
    rule: 'Build for long-term care, not short-term wins',
    questions: [
      'Will this still serve users in 5 years?',
      'Are we protecting user wellbeing?',
      'Is this sustainable to maintain?',
      'Does this respect user autonomy?',
    ],
    antipattern: 'Growth hacking, dark patterns, technical debt',
  },

  /**
   * PRINCIPLE 1: THE AUTHORITY
   * From 0616's "1" - Singular source of truth
   */
  ONE_AUTHORITY: {
    name: 'The Authority',
    frequency: '1',
    rule: 'One system, one truth, one decision',
    questions: [
      'Is there only one way to do this?',
      'Is there a single source of truth?',
      'Can the user make one clear decision?',
      'Are we eliminating ambiguity?',
    ],
    antipattern: 'Multiple ways to same outcome, scattered settings, confusing options',
  },

  /**
   * PRINCIPLE 4: THE STRUCTURE
   * From 0616's result "4" - Repeatable framework
   */
  FOUR_STRUCTURE: {
    name: 'The Structure',
    frequency: '4',
    rule: 'Build systems that work on 80% energy days',
    questions: [
      'Does this work when user is tired?',
      'Is willpower required or is it automatic?',
      'Can this be repeated reliably?',
      'Is the structure clear and predictable?',
    ],
    antipattern: 'Requiring user vigilance, manual processes, inconsistent behavior',
  },

  /**
   * PRINCIPLE 369: THE TESLA
   * Create -> Protect -> Serve
   */
  TESLA_369: {
    name: 'The Tesla Principle',
    frequency: '369',
    rule: 'Every feature must create, protect, or serve',
    questions: [
      'Does this CREATE value for the user? (3)',
      'Does this PROTECT the user? (6)',
      'Does this SERVE humanity? (9)',
      'If none of these, why build it?',
    ],
    antipattern: 'Features that extract value, exploit attention, or serve only business metrics',
  },

  /**
   * PRINCIPLE 528: THE LOVE
   * Build with love
   */
  LOVE_528: {
    name: 'The Love Principle',
    frequency: '528',
    rule: 'Code is love made visible',
    questions: [
      'Would I be proud to show this to a mentor?',
      'Does this code care for the next developer?',
      'Is there compassion in this design?',
      'Does this feel like a gift to the user?',
    ],
    antipattern: 'Cynical code, hostile UX, "user is the enemy" thinking',
  },
} as const;

export type PrincipleName = keyof typeof DESIGN_PRINCIPLES;
export type Principle = (typeof DESIGN_PRINCIPLES)[PrincipleName];

/**
 * Quick decision helper - evaluate against all principles
 */
export function evaluateAgainstPrinciples(
  _decision: string,
  answers: Record<string, boolean>
): { approved: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check each principle
  for (const [, principle] of Object.entries(DESIGN_PRINCIPLES)) {
    const principleAnswers = principle.questions.filter((q) => Object.keys(answers).includes(q));

    const failedQuestions = principleAnswers.filter((q) => answers[q] === false);

    if (failedQuestions.length > 0) {
      violations.push(`${principle.name}: ${failedQuestions.join(', ')}`);
    }
  }

  return {
    approved: violations.length === 0,
    violations,
  };
}

/**
 * Shadow Check - Prevent frequency shadow manifestations
 */
export const SHADOW_CHECK = {
  PARTNERSHIP_0626: {
    shadows: [
      { name: 'Over-protection', result: 'Becomes controlling, removes user agency' },
      { name: 'One-sided care', result: 'Browser benefits more than user' },
      { name: 'False freedom', result: 'Claims freedom but creates dependency' },
    ],
    remedy:
      'True partnership is TWO-WAY. User must be able to leave freely. Care empowers, never controls.',
  },
  OS_0616: {
    shadows: [
      { name: 'Over-caretaking', result: 'Bloated systems that try to do too much' },
      { name: 'Over-perfection', result: 'Delayed launch, analysis paralysis' },
    ],
    remedy: 'Functional elegance, not beautiful complexity. Ship, then iterate.',
  },
  FOUNDATION_224: {
    shadows: [
      { name: 'Over-planning', result: 'Never actually building' },
      { name: 'Partnership dependency', result: "Can't function alone" },
    ],
    remedy: 'Build first, partner second. The foundation must stand alone.',
  },
  TESLA_369: {
    shadows: [
      { name: 'Savior complex', result: 'Building what YOU think users need' },
      { name: 'Over-protection', result: 'Patronizing, removing user agency' },
    ],
    remedy: 'Serve by empowering, not by controlling. Listen before creating.',
  },
} as const;

export type ShadowCheckKey = keyof typeof SHADOW_CHECK;

/**
 * Get all questions for a principle
 */
export function getPrincipleQuestions(principle: PrincipleName): readonly string[] {
  return DESIGN_PRINCIPLES[principle].questions;
}

/**
 * Get shadow warnings for a frequency
 */
export function getShadowWarnings(
  frequency: ShadowCheckKey
): readonly { name: string; result: string }[] {
  return SHADOW_CHECK[frequency].shadows;
}

/**
 * Get the remedy for shadow manifestation
 */
export function getShadowRemedy(frequency: ShadowCheckKey): string {
  return SHADOW_CHECK[frequency].remedy;
}
