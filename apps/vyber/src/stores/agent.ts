/**
 * VybeR Agent Store
 *
 * Manages the browsing agent state and provides methods to run agent tasks.
 */

import { create } from "zustand";
import { runAgent, type AgentContext, type ToolResult } from "@/lib/agent";
import { useTabsStore } from "./tabs";

export interface AgentStep {
  type: "thinking" | "tool_call" | "tool_result" | "complete" | "error";
  timestamp: number;
  content: string;
  tool?: string;
  input?: unknown;
  result?: ToolResult;
}

interface AgentState {
  isRunning: boolean;
  currentTask: string | null;
  steps: AgentStep[];
  result: { success: boolean; summary?: string; data?: unknown; error?: string } | null;
  iframeRef: HTMLIFrameElement | null;

  // Actions
  setIframeRef: (ref: HTMLIFrameElement | null) => void;
  runTask: (task: string, apiKey?: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  isRunning: false,
  currentTask: null,
  steps: [],
  result: null,
  iframeRef: null,

  setIframeRef: (ref) => set({ iframeRef: ref }),

  runTask: async (task, apiKey) => {
    const tabsStore = useTabsStore.getState();

    // Use provided API key or load from localStorage
    const finalApiKey = apiKey || localStorage.getItem("vyber_claude_api_key") || undefined;

    set({
      isRunning: true,
      currentTask: task,
      steps: [],
      result: null,
    });

    const context: AgentContext = {
      activeTabId: tabsStore.activeTabId,
      navigate: tabsStore.navigate,
      addTab: tabsStore.addTab,
      closeTab: tabsStore.closeTab,
      getIframeRef: () => get().iframeRef,
    };

    const addStep = (step: Omit<AgentStep, "timestamp">) => {
      set((state) => ({
        steps: [...state.steps, { ...step, timestamp: Date.now() }],
      }));
    };

    try {
      const result = await runAgent(task, context, {
        apiKey: finalApiKey,
        onThinking: (thought) => {
          addStep({ type: "thinking", content: thought });
        },
        onToolCall: (tool, input) => {
          addStep({
            type: "tool_call",
            content: `Calling ${tool}`,
            tool,
            input,
          });
        },
        onToolResult: (tool, result) => {
          addStep({
            type: "tool_result",
            content: result.success
              ? `${tool} succeeded`
              : `${tool} failed: ${result.error}`,
            tool,
            result,
          });
        },
        onComplete: (summary) => {
          addStep({ type: "complete", content: summary });
        },
        onError: (error) => {
          addStep({ type: "error", content: error });
        },
      });

      set({ result, isRunning: false });
    } catch (error) {
      const errorResult = {
        success: false,
        error: String(error),
      };
      set({ result: errorResult, isRunning: false });
    }
  },

  stop: () => {
    // TODO: Implement cancellation
    set({ isRunning: false });
  },

  clear: () => {
    set({
      isRunning: false,
      currentTask: null,
      steps: [],
      result: null,
    });
  },
}));
