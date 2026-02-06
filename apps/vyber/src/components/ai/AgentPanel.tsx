/**
 * Comet-style Agent Panel
 *
 * A side panel that shows the agent's thinking process and tool executions.
 * Inspired by Comet Browser's agent interface.
 */

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Play,
  Square,
  Trash2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  MousePointer,
  FileText,
  Link2,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAgentStore, type AgentStep } from "@/stores/agent";

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentPanel({ isOpen, onClose }: AgentPanelProps) {
  const [task, setTask] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  const { isRunning, steps, result, runTask, stop, clear } = useAgentStore();

  // Auto-scroll to latest step
  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!task.trim() || isRunning) return;
    runTask(task.trim());
    setTask("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-vyber-purple to-vyber-pink">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">VybeR Agent</h2>
            <p className="text-xs text-muted-foreground">
              {isRunning ? "Working..." : "Ready"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {steps.length > 0 && (
            <button
              onClick={clear}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="Clear history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4">
        {steps.length === 0 && !isRunning ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-vyber-purple/20 to-vyber-pink/20">
              <Sparkles className="h-8 w-8 text-vyber-purple" />
            </div>
            <h3 className="mb-2 font-medium">What can I help you with?</h3>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              I can browse the web, search for information, fill forms, and complete tasks for you.
            </p>
            <div className="space-y-2">
              {[
                "Search for flights to Tokyo next week",
                "Find the latest news about AI",
                "Look up the weather in San Francisco",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setTask(suggestion)}
                  className="block w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-left text-sm transition-colors hover:border-vyber-purple/50 hover:bg-secondary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} />
            ))}
            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={stepsEndRef} />
          </div>
        )}

        {/* Result */}
        {result && !isRunning && (
          <div
            className={`mt-4 rounded-lg border p-4 ${
              result.success
                ? "border-green-500/30 bg-green-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {result.success ? "Task Complete" : "Task Failed"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.summary || result.error}
            </p>
            {result.data !== undefined && result.data !== null && (
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-secondary/50 p-2 text-xs">
                {JSON.stringify(result.data as object, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what to do..."
            rows={2}
            disabled={isRunning}
            className="w-full resize-none rounded-lg border border-border bg-secondary/30 px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:border-vyber-purple focus:outline-none focus:ring-2 focus:ring-vyber-purple/20 disabled:opacity-50"
          />
          <button
            onClick={isRunning ? stop : handleSubmit}
            disabled={!task.trim() && !isRunning}
            className={`absolute bottom-3 right-3 rounded-lg p-2 transition-colors ${
              isRunning
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gradient-to-r from-vyber-purple to-vyber-pink text-white hover:opacity-90 disabled:opacity-50"
            }`}
          >
            {isRunning ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press Enter to run • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function StepCard({ step }: { step: AgentStep }) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (step.type) {
      case "thinking":
        return <Bot className="h-4 w-4 text-vyber-purple" />;
      case "tool_call":
        return getToolIcon(step.tool);
      case "tool_result":
        return step.result?.success ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        );
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const getToolIcon = (tool?: string) => {
    switch (tool) {
      case "navigate":
      case "search_google":
        return <Globe className="h-4 w-4 text-blue-500" />;
      case "click":
        return <MousePointer className="h-4 w-4 text-orange-500" />;
      case "extract_text":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "extract_links":
        return <Link2 className="h-4 w-4 text-cyan-500" />;
      case "fill_form":
        return <ArrowRight className="h-4 w-4 text-purple-500" />;
      default:
        return <Search className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTitle = () => {
    switch (step.type) {
      case "thinking":
        return "Thinking";
      case "tool_call":
        return `Using ${step.tool}`;
      case "tool_result":
        return `${step.tool} ${step.result?.success ? "succeeded" : "failed"}`;
      case "complete":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "Step";
    }
  };

  return (
    <div className="rounded-lg border border-border bg-secondary/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-3 text-left hover:bg-secondary/30"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{getTitle()}</p>
          <p className="truncate text-xs text-muted-foreground">
            {step.content.slice(0, 60)}
            {step.content.length > 60 ? "..." : ""}
          </p>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="border-t border-border bg-secondary/10 p-3">
          <p className="mb-2 text-sm whitespace-pre-wrap">{step.content}</p>
          {step.input !== undefined && step.input !== null && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground">Input:</p>
              <pre className="mt-1 rounded bg-secondary/50 p-2 text-xs overflow-auto max-h-24">
                {JSON.stringify(step.input as object, null, 2)}
              </pre>
            </div>
          )}
          {step.result && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground">Result:</p>
              <pre className="mt-1 rounded bg-secondary/50 p-2 text-xs overflow-auto max-h-24">
                {JSON.stringify(step.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AgentPanel;
