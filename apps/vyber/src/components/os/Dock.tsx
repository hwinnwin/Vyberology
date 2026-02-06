import { useCallback, useState } from "react";
import { useOSStore, OS_APPS } from "@/stores/os";

interface DockItemProps {
  appId: string;
  isPinned: boolean;
  isOpen: boolean;
  isFocused: boolean;
}

function DockItem({ appId, isPinned: _isPinned, isOpen, isFocused }: DockItemProps) {
  const app = OS_APPS.find((a) => a.id === appId);
  const { openWindow, windows, focusWindow, minimizeWindow } = useOSStore();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    // Find windows for this app
    const appWindows = windows.filter((w) => w.appId === appId);

    if (appWindows.length === 0) {
      // No windows open, open new one
      openWindow(appId);
    } else if (appWindows.length === 1) {
      const win = appWindows[0];
      if (win.isFocused && !win.isMinimized) {
        // Already focused, minimize it
        minimizeWindow(win.id);
      } else {
        // Focus it (also restores if minimized)
        focusWindow(win.id);
      }
    } else {
      // Multiple windows - cycle through or show picker
      const focusedIndex = appWindows.findIndex((w) => w.isFocused);
      const nextIndex = (focusedIndex + 1) % appWindows.length;
      focusWindow(appWindows[nextIndex].id);
    }
  }, [appId, windows, openWindow, focusWindow, minimizeWindow]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // TODO: Show context menu for pinning, closing all, etc.
    },
    []
  );

  if (!app) return null;

  return (
    <div className="group relative">
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900/90 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
          {app.name}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900/90" />
        </div>
      )}

      {/* Dock Icon */}
      <button
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
          isFocused
            ? "scale-110 bg-white/20"
            : "hover:scale-110 hover:bg-white/10"
        }`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg transition-transform`}
        >
          <span className="text-xl">{app.icon}</span>
        </div>

        {/* Running indicator */}
        {isOpen && (
          <div
            className={`absolute -bottom-1 h-1 w-1 rounded-full ${
              isFocused ? "bg-vyber-purple" : "bg-white/60"
            }`}
          />
        )}
      </button>
    </div>
  );
}

export function Dock() {
  const { dockItems, dockPosition, windows } = useOSStore();

  // Get position classes
  const positionClasses = {
    bottom: "bottom-2 left-1/2 -translate-x-1/2 flex-row",
    left: "left-2 top-1/2 -translate-y-1/2 flex-col",
    right: "right-2 top-1/2 -translate-y-1/2 flex-col",
  };

  return (
    <div
      className={`fixed z-[9999] flex items-center gap-1 rounded-2xl bg-white/10 p-2 shadow-2xl backdrop-blur-xl ${positionClasses[dockPosition]}`}
    >
      {dockItems.map((item) => {
        const appWindows = windows.filter((w) => w.appId === item.appId);
        const isOpen = appWindows.length > 0;
        const isFocused = appWindows.some((w) => w.isFocused);

        return (
          <DockItem
            key={item.appId}
            appId={item.appId}
            isPinned={item.isPinned}
            isOpen={isOpen}
            isFocused={isFocused}
          />
        );
      })}

      {/* Separator */}
      <div
        className={`mx-1 bg-white/20 ${
          dockPosition === "bottom" ? "h-10 w-px" : "h-px w-10"
        }`}
      />

      {/* Trash / Minimized windows area */}
      <button className="flex h-12 w-12 items-center justify-center rounded-xl transition-all hover:scale-110 hover:bg-white/10">
        <span className="text-xl">🗑️</span>
      </button>
    </div>
  );
}
