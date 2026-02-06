/**
 * VybeR Agent Orchestrator
 *
 * Manages the agent loop: sends prompts to Claude, receives tool calls,
 * executes them, and continues until the task is complete.
 */

import { AGENT_TOOLS, type Tool, type ToolResult } from "./tools";
import { executeTool } from "./executor";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
}

export interface AgentContext {
  activeTabId: string | null;
  navigate: (tabId: string, url: string) => void;
  addTab: () => string;
  closeTab: (tabId: string) => void;
  getIframeRef: () => HTMLIFrameElement | null;
}

export interface AgentConfig {
  apiKey?: string;
  proxyUrl?: string;
  model?: string;
  maxIterations?: number;
  onThinking?: (thought: string) => void;
  onToolCall?: (tool: string, input: unknown) => void;
  onToolResult?: (tool: string, result: ToolResult) => void;
  onComplete?: (summary: string, data?: unknown) => void;
  onError?: (error: string) => void;
}

const AGENT_SYSTEM_PROMPT = `You are VybeR, an AI browsing agent that can control a web browser to accomplish tasks.

You have access to browser tools that let you navigate, extract content, click elements, fill forms, and more.

IMPORTANT GUIDELINES:
1. Always start by understanding what the user wants to accomplish
2. Break complex tasks into smaller steps
3. Use extract_text or get_page_info to understand the current page before taking actions
4. When navigating, wait for pages to load before extracting content
5. Be careful with forms - verify you're on the right page before filling
6. If something fails, try an alternative approach
7. Call the "complete" tool when you've finished the task

You are part of the Vybe ecosystem - a suite of AI-powered tools. Be helpful, concise, and proactive.`;

/**
 * Run the agent loop for a given task
 */
export async function runAgent(
  task: string,
  context: AgentContext,
  config: AgentConfig
): Promise<{ success: boolean; summary?: string; data?: unknown; error?: string }> {
  const {
    apiKey,
    proxyUrl = "/.netlify/functions/claude-proxy",
    model = "claude-sonnet-4-20250514",
    maxIterations = 15,
    onThinking,
    onToolCall,
    onToolResult,
    onComplete,
    onError,
  } = config;

  const messages: AgentMessage[] = [
    { role: "user", content: task }
  ];

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    try {
      // Call Claude with tools
      const response = await callClaude(messages, {
        apiKey,
        proxyUrl,
        model,
        tools: AGENT_TOOLS,
        system: AGENT_SYSTEM_PROMPT,
      });

      // Process the response
      const assistantContent: ContentBlock[] = [];
      let hasToolUse = false;
      let isComplete = false;
      let completeSummary = "";
      let completeData: unknown;

      for (const block of response.content) {
        if (block.type === "text") {
          assistantContent.push({ type: "text", text: block.text });
          onThinking?.(block.text || "");
        } else if (block.type === "tool_use") {
          hasToolUse = true;
          assistantContent.push({
            type: "tool_use",
            id: block.id,
            name: block.name,
            input: block.input,
          });

          onToolCall?.(block.name || "unknown", block.input);

          // Check if this is the complete tool
          if (block.name === "complete") {
            isComplete = true;
            completeSummary = (block.input as { summary?: string })?.summary || "Task completed";
            completeData = (block.input as { data?: unknown })?.data;
          }
        }
      }

      // Add assistant message
      messages.push({ role: "assistant", content: assistantContent });

      // If no tool use, we're done (agent responded with just text)
      if (!hasToolUse) {
        const textContent = assistantContent.find(b => b.type === "text");
        return {
          success: true,
          summary: textContent?.text || "Task completed",
        };
      }

      // If complete tool was called, we're done
      if (isComplete) {
        onComplete?.(completeSummary, completeData);
        return {
          success: true,
          summary: completeSummary,
          data: completeData,
        };
      }

      // Execute tool calls and collect results
      const toolResults: ContentBlock[] = [];

      for (const block of assistantContent) {
        if (block.type === "tool_use" && block.name && block.id) {
          const result = await executeTool(
            block.name as Parameters<typeof executeTool>[0],
            block.input || {},
            context
          );

          onToolResult?.(block.name, result);

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
            is_error: !result.success,
          });

          // Small delay between tool executions for page loads
          if (["navigate", "click", "fill_form"].includes(block.name)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Add tool results as user message
      messages.push({ role: "user", content: toolResults });

    } catch (error) {
      const errorMsg = String(error);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  return {
    success: false,
    error: `Max iterations (${maxIterations}) reached without completion`,
  };
}

/**
 * Call Claude API with tools
 */
async function callClaude(
  messages: AgentMessage[],
  options: {
    apiKey?: string;
    proxyUrl: string;
    model: string;
    tools: Tool[];
    system: string;
  }
): Promise<{ content: ContentBlock[] }> {
  const { apiKey, proxyUrl, model, tools, system } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Use direct API if key provided, otherwise use proxy
  const url = apiKey
    ? "https://api.anthropic.com/v1/messages"
    : proxyUrl;

  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }

  const body = {
    model,
    max_tokens: 4096,
    system,
    tools,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Simple one-shot query (no tool use)
 */
export async function queryAgent(
  question: string,
  pageContext?: string,
  config?: Partial<AgentConfig>
): Promise<string> {
  const prompt = pageContext
    ? `Page content:\n${pageContext}\n\nUser question: ${question}`
    : question;

  const response = await callClaude(
    [{ role: "user", content: prompt }],
    {
      proxyUrl: config?.proxyUrl || "/.netlify/functions/claude-proxy",
      model: config?.model || "claude-sonnet-4-20250514",
      tools: [],
      system: "You are VybeR, a helpful AI browser assistant. Answer questions concisely based on the provided context.",
    }
  );

  const textBlock = response.content.find(b => b.type === "text");
  return textBlock?.text || "No response";
}
