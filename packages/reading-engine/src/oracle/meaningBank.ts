/**
 * Five-Number Oracle Meaning Bank
 *
 * Comprehensive 1-99 number mappings with:
 * - One-line punchy meaning
 * - Element association (🜂 Fire, 🜁 Air, 🜃 Earth, 🜄 Water)
 * - Chakra resonance (Root → Crown)
 * - Action cue (verb-first directive)
 *
 * Built for 60-180s oracle readings with instant clarity.
 */

export type Element = 'Fire' | 'Air' | 'Earth' | 'Water';
export type Chakra = 'Root' | 'Sacral' | 'Solar Plexus' | 'Heart' | 'Throat' | 'Third Eye' | 'Crown';

export interface NumberMeaning {
  number: number;
  meaning: string;          // One-liner (5-8 words max)
  action: string;           // Verb-first cue (3-5 words)
  element: Element;
  chakra: Chakra;
  keywords: string[];       // 3-5 energy tags
  emoji?: string;           // Optional visual anchor
}

/**
 * Five-Number Oracle Meaning Bank (1-99)
 *
 * Core framework:
 * - 1-9: Root archetypes (Pythagorean)
 * - 11, 22, 33, 44: Master numbers (amplified power)
 * - 10s: Completion + new cycle markers
 * - 20s-90s: Compound energies with practical action bias
 */
export const ORACLE_MEANING_BANK: Record<number, NumberMeaning> = {
  // ═══════════════════════════════════════════════════════════════════════
  // ROOT ARCHETYPES (1-9)
  // ═══════════════════════════════════════════════════════════════════════

  1: {
    number: 1,
    meaning: 'Start / Spark / Declare intent',
    action: 'Begin now',
    element: 'Fire',
    chakra: 'Root',
    keywords: ['initiation', 'independence', 'courage', 'leadership'],
    emoji: '🔥'
  },

  2: {
    number: 2,
    meaning: 'Partner / Choose harmony',
    action: 'Seek support',
    element: 'Water',
    chakra: 'Sacral',
    keywords: ['partnership', 'balance', 'cooperation', 'intuition'],
    emoji: '🤝'
  },

  3: {
    number: 3,
    meaning: 'Express / Ship draft one',
    action: 'Create visibly',
    element: 'Air',
    chakra: 'Solar Plexus',
    keywords: ['creativity', 'communication', 'joy', 'expression'],
    emoji: '✨'
  },

  4: {
    number: 4,
    meaning: 'Structure / Set the rule',
    action: 'Build foundation',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['stability', 'discipline', 'order', 'foundation'],
    emoji: '🏗️'
  },

  5: {
    number: 5,
    meaning: 'Pivot / Test new path',
    action: 'Experiment freely',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['change', 'freedom', 'adventure', 'flexibility'],
    emoji: '🌀'
  },

  6: {
    number: 6,
    meaning: 'Nurture / Protect asset',
    action: 'Care deeply',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['harmony', 'responsibility', 'service', 'love'],
    emoji: '💚'
  },

  7: {
    number: 7,
    meaning: 'Reflect / Data over drama',
    action: 'Analyze quietly',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'introspection', 'analysis', 'truth'],
    emoji: '🔮'
  },

  8: {
    number: 8,
    meaning: 'Power / Price properly',
    action: 'Own your value',
    element: 'Earth',
    chakra: 'Solar Plexus',
    keywords: ['abundance', 'authority', 'manifestation', 'success'],
    emoji: '💰'
  },

  9: {
    number: 9,
    meaning: 'Complete / Release backlog',
    action: 'Let go fully',
    element: 'Fire',
    chakra: 'Crown',
    keywords: ['completion', 'wisdom', 'release', 'transformation'],
    emoji: '🌅'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER NUMBERS (11, 22, 33, 44)
  // ═══════════════════════════════════════════════════════════════════════

  11: {
    number: 11,
    meaning: 'Signal / Trust the antenna',
    action: 'Follow intuition',
    element: 'Air',
    chakra: 'Third Eye',
    keywords: ['illumination', 'intuition', 'spiritual', 'vision'],
    emoji: '⚡'
  },

  22: {
    number: 22,
    meaning: 'Foundation++ / Build platform',
    action: 'Systemize the win',
    element: 'Earth',
    chakra: 'Crown',
    keywords: ['master builder', 'vision', 'large-scale', 'legacy'],
    emoji: '🏛️'
  },

  33: {
    number: 33,
    meaning: 'Amplify / Teach what you do',
    action: 'Share expertise',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['master teacher', 'compassion', 'guidance', 'uplift'],
    emoji: '📣'
  },

  44: {
    number: 44,
    meaning: 'Architect / Design the engine',
    action: 'Build infrastructure',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['discipline', 'precision', 'endurance', 'mastery'],
    emoji: '⚙️'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TENS (10, 20, 30, 40, 50, 60, 70, 80, 90) - Completion Markers
  // ═══════════════════════════════════════════════════════════════════════

  10: {
    number: 10,
    meaning: 'New cycle / Fresh canvas',
    action: 'Reset and begin',
    element: 'Fire',
    chakra: 'Crown',
    keywords: ['completion', 'potential', 'new beginning', 'wholeness'],
    emoji: '🔄'
  },

  20: {
    number: 20,
    meaning: 'Synthesis / Merge the paths',
    action: 'Integrate opposites',
    element: 'Water',
    chakra: 'Sacral',
    keywords: ['duality', 'cooperation', 'balance', 'patience'],
    emoji: '☯️'
  },

  30: {
    number: 30,
    meaning: 'Multiply / Joy compounds',
    action: 'Amplify expression',
    element: 'Air',
    chakra: 'Solar Plexus',
    keywords: ['creativity', 'expansion', 'optimism', 'growth'],
    emoji: '🎨'
  },

  40: {
    number: 40,
    meaning: 'Consolidate / Lock gains',
    action: 'Fortify position',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['stability', 'grounding', 'endurance', 'structure'],
    emoji: '🛡️'
  },

  50: {
    number: 50,
    meaning: 'Liberation / Break the cage',
    action: 'Choose freedom',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['transformation', 'freedom', 'adventure', 'liberation'],
    emoji: '🦅'
  },

  60: {
    number: 60,
    meaning: 'Service / Care at scale',
    action: 'Nurture community',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['responsibility', 'family', 'service', 'harmony'],
    emoji: '🌿'
  },

  70: {
    number: 70,
    meaning: 'Mastery / Integrate wisdom',
    action: 'Teach what you know',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'knowledge', 'inner truth', 'perfection'],
    emoji: '📚'
  },

  80: {
    number: 80,
    meaning: 'Empire / Build to last',
    action: 'Create legacy',
    element: 'Earth',
    chakra: 'Solar Plexus',
    keywords: ['power', 'abundance', 'achievement', 'influence'],
    emoji: '👑'
  },

  90: {
    number: 90,
    meaning: 'Completion / Harvest wisdom',
    action: 'Close the chapter',
    element: 'Fire',
    chakra: 'Crown',
    keywords: ['fulfillment', 'wisdom', 'humanitarianism', 'release'],
    emoji: '🌌'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // COMPOUND NUMBERS (12-19, 21-29, 31-39, 41-49, 51-59, 61-69, 71-79, 81-89, 91-99)
  // ═══════════════════════════════════════════════════════════════════════

  // 12-19: New Beginnings + Compound
  12: {
    number: 12,
    meaning: 'Order / Stack the blocks',
    action: 'Sequence steps',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['organization', 'cycles', 'time', 'order']
  },

  13: {
    number: 13,
    meaning: 'Transform / Prune to grow',
    action: 'Release old forms',
    element: 'Fire',
    chakra: 'Solar Plexus',
    keywords: ['transformation', 'rebirth', 'change', 'death-rebirth']
  },

  14: {
    number: 14,
    meaning: 'Frequency / Align the room',
    action: 'Match energy',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['balance', 'moderation', 'alchemy', 'harmony']
  },

  15: {
    number: 15,
    meaning: 'Magnetism / Attract what fits',
    action: 'Be magnetic',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['attraction', 'creativity', 'passion', 'heart']
  },

  16: {
    number: 16,
    meaning: 'Tower / Rebuild foundations',
    action: 'Tear down obsolete',
    element: 'Fire',
    chakra: 'Root',
    keywords: ['awakening', 'upheaval', 'revelation', 'breakthrough']
  },

  17: {
    number: 17,
    meaning: 'Star / Hold the vision',
    action: 'Trust the path',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['hope', 'inspiration', 'guidance', 'faith']
  },

  18: {
    number: 18,
    meaning: 'Moon / Navigate illusion',
    action: 'Trust instinct',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['intuition', 'dreams', 'subconscious', 'mystery']
  },

  19: {
    number: 19,
    meaning: 'Sun / Shine full power',
    action: 'Radiate presence',
    element: 'Fire',
    chakra: 'Solar Plexus',
    keywords: ['success', 'vitality', 'clarity', 'achievement']
  },

  // 21-29: Partnership + Compound
  21: {
    number: 21,
    meaning: 'Victory / Claim the win',
    action: 'Celebrate success',
    element: 'Fire',
    chakra: 'Crown',
    keywords: ['achievement', 'success', 'completion', 'triumph']
  },

  23: {
    number: 23,
    meaning: 'Broadcast / Share the signal',
    action: 'Speak your truth',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['communication', 'adventure', 'versatility', 'change']
  },

  24: {
    number: 24,
    meaning: 'Home / Build sanctuary',
    action: 'Create safety',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['family', 'home', 'stability', 'care']
  },

  25: {
    number: 25,
    meaning: 'Insight / See the pattern',
    action: 'Perceive clearly',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'introspection', 'learning', 'growth']
  },

  26: {
    number: 26,
    meaning: 'Resource / Steward wealth',
    action: 'Manage wisely',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['responsibility', 'karma', 'balance', 'material']
  },

  27: {
    number: 27,
    meaning: 'Compassion / Lead with heart',
    action: 'Give gracefully',
    element: 'Water',
    chakra: 'Heart',
    keywords: ['humanitarian', 'wisdom', 'selflessness', 'service']
  },

  28: {
    number: 28,
    meaning: 'Authority / Command respect',
    action: 'Lead decisively',
    element: 'Fire',
    chakra: 'Solar Plexus',
    keywords: ['leadership', 'independence', 'ambition', 'power']
  },

  29: {
    number: 29,
    meaning: 'Mystic / Channel the unseen',
    action: 'Trust downloads',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['intuition', 'master number', 'sensitivity', 'spiritual']
  },

  // 31-39: Expression + Compound
  31: {
    number: 31,
    meaning: 'Builder / Craft with joy',
    action: 'Create systematically',
    element: 'Earth',
    chakra: 'Solar Plexus',
    keywords: ['creativity', 'discipline', 'expression', 'structure']
  },

  32: {
    number: 32,
    meaning: 'Harmony / Weave connections',
    action: 'Unite energies',
    element: 'Air',
    chakra: 'Heart',
    keywords: ['cooperation', 'creativity', 'diplomacy', 'balance']
  },

  34: {
    number: 34,
    meaning: 'Catalyst / Spark change',
    action: 'Disrupt stagnation',
    element: 'Fire',
    chakra: 'Solar Plexus',
    keywords: ['transformation', 'energy', 'dynamic', 'action']
  },

  35: {
    number: 35,
    meaning: 'Exploration / Scout ahead',
    action: 'Test boundaries',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['adventure', 'curiosity', 'expansion', 'freedom']
  },

  36: {
    number: 36,
    meaning: 'Devotion / Commit deeply',
    action: 'Serve lovingly',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['service', 'compassion', 'family', 'responsibility']
  },

  37: {
    number: 37,
    meaning: 'Knowledge / Decode truth',
    action: 'Study deeply',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['learning', 'analysis', 'wisdom', 'perfection']
  },

  38: {
    number: 38,
    meaning: 'Momentum / Ride the wave',
    action: 'Leverage force',
    element: 'Fire',
    chakra: 'Solar Plexus',
    keywords: ['manifestation', 'power', 'abundance', 'flow']
  },

  39: {
    number: 39,
    meaning: 'Generosity / Give freely',
    action: 'Share abundance',
    element: 'Air',
    chakra: 'Crown',
    keywords: ['completion', 'creativity', 'humanitarianism', 'expression']
  },

  // 41-49: Structure + Compound
  41: {
    number: 41,
    meaning: 'Initiative / Launch solo',
    action: 'Build from scratch',
    element: 'Fire',
    chakra: 'Root',
    keywords: ['foundation', 'independence', 'action', 'discipline']
  },

  42: {
    number: 42,
    meaning: 'Partnership / Co-create',
    action: 'Collaborate structurally',
    element: 'Earth',
    chakra: 'Sacral',
    keywords: ['cooperation', 'stability', 'teamwork', 'balance']
  },

  43: {
    number: 43,
    meaning: 'Prototype / Build V1',
    action: 'Ship working draft',
    element: 'Earth',
    chakra: 'Solar Plexus',
    keywords: ['creativity', 'structure', 'manifestation', 'grounding']
  },

  45: {
    number: 45,
    meaning: 'Redesign / Iterate boldly',
    action: 'Rebuild better',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['change', 'discipline', 'transformation', 'freedom']
  },

  46: {
    number: 46,
    meaning: 'Stewardship / Protect legacy',
    action: 'Preserve what matters',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['responsibility', 'stability', 'family', 'care']
  },

  47: {
    number: 47,
    meaning: 'Architecture / Design systems',
    action: 'Engineer solutions',
    element: 'Earth',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'structure', 'analysis', 'mastery']
  },

  48: {
    number: 48,
    meaning: 'Foundation / Monetize skill',
    action: 'Build revenue base',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['abundance', 'structure', 'manifestation', 'wealth']
  },

  49: {
    number: 49,
    meaning: 'Completion / Close project',
    action: 'Finish fully',
    element: 'Earth',
    chakra: 'Crown',
    keywords: ['completion', 'discipline', 'wisdom', 'transformation']
  },

  // 51-59: Freedom + Compound
  51: {
    number: 51,
    meaning: 'Breakthrough / Create opening',
    action: 'Initiate change',
    element: 'Fire',
    chakra: 'Throat',
    keywords: ['freedom', 'innovation', 'independence', 'change']
  },

  52: {
    number: 52,
    meaning: 'Diplomacy / Navigate politics',
    action: 'Balance freedoms',
    element: 'Air',
    chakra: 'Sacral',
    keywords: ['balance', 'freedom', 'cooperation', 'change']
  },

  53: {
    number: 53,
    meaning: 'Adventure / Express wildly',
    action: 'Explore creatively',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['freedom', 'expression', 'adventure', 'creativity']
  },

  54: {
    number: 54,
    meaning: 'Freedom / Break constraints',
    action: 'Liberate structure',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['change', 'stability', 'transformation', 'balance']
  },

  55: {
    number: 55,
    meaning: 'Revolution / Quantum shift',
    action: 'Change everything',
    element: 'Fire',
    chakra: 'Throat',
    keywords: ['master change', 'transformation', 'freedom', 'power']
  },

  56: {
    number: 56,
    meaning: 'Adventure / Care for travelers',
    action: 'Support explorers',
    element: 'Air',
    chakra: 'Heart',
    keywords: ['freedom', 'service', 'family', 'change']
  },

  57: {
    number: 57,
    meaning: 'Quest / Seek knowledge',
    action: 'Explore truth',
    element: 'Air',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'freedom', 'learning', 'introspection']
  },

  58: {
    number: 58,
    meaning: 'Liberation / Free resources',
    action: 'Release wealth',
    element: 'Fire',
    chakra: 'Solar Plexus',
    keywords: ['abundance', 'freedom', 'change', 'manifestation']
  },

  59: {
    number: 59,
    meaning: 'Release / Let go attachment',
    action: 'Free yourself',
    element: 'Air',
    chakra: 'Crown',
    keywords: ['completion', 'freedom', 'transformation', 'wisdom']
  },

  // 61-69: Nurture + Compound
  62: {
    number: 62,
    meaning: 'Balance / Harmonize care',
    action: 'Support equally',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['harmony', 'service', 'cooperation', 'love']
  },

  63: {
    number: 63,
    meaning: 'Expression / Share care',
    action: 'Create from love',
    element: 'Air',
    chakra: 'Heart',
    keywords: ['creativity', 'service', 'joy', 'harmony']
  },

  64: {
    number: 64,
    meaning: 'Home / Build nest',
    action: 'Create sanctuary',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['family', 'stability', 'structure', 'care']
  },

  65: {
    number: 65,
    meaning: 'Nurture / Free others',
    action: 'Empower growth',
    element: 'Earth',
    chakra: 'Throat',
    keywords: ['service', 'freedom', 'change', 'responsibility']
  },

  66: {
    number: 66,
    meaning: 'Unconditional / Love without limit',
    action: 'Serve selflessly',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['master healer', 'service', 'compassion', 'harmony']
  },

  67: {
    number: 67,
    meaning: 'Wisdom / Care intelligently',
    action: 'Nurture with insight',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'service', 'introspection', 'care']
  },

  68: {
    number: 68,
    meaning: 'Abundance / Share prosperity',
    action: 'Distribute wealth',
    element: 'Earth',
    chakra: 'Solar Plexus',
    keywords: ['manifestation', 'service', 'abundance', 'responsibility']
  },

  69: {
    number: 69,
    meaning: 'Healing / Release with love',
    action: 'Complete with grace',
    element: 'Water',
    chakra: 'Heart',
    keywords: ['completion', 'service', 'wisdom', 'compassion']
  },

  // 71-79: Reflection + Compound
  71: {
    number: 71,
    meaning: 'Analysis / Decode alone',
    action: 'Study independently',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'introspection', 'independence', 'truth']
  },

  72: {
    number: 72,
    meaning: 'Intuition / Trust the knowing',
    action: 'Listen inwardly',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['intuition', 'cooperation', 'wisdom', 'balance']
  },

  73: {
    number: 73,
    meaning: 'Wisdom / Speak truth',
    action: 'Express insight',
    element: 'Water',
    chakra: 'Throat',
    keywords: ['wisdom', 'creativity', 'introspection', 'truth']
  },

  74: {
    number: 74,
    meaning: 'Foundation / Build on data',
    action: 'Structure knowledge',
    element: 'Earth',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'discipline', 'structure', 'analysis']
  },

  75: {
    number: 75,
    meaning: 'Discovery / Explore unknown',
    action: 'Research freely',
    element: 'Air',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'freedom', 'change', 'learning']
  },

  76: {
    number: 76,
    meaning: 'Wisdom / Teach with care',
    action: 'Guide lovingly',
    element: 'Water',
    chakra: 'Heart',
    keywords: ['wisdom', 'service', 'introspection', 'compassion']
  },

  77: {
    number: 77,
    meaning: 'Mastery / Channel perfection',
    action: 'Embody wisdom',
    element: 'Water',
    chakra: 'Crown',
    keywords: ['master wisdom', 'spiritual', 'intuition', 'perfection']
  },

  78: {
    number: 78,
    meaning: 'Wealth / Price wisdom',
    action: 'Monetize knowledge',
    element: 'Earth',
    chakra: 'Third Eye',
    keywords: ['wisdom', 'abundance', 'manifestation', 'power']
  },

  79: {
    number: 79,
    meaning: 'Integration / Complete learning',
    action: 'Synthesize knowledge',
    element: 'Water',
    chakra: 'Crown',
    keywords: ['wisdom', 'completion', 'introspection', 'transformation']
  },

  // 81-89: Power + Compound
  81: {
    number: 81,
    meaning: 'Authority / Lead decisively',
    action: 'Command alone',
    element: 'Fire',
    chakra: 'Solar Plexus',
    keywords: ['power', 'independence', 'leadership', 'manifestation']
  },

  82: {
    number: 82,
    meaning: 'Alliance / Power in pairs',
    action: 'Partner strategically',
    element: 'Earth',
    chakra: 'Sacral',
    keywords: ['power', 'cooperation', 'balance', 'abundance']
  },

  83: {
    number: 83,
    meaning: 'Influence / Amplify voice',
    action: 'Express power',
    element: 'Fire',
    chakra: 'Throat',
    keywords: ['power', 'creativity', 'manifestation', 'expression']
  },

  84: {
    number: 84,
    meaning: 'Empire / Build to scale',
    action: 'Systematize power',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['power', 'structure', 'abundance', 'discipline']
  },

  85: {
    number: 85,
    meaning: 'Disruption / Break monopolies',
    action: 'Challenge power',
    element: 'Fire',
    chakra: 'Throat',
    keywords: ['power', 'freedom', 'change', 'transformation']
  },

  86: {
    number: 86,
    meaning: 'Steward / Manage abundance',
    action: 'Distribute wisely',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['power', 'service', 'responsibility', 'abundance']
  },

  87: {
    number: 87,
    meaning: 'Strategy / Plan with power',
    action: 'Execute intelligently',
    element: 'Fire',
    chakra: 'Third Eye',
    keywords: ['power', 'wisdom', 'manifestation', 'analysis']
  },

  88: {
    number: 88,
    meaning: 'Mastery / Infinite abundance',
    action: 'Multiply wealth',
    element: 'Earth',
    chakra: 'Solar Plexus',
    keywords: ['master manifestor', 'power', 'abundance', 'infinity']
  },

  89: {
    number: 89,
    meaning: 'Legacy / Complete empire',
    action: 'Harvest power',
    element: 'Fire',
    chakra: 'Crown',
    keywords: ['power', 'completion', 'abundance', 'wisdom']
  },

  // 91-99: Completion + Compound
  91: {
    number: 91,
    meaning: 'Closure / End to begin',
    action: 'Release to create',
    element: 'Fire',
    chakra: 'Crown',
    keywords: ['completion', 'independence', 'transformation', 'new beginning']
  },

  92: {
    number: 92,
    meaning: 'Resolution / Balance endings',
    action: 'Close gracefully',
    element: 'Water',
    chakra: 'Sacral',
    keywords: ['completion', 'cooperation', 'balance', 'wisdom']
  },

  93: {
    number: 93,
    meaning: 'Expression / Share the lesson',
    action: 'Teach completion',
    element: 'Air',
    chakra: 'Throat',
    keywords: ['completion', 'creativity', 'wisdom', 'expression']
  },

  94: {
    number: 94,
    meaning: 'Foundation / Lock the learning',
    action: 'Solidify wisdom',
    element: 'Earth',
    chakra: 'Root',
    keywords: ['completion', 'discipline', 'structure', 'transformation']
  },

  95: {
    number: 95,
    meaning: 'Liberation / Final release',
    action: 'Free completely',
    element: 'Air',
    chakra: 'Crown',
    keywords: ['completion', 'freedom', 'transformation', 'change']
  },

  96: {
    number: 96,
    meaning: 'Harvest / Reap with love',
    action: 'Complete service',
    element: 'Earth',
    chakra: 'Heart',
    keywords: ['completion', 'service', 'wisdom', 'compassion']
  },

  97: {
    number: 97,
    meaning: 'Wisdom / Integrate fully',
    action: 'Embody learning',
    element: 'Water',
    chakra: 'Third Eye',
    keywords: ['completion', 'wisdom', 'introspection', 'mastery']
  },

  98: {
    number: 98,
    meaning: 'Abundance / Complete wealth',
    action: 'Harvest prosperity',
    element: 'Earth',
    chakra: 'Solar Plexus',
    keywords: ['completion', 'power', 'abundance', 'manifestation']
  },

  99: {
    number: 99,
    meaning: 'Mastery / Universal service',
    action: 'Give everything',
    element: 'Fire',
    chakra: 'Crown',
    keywords: ['master completion', 'wisdom', 'humanitarianism', 'transformation'],
    emoji: '🌍'
  }
};

/**
 * Get a number's meaning from the oracle bank
 */
export function getOracleMeaning(number: number): NumberMeaning | null {
  if (number < 1 || number > 99) return null;
  return ORACLE_MEANING_BANK[number] || null;
}

/**
 * Get multiple meanings at once
 */
export function getOracleMeanings(numbers: number[]): NumberMeaning[] {
  return numbers
    .map(n => getOracleMeaning(n))
    .filter((m): m is NumberMeaning => m !== null);
}

/**
 * Element emoji mapping
 */
export const ELEMENT_EMOJI: Record<Element, string> = {
  Fire: '🜂',
  Air: '🜁',
  Earth: '🜃',
  Water: '🜄'
};

/**
 * Chakra emoji mapping
 */
export const CHAKRA_EMOJI: Record<Chakra, string> = {
  'Root': '❤️',
  'Sacral': '🧡',
  'Solar Plexus': '💛',
  'Heart': '💚',
  'Throat': '💙',
  'Third Eye': '💜',
  'Crown': '🤍'
};
