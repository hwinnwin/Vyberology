/**
 * VybeR Agent - Tauri Native Executor
 *
 * Executes agent tools via Tauri's Rust backend using Chrome DevTools Protocol.
 * This provides full browser automation without iframe limitations.
 */

import { invoke } from "@tauri-apps/api/core";
import type { ToolResult, ToolName } from "./tools";

interface TauriAgentResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Start the browser agent (launches Chrome/Chromium)
 * @param headless - Run browser in headless mode (no visible window)
 */
export async function startAgent(headless = true): Promise<ToolResult> {
  try {
    const result = await invoke<TauriAgentResult>("agent_start", { headless });
    return {
      success: result.success,
      data: result.data,
      error: result.error,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Stop the browser agent
 */
export async function stopAgent(): Promise<ToolResult> {
  try {
    const result = await invoke<TauriAgentResult>("agent_stop");
    return {
      success: result.success,
      data: result.data,
      error: result.error,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Execute a tool using the Tauri backend
 */
export async function executeTauriTool(
  name: ToolName,
  input: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (name) {
      case "navigate": {
        const url = input.url as string;
        const result = await invoke<TauriAgentResult>("agent_navigate", { url });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "extract_text": {
        const selector = input.selector as string | undefined;
        const maxLength = input.max_length as number | undefined;
        const result = await invoke<TauriAgentResult>("agent_extract_text", {
          selector,
          maxLength,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "extract_links": {
        const selector = input.selector as string | undefined;
        const maxLinks = input.max_links as number | undefined;
        const result = await invoke<TauriAgentResult>("agent_extract_links", {
          selector,
          maxLinks,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "click": {
        const selector = input.selector as string | undefined;
        const text = input.text as string | undefined;
        const result = await invoke<TauriAgentResult>("agent_click", {
          selector,
          text,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "fill_form": {
        const selector = input.selector as string;
        const value = input.value as string;
        const submit = (input.submit as boolean) || false;
        const result = await invoke<TauriAgentResult>("agent_fill_form", {
          selector,
          value,
          submit,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "screenshot": {
        const fullPage = (input.full_page as boolean) || false;
        const result = await invoke<TauriAgentResult>("agent_screenshot", {
          fullPage,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "scroll": {
        const direction = (input.direction as string) || "down";
        const amount = input.amount as number | undefined;
        const result = await invoke<TauriAgentResult>("agent_scroll", {
          direction,
          amount,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "wait": {
        const selector = input.selector as string | undefined;
        const timeout = input.timeout as number | undefined;
        const result = await invoke<TauriAgentResult>("agent_wait", {
          selector,
          timeout,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "get_page_info": {
        const result = await invoke<TauriAgentResult>("agent_get_page_info");
        return { success: result.success, data: result.data, error: result.error };
      }

      case "search_google": {
        const query = input.query as string;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const result = await invoke<TauriAgentResult>("agent_navigate", {
          url: searchUrl,
        });
        return {
          success: result.success,
          data: { searched: query, url: searchUrl, navigated: result.data },
          error: result.error,
        };
      }

      case "open_tab":
      case "close_tab":
        // These are handled at the orchestrator level for Tauri
        return { success: true, data: { note: "Tab operations managed by orchestrator" } };

      case "complete":
        return {
          success: true,
          data: {
            summary: input.summary,
            result: input.data || null,
            completed: true,
          },
        };

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Simple HTTP fetch without launching a full browser
 * (Uses reqwest in Rust, no Chrome needed)
 */
export async function fetchPage(url: string): Promise<ToolResult> {
  try {
    const result = await invoke<TauriAgentResult>("agent_fetch_page", { url });
    return {
      success: result.success,
      data: result.data,
      error: result.error,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Execute arbitrary JavaScript on the current page
 */
export async function evaluateJs(script: string): Promise<ToolResult> {
  try {
    const result = await invoke<TauriAgentResult>("agent_evaluate_js", { script });
    return {
      success: result.success,
      data: result.data,
      error: result.error,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
