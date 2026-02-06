/**
 * THE VYBER - Agentic Engine
 * Main entry point for all agent functionality
 *
 * Unlike Atlas's 10-minute shopping cart chaos, we execute with precision
 */

// Types
export * from './types';

// Core
export * from './core';

// Web agents
export * from './web';

// Automation agents
export * from './automation';

// Initialize agents when imported
import { AgentRegistry } from './core';

// Re-export for convenience
export { AgentRegistry };

/**
 * Initialize the agentic engine
 * Call this once when the app starts
 */
export async function initializeAgenticEngine(): Promise<void> {
  console.log('[AgenticEngine] Initializing...');

  // Import all agents to register them
  // Each agent self-registers when imported
  await Promise.all([
    import('./web/DOMAgent'),
    import('./web/FormAgent'),
    import('./web/NavigationAgent'),
    import('./automation/RecordingAgent'),
  ]);

  console.log('[AgenticEngine] All agents registered');
  console.log('[AgenticEngine] Available agent types:', AgentRegistry.getRegisteredTypes().map(a => a.name));
  console.log('[AgenticEngine] Initialization complete');
}
