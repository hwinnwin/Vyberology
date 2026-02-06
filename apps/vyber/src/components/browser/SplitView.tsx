import { useCallback, useRef, useState } from "react";
import { useTabsStore } from "@/stores/tabs";
import { WebPane } from "./WebPane";
import { GripVertical, GripHorizontal, X, ArrowLeftRight, Columns, Rows } from "lucide-react";
import { cn } from "@/lib/utils";

export function SplitView() {
  const {
    tabs,
    splitView,
    setSplitRatio,
    setActivePane,
    disableSplitView,
    setSplitDirection,
    swapSplitPanes,
  } = useTabsStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const leftTab = tabs.find((t) => t.id === splitView.leftTabId);
  const rightTab = tabs.find((t) => t.id === splitView.rightTabId);

  const isVertical = splitView.direction === "vertical";

  // Handle resize drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startPos = isVertical ? e.clientX : e.clientY;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const containerSize = isVertical ? containerRect.width : containerRect.height;
      const startRatio = splitView.splitRatio;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos = isVertical ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPos;
        const deltaPercent = (delta / containerSize) * 100;
        const newRatio = Math.max(20, Math.min(80, startRatio + deltaPercent));
        setSplitRatio(newRatio);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isVertical, splitView.splitRatio, setSplitRatio]
  );

  if (!leftTab || !rightTab) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full w-full",
        isVertical ? "flex-row" : "flex-col"
      )}
    >
      {/* Left/Top Pane */}
      <div
        className={cn(
          "relative overflow-hidden",
          splitView.activePane === "left" && "ring-2 ring-vyber-purple ring-inset"
        )}
        style={{
          [isVertical ? "width" : "height"]: `${splitView.splitRatio}%`,
        }}
        onClick={() => setActivePane("left")}
      >
        <WebPane tab={leftTab} pane="left" />
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "group relative z-20 flex items-center justify-center bg-border transition-colors hover:bg-vyber-purple/50",
          isVertical ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
          isDragging && "bg-vyber-purple"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Handle grip icon */}
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-md bg-secondary border border-border opacity-0 transition-opacity group-hover:opacity-100",
            isVertical ? "h-12 w-5 -translate-x-1/2 left-1/2" : "w-12 h-5 -translate-y-1/2 top-1/2"
          )}
        >
          {isVertical ? (
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          ) : (
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Right/Bottom Pane */}
      <div
        className={cn(
          "relative flex-1 overflow-hidden",
          splitView.activePane === "right" && "ring-2 ring-vyber-purple ring-inset"
        )}
        onClick={() => setActivePane("right")}
      >
        <WebPane tab={rightTab} pane="right" />
      </div>

      {/* Split View Controls */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-lg border border-border bg-background/90 backdrop-blur-sm p-1 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={swapSplitPanes}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          title="Swap panes"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => setSplitDirection(isVertical ? "horizontal" : "vertical")}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          title={isVertical ? "Stack vertically" : "Split horizontally"}
        >
          {isVertical ? (
            <Rows className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Columns className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={disableSplitView}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          title="Close split view"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
