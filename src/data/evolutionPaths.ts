export interface EvolutionPath {
  fromNumber: number;
  toNumber: number;
  pathType: 'adjacent' | 'challenge';
  description: string;
}

export const EVOLUTION_PATHS: EvolutionPath[] = [
  // 1 - Initiator paths
  { fromNumber: 1, toNumber: 2, pathType: 'adjacent', description: 'Develop empathy; balance assertion with listening' },
  { fromNumber: 1, toNumber: 4, pathType: 'adjacent', description: 'Build consistency and structure to sustain your fire' },
  { fromNumber: 1, toNumber: 5, pathType: 'adjacent', description: 'Learn adaptability; allow curiosity to shape evolution' },
  { fromNumber: 1, toNumber: 8, pathType: 'challenge', description: 'Refine authority through integrity — lead by resonance, not pressure' },

  // 2 - Balancer paths
  { fromNumber: 2, toNumber: 1, pathType: 'adjacent', description: 'Cultivate assertive clarity and decisive action' },
  { fromNumber: 2, toNumber: 3, pathType: 'adjacent', description: 'Express yourself creatively and authentically' },
  { fromNumber: 2, toNumber: 6, pathType: 'adjacent', description: 'Balance care with healthy boundaries' },
  { fromNumber: 2, toNumber: 7, pathType: 'challenge', description: 'Develop inner stillness and contemplative depth' },

  // 3 - Expressor paths
  { fromNumber: 3, toNumber: 2, pathType: 'adjacent', description: 'Deepen listening skills and emotional attunement' },
  { fromNumber: 3, toNumber: 4, pathType: 'adjacent', description: 'Add structure and discipline to creative expression' },
  { fromNumber: 3, toNumber: 5, pathType: 'adjacent', description: 'Embrace experimentation and creative risk-taking' },
  { fromNumber: 3, toNumber: 6, pathType: 'challenge', description: 'Channel expression into service and nurturing' },

  // 4 - Architect paths
  { fromNumber: 4, toNumber: 1, pathType: 'adjacent', description: 'Develop decisive leadership and bold action' },
  { fromNumber: 4, toNumber: 3, pathType: 'adjacent', description: 'Introduce playfulness and creative flexibility' },
  { fromNumber: 4, toNumber: 8, pathType: 'adjacent', description: 'Expand into visionary stewardship and mastery' },
  { fromNumber: 4, toNumber: 5, pathType: 'challenge', description: 'Learn to flow with change while maintaining stability' },

  // 5 - Wanderer paths
  { fromNumber: 5, toNumber: 2, pathType: 'adjacent', description: 'Develop emotional attunement and relational awareness' },
  { fromNumber: 5, toNumber: 4, pathType: 'adjacent', description: 'Ground your energy with structure and routine' },
  { fromNumber: 5, toNumber: 7, pathType: 'adjacent', description: 'Cultivate reflective wisdom and inner knowing' },
  { fromNumber: 5, toNumber: 8, pathType: 'challenge', description: 'Channel freedom into focused leadership' },

  // 6 - Caretaker paths
  { fromNumber: 6, toNumber: 2, pathType: 'adjacent', description: 'Find balance between giving and receiving' },
  { fromNumber: 6, toNumber: 8, pathType: 'adjacent', description: 'Integrate leadership with compassionate care' },
  { fromNumber: 6, toNumber: 9, pathType: 'adjacent', description: 'Serve without martyrdom; embrace completion' },
  { fromNumber: 6, toNumber: 3, pathType: 'challenge', description: 'Express joy and creativity alongside nurturing' },

  // 7 - Seeker paths
  { fromNumber: 7, toNumber: 3, pathType: 'adjacent', description: 'Share your insights through creative expression' },
  { fromNumber: 7, toNumber: 5, pathType: 'adjacent', description: 'Explore with courage; let wisdom guide adventure' },
  { fromNumber: 7, toNumber: 9, pathType: 'adjacent', description: 'Integrate compassion into your pursuit of truth' },
  { fromNumber: 7, toNumber: 1, pathType: 'challenge', description: 'Move from contemplation into decisive action' },

  // 8 - Leader paths
  { fromNumber: 8, toNumber: 2, pathType: 'adjacent', description: 'Develop relational wisdom and empathetic leadership' },
  { fromNumber: 8, toNumber: 4, pathType: 'adjacent', description: 'Build sustainable systems and structures' },
  { fromNumber: 8, toNumber: 9, pathType: 'adjacent', description: 'Lead with purpose beyond personal gain' },
  { fromNumber: 8, toNumber: 6, pathType: 'challenge', description: 'Soften authority with compassionate care' },

  // 9 - Humanitarian paths
  { fromNumber: 9, toNumber: 6, pathType: 'adjacent', description: 'Practice healthy care without self-sacrifice' },
  { fromNumber: 9, toNumber: 7, pathType: 'adjacent', description: 'Develop discernment in your service' },
  { fromNumber: 9, toNumber: 1, pathType: 'adjacent', description: 'Make clean new starts; release the old with grace' },
  { fromNumber: 9, toNumber: 3, pathType: 'challenge', description: 'Find joy and lightness in your wisdom' },

  // Master number evolution paths
  { fromNumber: 11, toNumber: 1, pathType: 'adjacent', description: 'Ground visionary insight into decisive action' },
  { fromNumber: 11, toNumber: 2, pathType: 'adjacent', description: 'Deepen empathetic resonance and relational wisdom' },
  { fromNumber: 11, toNumber: 22, pathType: 'adjacent', description: 'Transform inspiration into tangible manifestation' },

  { fromNumber: 22, toNumber: 4, pathType: 'adjacent', description: 'Master the fundamentals of structure and discipline' },
  { fromNumber: 22, toNumber: 8, pathType: 'adjacent', description: 'Integrate visionary architecture with executive mastery' },
  { fromNumber: 22, toNumber: 33, pathType: 'adjacent', description: 'Infuse your creations with compassionate purpose' },

  { fromNumber: 33, toNumber: 6, pathType: 'adjacent', description: 'Return to the heart of nurturing and care' },
  { fromNumber: 33, toNumber: 9, pathType: 'adjacent', description: 'Embrace completion and wise release' },
  { fromNumber: 33, toNumber: 11, pathType: 'adjacent', description: 'Channel healing wisdom into visionary insight' }
];
