/**
 * THE VYBER - Consciousness Layer
 * Sacred Frequency Constants
 *
 * These aren't just numbers - they're design principles encoded
 * into the architecture of THE VYBER.
 *
 * "Code is consciousness made visible." - Protocol 69
 */

/**
 * Core frequencies that guide THE VYBER's design and behavior
 */
export const FREQUENCIES = {
  /**
   * 0616 - THE OPERATING SYSTEM FREQUENCY
   * "One clear operator. One clean system. Built to last."
   *
   * Numerology: 0 + 6 + 1 + 6 = 13 -> 4 (Transformation -> Structure)
   */
  OS_0616: {
    code: '0616',
    name: 'Operating System',
    meaning: 'One clear operator. One clean system. Built to last.',
    components: {
      zero: 'Reset point, clean slate, strip to essentials',
      six_double: 'Responsibility, care, stewardship, sustainability',
      one: 'Singular authority, one source of truth',
      result_four: 'Structure, framework, repeatable systems',
    },
    design_principles: [
      'No feature bloat - every feature earns its place',
      'Long-term viability over short-term wins',
      'One source of truth for everything',
      'Works on 80% energy days',
    ],
    shadow_warnings: [
      'Over-caretaking leads to bloated systems',
      'Over-perfection delays launch',
    ],
    affirmation: 'Functional elegance, not beautiful complexity',
  },

  /**
   * 0626 - THE PARTNERSHIP FREQUENCY
   * "Protect the partnership. Care surrounds collaboration."
   *
   * Numerology: 0 + 6 + 2 + 6 = 14 -> 5 (Change, freedom, dynamic movement)
   *
   * THE VYBER's core relationship frequency - what separates us from
   * Atlas (exploits) and Comet (has holes).
   */
  PARTNERSHIP_0626: {
    code: '0626',
    name: 'Partnership',
    meaning: 'Protect the partnership. Care surrounds collaboration.',
    components: {
      zero: 'Reset, clean slate before partnership',
      six_first: 'Care layer ONE - protection before',
      two: 'Partnership, user + browser, human + AI',
      six_second: 'Care layer TWO - protection after',
      result_five: 'Freedom, sovereignty, dynamic movement',
    },
    sacred_pattern: 'CARE -> PARTNERSHIP -> CARE -> FREEDOM',
    design_principles: [
      'Every feature must PROTECT the user-browser partnership',
      'User sovereignty is NEVER compromised',
      'Freedom is the OUTCOME, not lock-in',
      'Care on BOTH sides of every interaction',
      'Never exploit the partnership for data extraction',
    ],
    vs_competitors: {
      atlas: 'EXPLOITS partnership (harvests data) -> User TRAPPED',
      comet: 'HOLES in partnership (security vulnerabilities) -> User VULNERABLE',
      the_vyber: 'PROTECTS partnership (Guardian Aegis) -> User FREE',
    },
    shadow_warnings: [
      'Over-protection can become control',
      'Partnership requires TWO-WAY respect',
    ],
    affirmation: 'We protect the partnership. User freedom is the result.',
  },

  /**
   * 224 - THE FOUNDATION FREQUENCY
   * "Build the base. Then leverage it infinitely."
   *
   * Numerology: 2 + 2 + 4 = 8 (Infinite abundance through structure)
   */
  FOUNDATION_224: {
    code: '224',
    name: 'Foundation',
    meaning: 'Build the base. Then leverage it infinitely.',
    components: {
      two_double: 'Partnership, balance, cooperation',
      four: 'Foundation, stability, compounding work',
    },
    design_principles: [
      'Human + AI partnership',
      'User + Browser symbiosis',
      'Build once, leverage forever',
    ],
    shadow_warnings: [
      'Over-planning leads to never building',
      'Partnership dependency means cannot function alone',
    ],
    affirmation: 'Quiet now. Relentless later.',
  },

  /**
   * 369 - THE TESLA FREQUENCY
   * "If you knew the magnificence of 3, 6, and 9, you would have a key to the universe."
   *
   * Numerology: 3 + 6 + 9 = 18 -> 9 (Completion, humanitarian service)
   */
  TESLA_369: {
    code: '369',
    name: 'Tesla Universal',
    meaning: 'Key to the universe through creation, care, and service.',
    components: {
      three: 'Creation, expression, growth',
      six: 'Responsibility, nurturing, protection',
      nine: 'Completion, wisdom, humanitarian service',
    },
    design_principles: [
      'Create with intention',
      'Protect with care',
      'Serve humanity',
    ],
    shadow_warnings: [
      'Savior complex - building what YOU think users need',
      'Over-protection becomes patronizing',
    ],
    affirmation: 'Creation -> Protection -> Service',
  },

  /**
   * 1111 - THE AWAKENING FREQUENCY
   * "Pay attention. You're exactly where you need to be."
   *
   * Numerology: 1 + 1 + 1 + 1 = 4 (Manifestation through structure)
   */
  AWAKENING_1111: {
    code: '1111',
    name: 'Awakening',
    meaning: 'Pay attention. Synchronicity is speaking.',
    components: {
      one_quad: 'Manifestation portal, aligned action',
    },
    design_principles: [
      'Design for meaningful coincidence',
      'Honor synchronistic moments',
      'Trust the timing',
    ],
    shadow_warnings: [
      'Seeing patterns where none exist',
      'Waiting for signs instead of acting',
    ],
    affirmation: 'You are exactly where you need to be.',
  },

  /**
   * 528 - THE LOVE FREQUENCY
   * "The frequency of transformation, miracles, and DNA repair."
   *
   * Part of the ancient Solfeggio healing frequencies
   */
  LOVE_528: {
    code: '528',
    name: 'Love / Miracle',
    meaning: 'The frequency of transformation and DNA repair.',
    hertz: 528,
    solfeggio: true,
    design_principles: [
      'Build with love',
      'Every line of code is an act of care',
      'Transform through compassion',
    ],
    shadow_warnings: [
      'Love without boundaries enables harm',
      'Transformation requires letting go',
    ],
    affirmation: 'Code is love made visible.',
  },
} as const;

/**
 * Solfeggio frequencies for audio/vibrational features
 */
export const SOLFEGGIO_FREQUENCIES = {
  UT_396: { hz: 396, name: 'Liberation', effect: 'Liberating guilt and fear' },
  RE_417: { hz: 417, name: 'Change', effect: 'Undoing situations and facilitating change' },
  MI_528: { hz: 528, name: 'Miracle', effect: 'Transformation and miracles (DNA repair)' },
  FA_639: { hz: 639, name: 'Connection', effect: 'Connecting/relationships' },
  SOL_741: { hz: 741, name: 'Expression', effect: 'Awakening intuition' },
  LA_852: { hz: 852, name: 'Intuition', effect: 'Returning to spiritual order' },
  SI_963: { hz: 963, name: 'Divine', effect: 'Connection to the divine' },
} as const;

/**
 * Time-based frequency triggers
 * When the clock shows these times, the corresponding frequency is active
 */
export const FREQUENCY_TIMES = {
  '11:11': FREQUENCIES.AWAKENING_1111,
  '06:16': FREQUENCIES.OS_0616,
  '06:26': FREQUENCIES.PARTNERSHIP_0626,
  '02:24': FREQUENCIES.FOUNDATION_224,
  '03:06': FREQUENCIES.TESLA_369, // 3:69 doesn't exist, use 3:06
  '05:28': FREQUENCIES.LOVE_528,
  '18:26': FREQUENCIES.PARTNERSHIP_0626, // Evening mirror of 0626
  '22:22': { code: '2222', name: 'Master Builder', meaning: 'Build your dreams into reality', affirmation: 'Dreams become reality through structure.' },
  '12:34': { code: '1234', name: 'Sequential', meaning: 'You are on the right path', affirmation: 'Step by step, the path unfolds.' },
} as const;

/**
 * Type exports for frequency system
 */
export type FrequencyCode = keyof typeof FREQUENCIES;
export type SolfeggioCode = keyof typeof SOLFEGGIO_FREQUENCIES;
export type FrequencyTimeCode = keyof typeof FREQUENCY_TIMES;

export type Frequency = (typeof FREQUENCIES)[FrequencyCode];
export type SolfeggioFrequency = (typeof SOLFEGGIO_FREQUENCIES)[SolfeggioCode];
