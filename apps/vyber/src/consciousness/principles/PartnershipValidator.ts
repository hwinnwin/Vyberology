/**
 * THE VYBER - Consciousness Layer
 * Partnership Validator - 0626 Frequency in Action
 *
 * "Protect the partnership. Care surrounds collaboration."
 *
 * This module ensures every feature respects the sacred pattern:
 * CARE (6) -> PARTNERSHIP (2) -> CARE (6) -> FREEDOM (5)
 *
 * Unlike Atlas (exploits) and Comet (has holes), THE VYBER PROTECTS.
 */

/**
 * Result of validating a feature against 0626 principles
 */
export interface PartnershipAudit {
  feature: string;
  protectsPartnership: boolean;
  preservesSovereignty: boolean;
  leadsToFreedom: boolean;
  hasCareOnBothSides: boolean;
  empowersNotExploits: boolean;
  overallScore: number; // 0-100
  warnings: string[];
  approved: boolean;
}

/**
 * Input for partnership validation
 */
export interface PartnershipFeatureInput {
  name: string;
  collectsData: boolean;
  dataUsedFor: 'user_benefit' | 'company_benefit' | 'both' | 'neither';
  userCanDisable: boolean;
  userCanDeleteData: boolean;
  userCanExport: boolean;
  createsLockIn: boolean;
  worksOffline: boolean;
  opensourceAlternativeExists: boolean;
}

/**
 * Validate a feature against the 0626 Partnership pattern
 * Every feature must pass through this filter
 */
export function validate0626Partnership(feature: PartnershipFeatureInput): PartnershipAudit {
  const warnings: string[] = [];
  let score = 100;

  // CHECK 1: Data Collection (Care Layer 1)
  if (feature.collectsData) {
    if (feature.dataUsedFor === 'company_benefit') {
      warnings.push('ATLAS PATTERN DETECTED: Data used for company, not user');
      score -= 40;
    } else if (feature.dataUsedFor === 'both') {
      warnings.push('Data benefits both - ensure user benefit is PRIMARY');
      score -= 10;
    }

    if (!feature.userCanDisable) {
      warnings.push('User cannot disable data collection - violates sovereignty');
      score -= 30;
    }

    if (!feature.userCanDeleteData) {
      warnings.push('User cannot delete their data - violates freedom');
      score -= 20;
    }
  }

  // CHECK 2: Partnership Balance (The 2)
  if (!feature.userCanExport) {
    warnings.push('No data export - creates subtle lock-in');
    score -= 15;
  }

  if (feature.createsLockIn) {
    warnings.push('Feature creates lock-in - opposite of freedom');
    score -= 30;
  }

  // CHECK 3: Freedom Result (The 5)
  if (!feature.worksOffline && !feature.opensourceAlternativeExists) {
    warnings.push('Requires connection + no alternatives = dependency');
    score -= 10;
  }

  // Calculate component scores
  const protectsPartnership = score >= 70;
  const preservesSovereignty = feature.userCanDisable && feature.userCanDeleteData;
  const leadsToFreedom = !feature.createsLockIn && feature.userCanExport;
  const hasCareOnBothSides = feature.dataUsedFor !== 'company_benefit';
  const empowersNotExploits =
    feature.dataUsedFor === 'user_benefit' || feature.dataUsedFor === 'neither';

  return {
    feature: feature.name,
    protectsPartnership,
    preservesSovereignty,
    leadsToFreedom,
    hasCareOnBothSides,
    empowersNotExploits,
    overallScore: Math.max(0, score),
    warnings,
    approved: score >= 70,
  };
}

/**
 * Competitor comparison - what we're up against
 */
export const COMPETITOR_PARTNERSHIP_SCORES = {
  atlas: {
    name: 'ChatGPT Atlas',
    collectsData: true,
    dataUsedFor: 'company_benefit' as const, // Trains OpenAI models
    userCanDisable: false, // "Browser memories" stored on servers
    userCanDeleteData: true, // After 30 days auto-delete
    userCanExport: false,
    createsLockIn: true, // ChatGPT ecosystem lock-in
    estimatedScore: 35,
    verdict: 'EXPLOITS PARTNERSHIP -> USER TRAPPED',
  },
  comet: {
    name: 'Perplexity Comet',
    collectsData: true,
    dataUsedFor: 'both' as const, // Feeds Perplexity search
    userCanDisable: true,
    userCanDeleteData: true,
    userCanExport: false,
    createsLockIn: true, // Perplexity ecosystem
    securityVulnerabilities: true, // CometJacking
    estimatedScore: 50,
    verdict: 'HOLES IN PARTNERSHIP -> USER VULNERABLE',
  },
  the_vyber: {
    name: 'THE VYBER',
    collectsData: true, // For user benefit only
    dataUsedFor: 'user_benefit' as const, // Guardian Aegis, personalization
    userCanDisable: true, // Everything toggleable
    userCanDeleteData: true, // Instant, no 30-day wait
    userCanExport: true, // Full data portability
    createsLockIn: false, // Can leave anytime
    securityVulnerabilities: false, // Guardian Aegis
    estimatedScore: 95,
    verdict: 'PROTECTS PARTNERSHIP -> USER FREE',
  },
} as const;

export type CompetitorKey = keyof typeof COMPETITOR_PARTNERSHIP_SCORES;

/**
 * 0626 Affirmations for developers
 */
export const PARTNERSHIP_AFFIRMATIONS = [
  'We wrap the partnership in care.',
  'User freedom is our north star.',
  'We protect, never exploit.',
  'Sovereignty is non-negotiable.',
  "The user can always leave - that's how we know they'll stay.",
  'Care on both sides. Freedom as the result.',
  'We are not Atlas. We are not Comet. We are THE VYBER.',
  'Every feature is a gift, not a trap.',
  'Data serves the user, or it does not exist.',
] as const;

/**
 * Get a random partnership affirmation
 */
export function getPartnershipAffirmation(): string {
  return PARTNERSHIP_AFFIRMATIONS[Math.floor(Math.random() * PARTNERSHIP_AFFIRMATIONS.length)];
}

/**
 * Get a specific competitor's partnership score
 */
export function getCompetitorScore(competitor: CompetitorKey) {
  return COMPETITOR_PARTNERSHIP_SCORES[competitor];
}

/**
 * Quick check: Does this feature pass the 0626 test?
 */
export function quickPartnershipCheck(feature: {
  exploitsUser: boolean;
  userCanLeave: boolean;
  benefitsUser: boolean;
}): { passes: boolean; reason: string } {
  if (feature.exploitsUser) {
    return { passes: false, reason: '0626 VIOLATION: Feature exploits user' };
  }
  if (!feature.userCanLeave) {
    return { passes: false, reason: '0626 VIOLATION: User cannot leave freely' };
  }
  if (!feature.benefitsUser) {
    return { passes: false, reason: '0626 VIOLATION: Feature does not benefit user' };
  }
  return { passes: true, reason: '0626 APPROVED: Partnership protected' };
}

/**
 * The 0626 Pattern visualization
 */
export const THE_0626_PATTERN = `
     [0 - RESET]
          |
     [6 - CARE]
          |
    [2 - PARTNERSHIP]
          |
     [6 - CARE]
          |
     [5 - FREEDOM]

"Care must WRAP the partnership.
 User freedom is the result."
`;

/**
 * Get the 0626 pattern as a string
 */
export function get0626Pattern(): string {
  return THE_0626_PATTERN;
}
