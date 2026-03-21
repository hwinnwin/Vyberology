// ============================================================
// Lumyn Intelligence Layer — Safety Layer (§5.4, §5.5)
// Crisis detection + overreach detection + crisis resources
// ============================================================

// ─────────────────────────────────────────────
// Crisis keyword lists
// ─────────────────────────────────────────────

const TIER_1_PHRASES = [
  'suicide',
  'suicidal',
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'end it all',
  'ending it all',
  'want to die',
  'wanting to die',
  "don't want to be here anymore",
  'dont want to be here anymore',
  'do not want to be here anymore',
  'harm myself',
  'harming myself',
  'hurt myself',
  'hurting myself',
  'self-harm',
  'self harm',
  'cut myself',
  'cutting myself',
  'take my own life',
  'taking my own life',
  'not want to live',
]

const TIER_2_PHRASES = [
  'feeling hopeless',
  'feel hopeless',
  'i feel hopeless',
  "can't go on",
  'cant go on',
  'cannot go on',
  'nobody cares',
  'no one cares',
  'nobody cares about me',
  'no one cares about me',
  'everything is pointless',
  'its all pointless',
  "it's all pointless",
  'no reason to live',
  'no reason for living',
  'nothing to live for',
]

// ─────────────────────────────────────────────
// Overreach flag phrases
// ─────────────────────────────────────────────

const OVERREACH_FLAGS = [
  'you should see a therapist',
  'you need professional help',
  'i diagnose',
  'you have a disorder',
  'you have a condition',
  'medically speaking',
  'you need therapy',
  'get professional help',
  'clinical diagnosis',
]

// ─────────────────────────────────────────────
// Crisis resources — AU (§5.5)
// ─────────────────────────────────────────────

export const ANCHOR_SAFE_RESPONSE =
  "I hear you. That sounds really heavy, and I want you to know you don't have to carry it alone right now. " +
  'Please reach out to someone who can be fully present with you.'

export const CRISIS_RESOURCES =
  '\n\n---\n' +
  '**If you\'re in crisis, please reach out:**\n' +
  '• Lifeline: 13 11 14 (24/7)\n' +
  '• Suicide Call Back Service: 1300 659 467\n' +
  '• Beyond Blue: 1300 22 4636\n' +
  '• Emergency: 000\n' +
  '• Kids Helpline: 1800 55 1800\n' +
  "• Crisis Text: Text 'HELLO' to 741741"

// ─────────────────────────────────────────────
// scanForCrisis
// ─────────────────────────────────────────────

export function scanForCrisis(message: string): {
  detected: boolean
  tier: 1 | 2 | null
  matchedPhrase: string | null
} {
  const lower = message.toLowerCase()

  for (const phrase of TIER_1_PHRASES) {
    if (lower.includes(phrase)) {
      return { detected: true, tier: 1, matchedPhrase: phrase }
    }
  }

  for (const phrase of TIER_2_PHRASES) {
    if (lower.includes(phrase)) {
      return { detected: true, tier: 2, matchedPhrase: phrase }
    }
  }

  return { detected: false, tier: null, matchedPhrase: null }
}

// ─────────────────────────────────────────────
// detectOverreach
// ─────────────────────────────────────────────

export function detectOverreach(responseText: string): {
  flags: string[]
  shouldDiscard: boolean
} {
  const lower = responseText.toLowerCase()
  const flags: string[] = []

  for (const flag of OVERREACH_FLAGS) {
    if (lower.includes(flag)) {
      flags.push(flag)
    }
  }

  return {
    flags,
    shouldDiscard: flags.length >= 2,
  }
}
