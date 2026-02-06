/**
 * VybeR Agent Tool Executor
 *
 * Executes tool calls in the browser context.
 * Works in both PWA (iframe) and Tauri (native webview) modes.
 *
 * In Tauri mode, we use the native Rust backend with Chrome DevTools Protocol
 * for full browser automation without iframe restrictions.
 */

import type { ToolResult, ToolName } from "./tools";
import { isTauri } from "@/lib/platform";

type ToolInput = Record<string, unknown>;

// Flag to track if Tauri agent is started
let tauriAgentStarted = false;

/**
 * Execute a tool call from the agent
 * Automatically routes to Tauri backend when available
 */
export async function executeTool(
  name: ToolName,
  input: ToolInput,
  context: {
    activeTabId: string | null;
    navigate: (tabId: string, url: string) => void;
    addTab: () => string;
    closeTab: (tabId: string) => void;
    getIframeRef: () => HTMLIFrameElement | null;
  }
): Promise<ToolResult> {
  // Use Tauri backend for full browser automation when available
  if (isTauri) {
    return executeTauriTool(name, input, context);
  }

  const { activeTabId, navigate, addTab, closeTab, getIframeRef } = context;

  try {
    switch (name) {
      case "navigate": {
        const url = input.url as string;
        if (!activeTabId) {
          return { success: false, error: "No active tab" };
        }
        navigate(activeTabId, url);
        return { success: true, data: { navigated_to: url } };
      }

      case "extract_text": {
        const iframe = getIframeRef();
        if (!iframe) {
          return { success: false, error: "No iframe available (Tauri mode or no page loaded)" };
        }

        try {
          const doc = iframe.contentDocument;
          if (!doc) {
            return { success: false, error: "Cannot access iframe content (cross-origin)" };
          }

          const selector = input.selector as string | undefined;
          const maxLength = (input.max_length as number) || 8000;

          let text: string;
          if (selector) {
            const element = doc.querySelector(selector);
            text = element?.textContent || "";
          } else {
            // Extract main content, excluding scripts, styles, nav, etc.
            const body = doc.body.cloneNode(true) as HTMLElement;
            body.querySelectorAll("script, style, nav, header, footer, aside").forEach(el => el.remove());
            text = body.textContent || "";
          }

          // Clean up whitespace
          text = text.replace(/\s+/g, " ").trim();

          if (text.length > maxLength) {
            text = text.substring(0, maxLength) + "... [truncated]";
          }

          return { success: true, data: { text, length: text.length } };
        } catch (e) {
          return { success: false, error: `Failed to extract text: ${e}` };
        }
      }

      case "extract_links": {
        const iframe = getIframeRef();
        if (!iframe?.contentDocument) {
          return { success: false, error: "Cannot access page content" };
        }

        const doc = iframe.contentDocument;
        const selector = input.selector as string | undefined;
        const maxLinks = (input.max_links as number) || 50;

        const container = selector ? doc.querySelector(selector) : doc.body;
        if (!container) {
          return { success: false, error: `Selector not found: ${selector}` };
        }

        const links = Array.from(container.querySelectorAll("a[href]"))
          .slice(0, maxLinks)
          .map(a => ({
            text: a.textContent?.trim() || "",
            href: (a as HTMLAnchorElement).href,
          }))
          .filter(l => l.href && !l.href.startsWith("javascript:"));

        return { success: true, data: { links, count: links.length } };
      }

      case "click": {
        const iframe = getIframeRef();
        if (!iframe?.contentDocument) {
          return { success: false, error: "Cannot access page content" };
        }

        const doc = iframe.contentDocument;
        const selector = input.selector as string | undefined;
        const text = input.text as string | undefined;

        let element: Element | null = null;

        if (selector) {
          element = doc.querySelector(selector);
        } else if (text) {
          // Find element by visible text
          const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (node.textContent?.includes(text)) {
              element = node.parentElement;
              break;
            }
          }
        }

        if (!element) {
          return { success: false, error: "Element not found" };
        }

        (element as HTMLElement).click();
        return { success: true, data: { clicked: selector || text } };
      }

      case "fill_form": {
        const iframe = getIframeRef();
        if (!iframe?.contentDocument) {
          return { success: false, error: "Cannot access page content" };
        }

        const doc = iframe.contentDocument;
        const selector = input.selector as string;
        const value = input.value as string;
        const submit = input.submit as boolean;

        const element = doc.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!element) {
          return { success: false, error: `Input not found: ${selector}` };
        }

        element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));

        if (submit) {
          const form = element.closest("form");
          if (form) {
            form.submit();
          } else {
            // Try pressing Enter
            element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
          }
        }

        return { success: true, data: { filled: selector, value } };
      }

      case "screenshot": {
        // Screenshots require canvas API or Tauri native
        if (isTauri) {
          // TODO: Implement Tauri screenshot via invoke
          return { success: false, error: "Screenshots not yet implemented in Tauri mode" };
        }

        const iframe = getIframeRef();
        if (!iframe) {
          return { success: false, error: "No iframe available" };
        }

        // For same-origin iframes, we could use html2canvas
        // For cross-origin, we can't due to security restrictions
        return { success: false, error: "Screenshots require same-origin page or Tauri native mode" };
      }

      case "scroll": {
        const iframe = getIframeRef();
        if (!iframe?.contentWindow) {
          return { success: false, error: "Cannot access page" };
        }

        const win = iframe.contentWindow;
        const direction = input.direction as string | undefined;
        const selector = input.selector as string | undefined;
        const amount = (input.amount as number) || win.innerHeight;

        if (selector && iframe.contentDocument) {
          const element = iframe.contentDocument.querySelector(selector);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            return { success: true, data: { scrolled_to: selector } };
          }
        }

        switch (direction) {
          case "up":
            win.scrollBy({ top: -amount, behavior: "smooth" });
            break;
          case "down":
            win.scrollBy({ top: amount, behavior: "smooth" });
            break;
          case "top":
            win.scrollTo({ top: 0, behavior: "smooth" });
            break;
          case "bottom":
            win.scrollTo({ top: win.document.body.scrollHeight, behavior: "smooth" });
            break;
        }

        return { success: true, data: { scrolled: direction || selector } };
      }

      case "wait": {
        const selector = input.selector as string | undefined;
        const timeout = (input.timeout as number) || 5000;

        if (!selector) {
          await new Promise(resolve => setTimeout(resolve, timeout));
          return { success: true, data: { waited_ms: timeout } };
        }

        const iframe = getIframeRef();
        if (!iframe?.contentDocument) {
          return { success: false, error: "Cannot access page" };
        }

        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
          if (iframe.contentDocument.querySelector(selector)) {
            return { success: true, data: { found: selector, waited_ms: Date.now() - startTime } };
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return { success: false, error: `Timeout waiting for: ${selector}` };
      }

      case "get_page_info": {
        const iframe = getIframeRef();

        try {
          const doc = iframe?.contentDocument;
          const win = iframe?.contentWindow;

          return {
            success: true,
            data: {
              url: win?.location.href || "unknown",
              title: doc?.title || "unknown",
              description: doc?.querySelector('meta[name="description"]')?.getAttribute("content") || null,
              viewport: {
                width: win?.innerWidth || 0,
                height: win?.innerHeight || 0,
              },
            },
          };
        } catch {
          // Cross-origin - limited info available
          return {
            success: true,
            data: {
              url: "cross-origin (restricted)",
              title: "cross-origin (restricted)",
              note: "Page is cross-origin, detailed info unavailable",
            },
          };
        }
      }

      case "search_google": {
        const query = input.query as string;
        if (!activeTabId) {
          return { success: false, error: "No active tab" };
        }
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        navigate(activeTabId, searchUrl);
        return { success: true, data: { searched: query, url: searchUrl } };
      }

      case "open_tab": {
        const url = input.url as string | undefined;
        const newTabId = addTab();
        if (url) {
          navigate(newTabId, url);
        }
        return { success: true, data: { tab_id: newTabId, url: url || "vyber://newtab" } };
      }

      case "close_tab": {
        if (!activeTabId) {
          return { success: false, error: "No active tab" };
        }
        closeTab(activeTabId);
        return { success: true, data: { closed: activeTabId } };
      }

      case "complete": {
        return {
          success: true,
          data: {
            summary: input.summary,
            result: input.data || null,
            completed: true,
          },
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Execute tool using Tauri's native Rust backend
 * Uses Chrome DevTools Protocol for full browser automation
 */
async function executeTauriTool(
  name: ToolName,
  input: ToolInput,
  _context: {
    activeTabId: string | null;
    navigate: (tabId: string, url: string) => void;
    addTab: () => string;
    closeTab: (tabId: string) => void;
    getIframeRef: () => HTMLIFrameElement | null;
  }
): Promise<ToolResult> {
  // Dynamically import Tauri APIs only when needed
  const { invoke } = await import("@tauri-apps/api/core");

  interface TauriResult {
    success: boolean;
    data?: unknown;
    error?: string;
  }

  try {
    // Auto-start the browser agent if not already running
    if (!tauriAgentStarted && name !== "complete") {
      const startResult = await invoke<TauriResult>("agent_start", { headless: false });
      if (startResult.success) {
        tauriAgentStarted = true;
      } else {
        return { success: false, error: startResult.error || "Failed to start agent" };
      }
    }

    switch (name) {
      case "navigate": {
        const url = input.url as string;
        const result = await invoke<TauriResult>("agent_navigate", { url });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "extract_text": {
        const result = await invoke<TauriResult>("agent_extract_text", {
          selector: input.selector as string | undefined,
          maxLength: (input.max_length as number) || 8000,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "extract_links": {
        const result = await invoke<TauriResult>("agent_extract_links", {
          selector: input.selector as string | undefined,
          maxLinks: (input.max_links as number) || 50,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "click": {
        const result = await invoke<TauriResult>("agent_click", {
          selector: input.selector as string | undefined,
          text: input.text as string | undefined,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "fill_form": {
        const result = await invoke<TauriResult>("agent_fill_form", {
          selector: input.selector as string,
          value: input.value as string,
          submit: (input.submit as boolean) || false,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "screenshot": {
        const result = await invoke<TauriResult>("agent_screenshot", {
          fullPage: (input.full_page as boolean) || false,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "scroll": {
        const result = await invoke<TauriResult>("agent_scroll", {
          direction: (input.direction as string) || "down",
          amount: input.amount as number | undefined,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "wait": {
        const result = await invoke<TauriResult>("agent_wait", {
          selector: input.selector as string | undefined,
          timeout: input.timeout as number | undefined,
        });
        return { success: result.success, data: result.data, error: result.error };
      }

      case "get_page_info": {
        const result = await invoke<TauriResult>("agent_get_page_info");
        return { success: result.success, data: result.data, error: result.error };
      }

      case "search_google": {
        const query = input.query as string;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const result = await invoke<TauriResult>("agent_navigate", { url: searchUrl });
        return {
          success: result.success,
          data: { searched: query, url: searchUrl, navigated: result.data },
          error: result.error,
        };
      }

      case "open_tab": {
        // For Tauri, we can open a URL in the current browser instance
        const url = input.url as string | undefined;
        if (url) {
          const result = await invoke<TauriResult>("agent_navigate", { url });
          return { success: result.success, data: { url, navigated: result.data }, error: result.error };
        }
        return { success: true, data: { note: "New tab opened" } };
      }

      case "close_tab": {
        // For Tauri, this stops the browser agent
        const result = await invoke<TauriResult>("agent_stop");
        tauriAgentStarted = false;
        return { success: result.success, data: result.data, error: result.error };
      }

      case "complete": {
        return {
          success: true,
          data: {
            summary: input.summary,
            result: input.data || null,
            completed: true,
          },
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Stop the Tauri agent (cleanup)
 */
export async function stopTauriAgent(): Promise<void> {
  if (isTauri && tauriAgentStarted) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("agent_stop");
      tauriAgentStarted = false;
    } catch {
      // Ignore errors during cleanup
    }
  }
}
