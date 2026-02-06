import { useEffect, useRef } from "react";
import { X, Sparkles, Send, Loader2, Trash2, Search, ExternalLink, Globe } from "lucide-react";
import { useAIStore, SearchResult } from "@/stores/ai";
import { useTabsStore } from "@/stores/tabs";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What is the latest news today?",
  "Search for React 19 features",
  "Compare iPhone 15 vs Samsung S24",
  "How to learn TypeScript?",
  "What's the weather like?",
];

export function CommandPalette() {
  const {
    isOpen,
    isLoading,
    isSearching,
    messages,
    currentInput,
    close,
    setInput,
    sendMessage,
    clearMessages,
  } = useAIStore();

  const { navigate, activeTabId } = useTabsStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading) return;
    await sendMessage(currentInput.trim());
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleOpenUrl = (url: string) => {
    if (activeTabId) {
      navigate(activeTabId, url);
      close();
    }
  };

  // Render search results card
  const renderSearchResults = (results: SearchResult[]) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="h-3 w-3" />
        <span>Sources</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {results.slice(0, 5).map((result, i) => (
          <button
            key={i}
            onClick={() => handleOpenUrl(result.url)}
            className="group flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left transition-all hover:border-vyber-purple/50 hover:bg-secondary"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-vyber-purple/20 to-vyber-pink/20">
              <Globe className="h-3 w-3 text-vyber-purple" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{result.title}</p>
              <p className="truncate text-[10px] text-muted-foreground">{new URL(result.url).hostname}</p>
            </div>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );

  // Parse assistant messages for URLs and make them clickable
  const parseMessageForURLs = (content: string) => {
    // Handle citations like [1], [2]
    const citationRegex = /\[(\d+)\]/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    let result = content;

    // Replace URLs with clickable links
    const parts = result.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <button
            key={i}
            onClick={() => handleOpenUrl(part)}
            className="text-vyber-cyan underline hover:text-vyber-purple"
          >
            {part}
          </button>
        );
      }
      // Replace citation numbers with styled badges
      const citationParts = part.split(citationRegex);
      return citationParts.map((cp, j) => {
        if (/^\d+$/.test(cp)) {
          return (
            <span
              key={`${i}-${j}`}
              className="mx-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-vyber-purple/20 text-[10px] font-medium text-vyber-purple"
            >
              {cp}
            </span>
          );
        }
        return cp;
      });
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20" role="dialog" aria-modal="true" aria-labelledby="vyber-ai-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette */}
      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-vyber-purple to-vyber-pink">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 id="vyber-ai-title" className="text-sm font-semibold">Vyber AI</h2>
              <p className="text-xs text-muted-foreground">
                Search the web & get instant answers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={close}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close command palette"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "search" && message.searchResults ? (
                    <div className="w-full">
                      {renderSearchResults(message.searchResults)}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "max-w-[85%] select-text rounded-2xl px-4 py-2 text-sm",
                        message.role === "user"
                          ? "bg-vyber-purple text-white"
                          : "bg-secondary text-foreground"
                      )}
                    >
                      {message.role === "assistant"
                        ? parseMessageForURLs(message.content)
                        : message.content}
                    </div>
                  )}
                </div>
              ))}
              {(isLoading || isSearching) && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isSearching ? "Searching the web..." : "Thinking..."}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Suggestions (when no messages) */}
        {messages.length === 0 && (
          <div className="p-4">
            <p className="mb-3 text-xs text-muted-foreground">Ask anything - I'll search the web for you:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-vyber-purple/50 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              aria-label="Ask Vyber AI"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!currentInput.trim() || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-vyber-purple to-vyber-pink text-white transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground/50">
          Press <kbd className="rounded bg-secondary px-1">Esc</kbd> to close •
          Web search + Claude AI
        </div>
      </div>
    </div>
  );
}
