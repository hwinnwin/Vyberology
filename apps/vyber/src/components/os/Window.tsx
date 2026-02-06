import { useCallback, useRef, useState, type ReactNode } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { useOSStore, type OSWindow } from "@/stores/os";

interface WindowProps {
  window: OSWindow;
  children: ReactNode;
}

export function Window({ window: win, children }: WindowProps) {
  const {
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    toggleFullscreen,
    moveWindow,
    resizeWindow,
  } = useOSStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [, setResizeDirection] = useState<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, winX: win.x, winY: win.y });
  const resizeStart = useRef({ x: 0, y: 0, width: win.width, height: win.height, winX: win.x, winY: win.y });

  // Handle title bar drag
  const handleTitleBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (win.isMaximized || win.isFullscreen) return;
      e.preventDefault();
      focusWindow(win.id);
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        winX: win.x,
        winY: win.y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - dragStart.current.x;
        const dy = moveEvent.clientY - dragStart.current.y;
        const newX = Math.max(0, dragStart.current.winX + dx);
        const newY = Math.max(0, dragStart.current.winY + dy);
        moveWindow(win.id, newX, newY);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [win.id, win.x, win.y, win.isMaximized, win.isFullscreen, focusWindow, moveWindow]
  );

  // Handle resize
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: string) => {
      if (win.isMaximized || win.isFullscreen) return;
      e.preventDefault();
      e.stopPropagation();
      focusWindow(win.id);
      setIsResizing(true);
      setResizeDirection(direction);
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        width: win.width,
        height: win.height,
        winX: win.x,
        winY: win.y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - resizeStart.current.x;
        const dy = moveEvent.clientY - resizeStart.current.y;

        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = resizeStart.current.winX;
        let newY = resizeStart.current.winY;

        if (direction.includes("e")) {
          newWidth = Math.max(win.minWidth || 300, resizeStart.current.width + dx);
        }
        if (direction.includes("w")) {
          const widthDelta = Math.min(dx, resizeStart.current.width - (win.minWidth || 300));
          newWidth = resizeStart.current.width - widthDelta;
          newX = resizeStart.current.winX + widthDelta;
        }
        if (direction.includes("s")) {
          newHeight = Math.max(win.minHeight || 200, resizeStart.current.height + dy);
        }
        if (direction.includes("n")) {
          const heightDelta = Math.min(dy, resizeStart.current.height - (win.minHeight || 200));
          newHeight = resizeStart.current.height - heightDelta;
          newY = resizeStart.current.winY + heightDelta;
        }

        resizeWindow(win.id, newWidth, newHeight);
        if (direction.includes("w") || direction.includes("n")) {
          moveWindow(win.id, Math.max(0, newX), Math.max(0, newY));
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeDirection(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [win.id, win.width, win.height, win.minWidth, win.minHeight, win.isMaximized, win.isFullscreen, focusWindow, resizeWindow, moveWindow]
  );

  // Handle double-click on title bar to maximize/restore
  const handleTitleBarDoubleClick = useCallback(() => {
    if (win.isMaximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  }, [win.id, win.isMaximized, maximizeWindow, restoreWindow]);

  // Handle window focus
  const handleWindowMouseDown = useCallback(() => {
    if (!win.isFocused) {
      focusWindow(win.id);
    }
  }, [win.id, win.isFocused, focusWindow]);

  // Calculate position and size
  const style = win.isFullscreen
    ? { left: 0, top: 0, width: "100vw", height: "100vh" }
    : win.isMaximized
    ? { left: 0, top: 28, width: "100vw", height: "calc(100vh - 28px - 72px)" } // Account for menu bar and dock
    : {
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
      };

  if (win.isMinimized) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      className={`fixed flex flex-col overflow-hidden rounded-xl shadow-2xl ${
        win.isFocused ? "ring-2 ring-vyber-purple/50" : ""
      } ${isDragging || isResizing ? "select-none" : ""}`}
      style={{
        ...style,
        zIndex: win.zIndex,
      }}
      onMouseDown={handleWindowMouseDown}
    >
      {/* Title Bar */}
      <div
        className={`flex h-9 flex-shrink-0 items-center gap-2 px-3 ${
          win.isFocused
            ? "bg-gray-800"
            : "bg-gray-900"
        } ${isDragging ? "cursor-grabbing" : "cursor-default"}`}
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={handleTitleBarDoubleClick}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <button
            className="group flex h-3 w-3 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-400"
            onClick={() => closeWindow(win.id)}
          >
            <X className="h-2 w-2 text-red-900 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            className="group flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500 transition-colors hover:bg-yellow-400"
            onClick={() => minimizeWindow(win.id)}
          >
            <Minus className="h-2 w-2 text-yellow-900 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            className="group flex h-3 w-3 items-center justify-center rounded-full bg-green-500 transition-colors hover:bg-green-400"
            onClick={() => (win.isMaximized ? restoreWindow(win.id) : maximizeWindow(win.id))}
          >
            <Square className="h-1.5 w-1.5 text-green-900 opacity-0 group-hover:opacity-100" />
          </button>
        </div>

        {/* Title */}
        <div className="flex flex-1 items-center justify-center gap-2 overflow-hidden">
          {win.icon && <span className="text-sm">{win.icon}</span>}
          <span className="truncate text-sm font-medium text-white/80">
            {win.title}
          </span>
        </div>

        {/* Fullscreen button */}
        <button
          className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
          onClick={() => toggleFullscreen(win.id)}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden bg-gray-900">
        {children}
      </div>

      {/* Resize handles */}
      {!win.isMaximized && !win.isFullscreen && (
        <>
          {/* Edges */}
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "s")}
          />
          <div
            className="absolute right-0 top-9 bottom-2 w-1 cursor-e-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "e")}
          />
          <div
            className="absolute left-0 top-9 bottom-2 w-1 cursor-w-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "w")}
          />
          <div
            className="absolute top-9 left-2 right-2 h-1 cursor-n-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "n")}
          />

          {/* Corners */}
          <div
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "se")}
          />
          <div
            className="absolute bottom-0 left-0 h-4 w-4 cursor-sw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
          />
          <div
            className="absolute top-9 right-0 h-4 w-4 cursor-ne-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
          />
          <div
            className="absolute top-9 left-0 h-4 w-4 cursor-nw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
          />
        </>
      )}
    </div>
  );
}
