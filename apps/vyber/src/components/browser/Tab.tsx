import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab as TabType } from "@/stores/tabs";

interface TabProps {
  tab: TabType;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function Tab({ tab, isActive, onSelect, onClose }: TabProps) {
  return (
    <div
      className={cn(
        "group relative flex h-9 min-w-[140px] max-w-[240px] cursor-pointer items-center gap-2 rounded-t-lg border-x border-t px-3 transition-colors",
        isActive
          ? "border-border bg-background text-foreground"
          : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      aria-label={`Tab: ${tab.title}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Favicon or loading indicator */}
      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
        {tab.isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin text-vyber-purple" />
        ) : tab.favicon ? (
          <img
            src={tab.favicon}
            alt=""
            className="h-4 w-4 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="h-3 w-3 rounded-sm bg-vyber-purple/20" />
        )}
      </div>

      {/* Title */}
      <span className="flex-1 truncate text-xs font-medium" title={tab.title}>
        {tab.title}
      </span>

      {/* Close button */}
      <button
        className={cn(
          "titlebar-button flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-destructive/20 hover:text-destructive"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={`Close ${tab.title}`}
      >
        <X className="h-3 w-3" />
      </button>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -bottom-px left-0 right-0 h-px bg-background" />
      )}
    </div>
  );
}
