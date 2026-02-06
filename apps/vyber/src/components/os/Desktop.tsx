import { useCallback, useRef, useState } from "react";
import { useOSStore, OS_APPS } from "@/stores/os";

interface DesktopIconProps {
  iconId: string;
  appId: string;
  x: number;
  y: number;
}

function DesktopIcon({ iconId, appId, x, y }: DesktopIconProps) {
  const app = OS_APPS.find((a) => a.id === appId);
  const { openWindow, moveDesktopIcon } = useOSStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, iconX: x, iconY: y });

  const handleDoubleClick = useCallback(() => {
    if (app) {
      openWindow(appId);
    }
  }, [app, appId, openWindow]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsSelected(true);
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        iconX: x,
        iconY: y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - dragStart.current.x;
        const dy = moveEvent.clientY - dragStart.current.y;

        // Snap to grid (80px)
        const newX = Math.max(0, Math.round((dragStart.current.iconX + dx) / 80) * 80 + 20);
        const newY = Math.max(0, Math.round((dragStart.current.iconY + dy) / 80) * 80 + 20);

        moveDesktopIcon(iconId, newX, newY);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [iconId, x, y, moveDesktopIcon]
  );

  const handleBlur = useCallback(() => {
    setIsSelected(false);
  }, []);

  if (!app) return null;

  return (
    <button
      className={`absolute flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-center transition-all focus:outline-none ${
        isSelected
          ? "bg-white/20 ring-2 ring-vyber-purple"
          : "hover:bg-white/10"
      } ${isDragging ? "cursor-grabbing opacity-70" : "cursor-pointer"}`}
      style={{ left: x, top: y }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      tabIndex={0}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg transition-transform hover:scale-105`}
      >
        <span className="text-2xl">{app.icon}</span>
      </div>
      <span className="line-clamp-2 text-xs font-medium text-white drop-shadow-lg">
        {app.name}
      </span>
    </button>
  );
}

export function Desktop() {
  const { wallpaper, desktopIcons, openWindow } = useOSStore();
  const desktopRef = useRef<HTMLDivElement>(null);

  // Handle desktop click to deselect icons
  const handleDesktopClick = useCallback((e: React.MouseEvent) => {
    if (e.target === desktopRef.current) {
      // Deselect all icons by removing focus
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, []);

  // Handle desktop double-click to open finder
  const handleDesktopDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === desktopRef.current) {
        openWindow("files");
      }
    },
    [openWindow]
  );

  // Determine if wallpaper is a gradient or image
  const isGradient = wallpaper.startsWith("linear-gradient") || wallpaper.startsWith("radial-gradient");
  const backgroundStyle = isGradient
    ? { background: wallpaper }
    : { backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" };

  return (
    <div
      ref={desktopRef}
      className="absolute inset-0 overflow-hidden"
      style={backgroundStyle}
      onClick={handleDesktopClick}
      onDoubleClick={handleDesktopDoubleClick}
    >
      {/* Desktop Icons */}
      {desktopIcons.map((icon) => (
        <DesktopIcon
          key={icon.id}
          iconId={icon.id}
          appId={icon.appId}
          x={icon.x}
          y={icon.y}
        />
      ))}
    </div>
  );
}
