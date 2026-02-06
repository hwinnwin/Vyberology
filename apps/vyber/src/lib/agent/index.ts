/**
 * VybeR Browsing Agent
 *
 * A self-hosted browsing agent that can perform web tasks autonomously.
 * Replaces expensive external browser automation services.
 *
 * Features:
 * - Navigate and interact with web pages
 * - Extract text and links from pages
 * - Fill forms and click elements
 * - Multi-step task completion with Claude tool_use
 * - Works in both PWA and Tauri modes
 *
 * Usage:
 * ```ts
 * import { runAgent } from "@/lib/agent";
 *
 * const result = await runAgent(
 *   "Search for flights to Tokyo and list the top 5 options",
 *   browserContext,
 *   { onThinking: console.log }
 * );
 * ```
 */

export { AGENT_TOOLS, type Tool, type ToolResult, type ToolName } from "./tools";
export { executeTool, stopTauriAgent } from "./executor";
export {
  runAgent,
  queryAgent,
  type AgentMessage,
  type AgentContext,
  type AgentConfig,
} from "./orchestrator";

// Re-export Tauri-specific executor for direct access
export * from "./tauri-executor";
