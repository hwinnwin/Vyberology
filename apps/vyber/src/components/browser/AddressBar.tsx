import { useState, useEffect, useRef, KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Shield,
  Sparkles,
  Search,
  Columns,
  X,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTabsStore } from "@/stores/tabs";
import { useAIStore } from "@/stores/ai";

export function AddressBar() {
  const {
    tabs, activeTabId, navigate, refreshTab, splitView, toggleSplitView,
    addBookmark, removeBookmark, isBookmarked, bookmarks
  } = useTabsStore();
  const { open: openAI } = useAIStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input with active tab URL
  useEffect(() => {
    if (activeTab && !isFocused) {
      setInputValue(
        activeTab.url.startsWith("vyber://") ? "" : activeTab.url
      );
    }
  }, [activeTab?.url, isFocused]);

  const handleSubmit = () => {
    if (activeTabId && inputValue.trim()) {
      navigate(activeTabId, inputValue.trim());
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
      if (activeTab) {
        setInputValue(
          activeTab.url.startsWith("vyber://") ? "" : activeTab.url
        );
      }
    }
  };

  const isSecure = activeTab?.url.startsWith("https://");
  const isVyberPage = activeTab?.url.startsWith("vyber://");
  const currentIsBookmarked = activeTab ? isBookmarked(activeTab.url) : false;

  const handleToggleBookmark = () => {
    if (!activeTab || isVyberPage) return;

    if (currentIsBookmarked) {
      const bookmark = bookmarks.find((b) => b.url === activeTab.url);
      if (bookmark) removeBookmark(bookmark.id);
    } else {
      addBookmark({
        url: activeTab.url,
        title: activeTab.title,
        favicon: activeTab.favicon,
      });
    }
  };

  return (
    <div className="flex h-11 items-center gap-2 border-b border-border bg-background px-3">
      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            activeTab?.canGoBack
              ? "text-foreground hover:bg-secondary"
              : "cursor-not-allowed text-muted-foreground/50"
          )}
          disabled={!activeTab?.canGoBack}
          title="Back"
          aria-label="Back"
          aria-disabled={!activeTab?.canGoBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            activeTab?.canGoForward
              ? "text-foreground hover:bg-secondary"
              : "cursor-not-allowed text-muted-foreground/50"
          )}
          disabled={!activeTab?.canGoForward}
          title="Forward"
          aria-label="Forward"
          aria-disabled={!activeTab?.canGoForward}
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary"
          title="Refresh"
          aria-label="Refresh"
          onClick={() => activeTabId && refreshTab(activeTabId)}
        >
          <RotateCw className="h-4 w-4" />
        </button>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary"
          onClick={() => activeTabId && navigate(activeTabId, "vyber://newtab")}
          title="Home"
          aria-label="Home"
        >
          <Home className="h-4 w-4" />
        </button>
      </div>

      {/* URL Bar */}
      <div
        className={cn(
          "flex flex-1 items-center gap-2 rounded-full border px-3 py-1.5 transition-all",
          isFocused
            ? "border-vyber-purple bg-background ring-2 ring-vyber-purple/20"
            : "border-border bg-secondary/50 hover:bg-secondary"
        )}
      >
        {/* Security indicator */}
        {!isFocused && !isVyberPage && (
          <div className="flex shrink-0 items-center">
            {isSecure ? (
              <Shield className="h-4 w-4 text-emerald-500" />
            ) : (
              <Shield className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}

        {isFocused && (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <input
          ref={inputRef}
          type="text"
          aria-label="Search or enter URL"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={
            isFocused ? "Search or enter URL" : "Search with Vyber AI..."
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            inputRef.current?.select();
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
        />

        {/* Bookmark Button */}
        {!isVyberPage && (
          <button
            onClick={handleToggleBookmark}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full p-1 transition-colors",
              currentIsBookmarked
                ? "text-amber-400 hover:text-amber-300"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={currentIsBookmarked ? "Remove bookmark (Cmd+D)" : "Bookmark this page (Cmd+D)"}
            aria-label={currentIsBookmarked ? "Remove bookmark" : "Add bookmark"}
            aria-pressed={currentIsBookmarked}
          >
            <Star className={cn("h-4 w-4", currentIsBookmarked && "fill-current")} />
          </button>
        )}

        {/* AI Command Button */}
        <button
          onClick={openAI}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-vyber-purple to-vyber-pink px-2.5 py-1 text-xs font-medium text-white transition-transform hover:scale-105"
          title="AI Commands (Cmd+Shift+K)"
          aria-label="Open AI command palette"
        >
          <Sparkles className="h-3 w-3" />
          <span>AI</span>
        </button>
      </div>

      {/* Split View Button */}
      <button
        onClick={toggleSplitView}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          splitView.enabled
            ? "bg-vyber-purple/20 text-vyber-purple hover:bg-vyber-purple/30"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
        title={splitView.enabled ? "Close split view (Cmd+Shift+S)" : "Split view (Cmd+Shift+S)"}
        aria-label={splitView.enabled ? "Close split view" : "Open split view"}
        aria-pressed={splitView.enabled}
      >
        {splitView.enabled ? (
          <X className="h-4 w-4" />
        ) : (
          <Columns className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
