/**
 * THE VYBER - Consciousness Layer
 * Energy Hygiene - 80% Day Optimization
 *
 * From 0616: "If a system needs you at 100% energy to work, it's broken.
 * Build for 80% days that still win."
 *
 * This module ensures THE VYBER works when users are tired, distracted,
 * or not at their best. Because that's most days.
 */

/**
 * Result of auditing a feature for energy requirements
 */
export interface EnergyAudit {
  feature: string;
  energyRequired: 'low' | 'medium' | 'high' | 'critical';
  automatable: boolean;
  failsGracefully: boolean;
  recommendations: string[];
  score: number;
}

/**
 * Input for feature energy audit
 */
export interface FeatureEnergyInput {
  name: string;
  requiresDecision: boolean;
  requiresMemory: boolean;
  requiresAttention: boolean;
  hasDefaults: boolean;
  recoversFromErrors: boolean;
  worksOffline: boolean;
}

/**
 * Audit a feature for energy requirements
 */
export function auditFeatureEnergy(feature: FeatureEnergyInput): EnergyAudit {
  let energyScore = 0;
  const recommendations: string[] = [];

  if (feature.requiresDecision) {
    energyScore += 2;
    recommendations.push('Add smart defaults to reduce decision fatigue');
  }

  if (feature.requiresMemory) {
    energyScore += 2;
    recommendations.push("Add persistence - don't make users remember");
  }

  if (feature.requiresAttention) {
    energyScore += 2;
    recommendations.push('Make it work in background or add notifications');
  }

  if (!feature.hasDefaults) {
    energyScore += 1;
    recommendations.push('Add sensible defaults that work for 80% of cases');
  }

  if (!feature.recoversFromErrors) {
    energyScore += 2;
    recommendations.push('Add error recovery - tired users make mistakes');
  }

  if (!feature.worksOffline) {
    energyScore += 1;
    recommendations.push('Consider offline functionality');
  }

  const energyLevel: EnergyAudit['energyRequired'] =
    energyScore <= 2 ? 'low' : energyScore <= 4 ? 'medium' : energyScore <= 6 ? 'high' : 'critical';

  return {
    feature: feature.name,
    energyRequired: energyLevel,
    automatable: energyScore <= 4,
    failsGracefully: feature.recoversFromErrors,
    recommendations,
    score: energyScore,
  };
}

/**
 * 80% Day Design Checklist Categories
 */
export const EIGHTY_PERCENT_DAY_CHECKLIST = [
  {
    category: 'Defaults',
    items: [
      'Every setting has a sensible default',
      'User can use feature without configuration',
      'Defaults optimize for safety/privacy',
      'Power users can customize later',
    ],
  },
  {
    category: 'Memory',
    items: [
      'System remembers user preferences',
      'Session survives browser close',
      'Form data is auto-saved',
      "User doesn't need to remember where they left off",
    ],
  },
  {
    category: 'Recovery',
    items: [
      'Undo is always available',
      'Errors are recoverable',
      'Accidental closes can be reversed',
      'Data is never permanently lost by user action',
    ],
  },
  {
    category: 'Automation',
    items: [
      'Repetitive tasks can be automated',
      'Agents handle routine work',
      'Notifications replace user vigilance',
      'System acts proactively when appropriate',
    ],
  },
  {
    category: 'Simplicity',
    items: [
      'Core action is one click/command',
      "UI doesn't overwhelm with options",
      'Most important actions are most visible',
      'Rarely-used features are hidden but accessible',
    ],
  },
] as const;

export type ChecklistCategory = (typeof EIGHTY_PERCENT_DAY_CHECKLIST)[number]['category'];

/**
 * Check if feature passes 80% day test
 */
export function passes80PercentDayTest(checklist: boolean[]): {
  passes: boolean;
  score: number;
  passRate: number;
} {
  const passingItems = checklist.filter(Boolean).length;
  const totalItems = checklist.length;
  const passRate = totalItems > 0 ? passingItems / totalItems : 0;

  return {
    passes: passRate >= 0.8,
    score: passingItems,
    passRate,
  };
}

/**
 * Get checklist items for a category
 */
export function getChecklistItems(category: ChecklistCategory): readonly string[] {
  const found = EIGHTY_PERCENT_DAY_CHECKLIST.find((c) => c.category === category);
  return found ? found.items : [];
}

/**
 * Get all checklist categories
 */
export function getChecklistCategories(): readonly ChecklistCategory[] {
  return EIGHTY_PERCENT_DAY_CHECKLIST.map((c) => c.category);
}

/**
 * Energy level recommendations
 */
export const ENERGY_LEVEL_GUIDANCE = {
  low: {
    description: 'Feature works with minimal user energy',
    emoji: '🟢',
    action: 'Good to ship',
  },
  medium: {
    description: 'Feature requires some focus but is manageable',
    emoji: '🟡',
    action: 'Consider adding automation or defaults',
  },
  high: {
    description: 'Feature demands significant user attention',
    emoji: '🟠',
    action: 'Redesign to reduce cognitive load',
  },
  critical: {
    description: 'Feature requires 100% energy - will fail on tired days',
    emoji: '🔴',
    action: 'Major redesign needed - violates 0616 principle',
  },
} as const;

/**
 * Get guidance for an energy level
 */
export function getEnergyGuidance(level: EnergyAudit['energyRequired']) {
  return ENERGY_LEVEL_GUIDANCE[level];
}
