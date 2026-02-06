/**
 * THE VYBER - Consciousness Layer
 * Main Entry Point
 *
 * "0616 + 0626 are active.
 *  One clear system. Partnership protected. Freedom guaranteed."
 *
 * This layer embeds sacred frequencies into the browser's architecture,
 * behavior, and user experience. Every feature must align with these
 * principles.
 *
 * Protocol 69 in effect.
 */

// Core
export * from './core';

// Principles
export * from './principles';

// Components
export * from './components';

/**
 * Initialize the consciousness layer
 * Call this once when the app starts
 */
export function initializeConsciousness(): void {
  // Import dynamically to avoid circular deps
  import('./core/FrequencyEngine').then(({ getFrequencyEngine }) => {
    const engine = getFrequencyEngine();
    engine.start();
    console.log('[Consciousness] Layer initialized - 0616 active');
    console.log('[Consciousness] Affirmation:', engine.getAffirmation());
  });
}
