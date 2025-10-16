export interface KeystoneAction {
  archetypeNumber: number;
  action: string;
  xpValue: number;
  category: string;
}

export const KEYSTONE_ACTIONS: KeystoneAction[] = [
  // 1 - Initiator actions
  { archetypeNumber: 1, action: 'Launch one small, intentional project — start with awareness', xpValue: 5, category: 'creation' },
  { archetypeNumber: 1, action: 'Facilitate a group decision using questions instead of commands', xpValue: 4, category: 'leadership' },
  { archetypeNumber: 1, action: 'Journal: Did I move from impulse or clarity today?', xpValue: 2, category: 'reflection' },
  { archetypeNumber: 1, action: 'Practice grounding breath before taking action', xpValue: 2, category: 'ritual' },

  // 2 - Balancer actions
  { archetypeNumber: 2, action: 'Speak a hard truth with compassion', xpValue: 5, category: 'communication' },
  { archetypeNumber: 2, action: 'Spend a day consciously balancing "yes" and "no"', xpValue: 4, category: 'boundaries' },
  { archetypeNumber: 2, action: 'Mediate a small conflict with presence', xpValue: 4, category: 'service' },
  { archetypeNumber: 2, action: 'Listen to someone without offering solutions', xpValue: 3, category: 'empathy' },

  // 3 - Expressor actions
  { archetypeNumber: 3, action: 'Create and share something without editing for approval', xpValue: 5, category: 'creation' },
  { archetypeNumber: 3, action: 'Turn a difficult conversation into collaborative dialogue', xpValue: 4, category: 'communication' },
  { archetypeNumber: 3, action: 'Complete one creative project you\'ve been avoiding', xpValue: 4, category: 'discipline' },
  { archetypeNumber: 3, action: 'Journal about what you truly want to express', xpValue: 2, category: 'reflection' },

  // 4 - Architect actions
  { archetypeNumber: 4, action: 'Organize one area of chaos into sustainable structure', xpValue: 5, category: 'organization' },
  { archetypeNumber: 4, action: 'Build a new helpful routine and maintain it for 7 days', xpValue: 5, category: 'discipline' },
  { archetypeNumber: 4, action: 'Create a clear plan for a long-term goal', xpValue: 4, category: 'strategy' },
  { archetypeNumber: 4, action: 'Practice flexibility within your structure', xpValue: 3, category: 'growth' },

  // 5 - Wanderer actions
  { archetypeNumber: 5, action: 'Consciously change one routine and observe the impact', xpValue: 4, category: 'exploration' },
  { archetypeNumber: 5, action: 'Try something completely new with beginner\'s mind', xpValue: 4, category: 'courage' },
  { archetypeNumber: 5, action: 'Approach a familiar problem from a new angle', xpValue: 3, category: 'innovation' },
  { archetypeNumber: 5, action: 'Journal about what freedom means to you today', xpValue: 2, category: 'reflection' },

  // 6 - Caretaker actions
  { archetypeNumber: 6, action: 'Care for yourself before caring for others', xpValue: 5, category: 'self-care' },
  { archetypeNumber: 6, action: 'Set a compassionate boundary with someone', xpValue: 4, category: 'boundaries' },
  { archetypeNumber: 6, action: 'Create beauty in your environment intentionally', xpValue: 3, category: 'service' },
  { archetypeNumber: 6, action: 'Practice saying no without guilt', xpValue: 3, category: 'empowerment' },

  // 7 - Seeker actions
  { archetypeNumber: 7, action: 'Spend 20 minutes in complete silence and stillness', xpValue: 4, category: 'contemplation' },
  { archetypeNumber: 7, action: 'Write down one deep insight that emerged today', xpValue: 3, category: 'wisdom' },
  { archetypeNumber: 7, action: 'Study something that fascinates you with full attention', xpValue: 3, category: 'learning' },
  { archetypeNumber: 7, action: 'Practice discernment in what information you consume', xpValue: 2, category: 'discipline' },

  // 8 - Leader actions
  { archetypeNumber: 8, action: 'Make a clear decision you\'ve been avoiding', xpValue: 5, category: 'leadership' },
  { archetypeNumber: 8, action: 'Delegate a task and trust the process', xpValue: 4, category: 'trust' },
  { archetypeNumber: 8, action: 'Lead a project with integrity and clear vision', xpValue: 5, category: 'mastery' },
  { archetypeNumber: 8, action: 'Practice guiding energy instead of controlling it', xpValue: 3, category: 'refinement' },

  // 9 - Humanitarian actions
  { archetypeNumber: 9, action: 'Complete and release something that\'s been lingering', xpValue: 5, category: 'completion' },
  { archetypeNumber: 9, action: 'Serve others without needing recognition', xpValue: 4, category: 'service' },
  { archetypeNumber: 9, action: 'Practice forgiveness — of yourself or another', xpValue: 4, category: 'compassion' },
  { archetypeNumber: 9, action: 'Let go of something with gratitude', xpValue: 3, category: 'release' },

  // 11 - Visionary actions
  { archetypeNumber: 11, action: 'Capture and structure one intuitive flash', xpValue: 5, category: 'channeling' },
  { archetypeNumber: 11, action: 'Share an inspired insight with someone who needs it', xpValue: 4, category: 'transmission' },
  { archetypeNumber: 11, action: 'Ground your vision in one practical action', xpValue: 4, category: 'manifestation' },
  { archetypeNumber: 11, action: 'Practice being present when overwhelmed', xpValue: 3, category: 'grounding' },

  // 22 - Master Builder actions
  { archetypeNumber: 22, action: 'Break one big vision into actionable steps', xpValue: 5, category: 'strategy' },
  { archetypeNumber: 22, action: 'Build something that will outlast you', xpValue: 6, category: 'legacy' },
  { archetypeNumber: 22, action: 'Collaborate on a project with shared vision', xpValue: 4, category: 'partnership' },
  { archetypeNumber: 22, action: 'Practice letting go of perfectionism', xpValue: 3, category: 'growth' },

  // 33 - Master Healer actions
  { archetypeNumber: 33, action: 'Offer compassionate support without fixing', xpValue: 5, category: 'healing' },
  { archetypeNumber: 33, action: 'Teach something you\'ve mastered with humility', xpValue: 5, category: 'teaching' },
  { archetypeNumber: 33, action: 'Create a practice of embodied self-compassion', xpValue: 4, category: 'self-care' },
  { archetypeNumber: 33, action: 'Hold space for someone\'s transformation', xpValue: 4, category: 'service' }
];
