import { create } from "zustand";
import { persist } from "zustand/middleware";

// Window state for OS window manager
export interface OSWindow {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  zIndex: number;
  isFocused: boolean;
}

// App definition for the OS
export interface OSApp {
  id: string;
  name: string;
  icon: string;
  color: string;
  component: string; // Component name to render
  singleton?: boolean; // Only allow one instance
  defaultWidth?: number;
  defaultHeight?: number;
}

// Desktop icon
export interface DesktopIcon {
  id: string;
  appId: string;
  x: number;
  y: number;
}

// Notification
export interface OSNotification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    appId: string;
  };
}

// Dock item
export interface DockItem {
  appId: string;
  isPinned: boolean;
}

interface OSState {
  // Windows
  windows: OSWindow[];
  nextZIndex: number;

  // Desktop
  desktopIcons: DesktopIcon[];
  wallpaper: string;

  // Dock
  dockItems: DockItem[];
  dockPosition: "bottom" | "left" | "right";
  dockAutoHide: boolean;

  // Notifications
  notifications: OSNotification[];

  // System state
  isLocked: boolean;
  currentTime: number;

  // Window actions
  openWindow: (appId: string, options?: Partial<OSWindow>) => string;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  toggleFullscreen: (windowId: string) => void;
  moveWindow: (windowId: string, x: number, y: number) => void;
  resizeWindow: (windowId: string, width: number, height: number) => void;

  // Desktop actions
  setWallpaper: (url: string) => void;
  addDesktopIcon: (appId: string, x: number, y: number) => void;
  moveDesktopIcon: (iconId: string, x: number, y: number) => void;
  removeDesktopIcon: (iconId: string) => void;

  // Dock actions
  addToDock: (appId: string) => void;
  removeFromDock: (appId: string) => void;
  setDockPosition: (position: "bottom" | "left" | "right") => void;
  setDockAutoHide: (autoHide: boolean) => void;

  // Notification actions
  addNotification: (notification: Omit<OSNotification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;

  // System actions
  lockScreen: () => void;
  unlockScreen: () => void;
}

// Built-in apps
export const OS_APPS: OSApp[] = [
  {
    id: "browser",
    name: "THE VYBER",
    icon: "🌐",
    color: "from-vyber-purple to-vyber-pink",
    component: "BrowserApp",
    singleton: true,
    defaultWidth: 1200,
    defaultHeight: 800,
  },
  {
    id: "files",
    name: "Files",
    icon: "📁",
    color: "from-blue-500 to-cyan-500",
    component: "FilesApp",
    defaultWidth: 900,
    defaultHeight: 600,
  },
  {
    id: "music",
    name: "Vybe Player",
    icon: "🎵",
    color: "from-vyber-purple to-vyber-cyan",
    component: "MusicApp",
    singleton: true,
    defaultWidth: 400,
    defaultHeight: 600,
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: "⌨️",
    color: "from-gray-700 to-gray-900",
    component: "TerminalApp",
    defaultWidth: 800,
    defaultHeight: 500,
  },
  {
    id: "settings",
    name: "Settings",
    icon: "⚙️",
    color: "from-gray-500 to-gray-600",
    component: "SettingsApp",
    singleton: true,
    defaultWidth: 800,
    defaultHeight: 600,
  },
  {
    id: "notes",
    name: "Notes",
    icon: "📝",
    color: "from-yellow-400 to-orange-500",
    component: "NotesApp",
    defaultWidth: 600,
    defaultHeight: 500,
  },
  {
    id: "ai",
    name: "Lumen AI",
    icon: "🧠",
    color: "from-purple-600 to-pink-500",
    component: "AIAssistantApp",
    singleton: true,
    defaultWidth: 500,
    defaultHeight: 700,
  },
];

function generateId(): string {
  return `win-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Default wallpapers
const DEFAULT_WALLPAPER = "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";

export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      windows: [],
      nextZIndex: 100,
      desktopIcons: [
        { id: "icon-1", appId: "browser", x: 20, y: 20 },
        { id: "icon-2", appId: "files", x: 20, y: 120 },
        { id: "icon-3", appId: "music", x: 20, y: 220 },
        { id: "icon-4", appId: "terminal", x: 20, y: 320 },
        { id: "icon-5", appId: "ai", x: 20, y: 420 },
      ],
      wallpaper: DEFAULT_WALLPAPER,
      dockItems: [
        { appId: "browser", isPinned: true },
        { appId: "files", isPinned: true },
        { appId: "music", isPinned: true },
        { appId: "terminal", isPinned: true },
        { appId: "settings", isPinned: true },
        { appId: "ai", isPinned: true },
      ],
      dockPosition: "bottom",
      dockAutoHide: false,
      notifications: [],
      isLocked: false,
      currentTime: Date.now(),

      openWindow: (appId, options = {}) => {
        const app = OS_APPS.find((a) => a.id === appId);
        if (!app) return "";

        // Check for singleton
        if (app.singleton) {
          const existing = get().windows.find((w) => w.appId === appId);
          if (existing) {
            get().focusWindow(existing.id);
            if (existing.isMinimized) {
              get().restoreWindow(existing.id);
            }
            return existing.id;
          }
        }

        const id = generateId();
        const { nextZIndex, windows } = get();

        // Center the window with some offset for multiple windows
        const offset = (windows.filter((w) => w.appId === appId).length * 30) % 150;
        const defaultX = Math.max(100, (window.innerWidth - (app.defaultWidth || 800)) / 2 + offset);
        const defaultY = Math.max(50, (window.innerHeight - (app.defaultHeight || 600)) / 2 + offset);

        const newWindow: OSWindow = {
          id,
          appId,
          title: app.name,
          icon: app.icon,
          x: options.x ?? defaultX,
          y: options.y ?? defaultY,
          width: options.width ?? app.defaultWidth ?? 800,
          height: options.height ?? app.defaultHeight ?? 600,
          minWidth: 300,
          minHeight: 200,
          isMaximized: false,
          isMinimized: false,
          isFullscreen: false,
          zIndex: nextZIndex,
          isFocused: true,
        };

        set((state) => ({
          windows: [
            ...state.windows.map((w) => ({ ...w, isFocused: false })),
            newWindow,
          ],
          nextZIndex: nextZIndex + 1,
        }));

        // Add to dock if not pinned
        const { dockItems } = get();
        if (!dockItems.some((d) => d.appId === appId)) {
          set((state) => ({
            dockItems: [...state.dockItems, { appId, isPinned: false }],
          }));
        }

        return id;
      },

      closeWindow: (windowId) => {
        const window = get().windows.find((w) => w.id === windowId);
        if (!window) return;

        set((state) => ({
          windows: state.windows.filter((w) => w.id !== windowId),
        }));

        // Remove from dock if not pinned and no other instances
        const { windows, dockItems } = get();
        const hasOtherInstances = windows.some((w) => w.appId === window.appId);
        if (!hasOtherInstances) {
          const dockItem = dockItems.find((d) => d.appId === window.appId);
          if (dockItem && !dockItem.isPinned) {
            set((state) => ({
              dockItems: state.dockItems.filter((d) => d.appId !== window.appId),
            }));
          }
        }

        // Focus next window
        const remainingWindows = get().windows.filter((w) => !w.isMinimized);
        if (remainingWindows.length > 0) {
          const topWindow = remainingWindows.reduce((prev, curr) =>
            curr.zIndex > prev.zIndex ? curr : prev
          );
          get().focusWindow(topWindow.id);
        }
      },

      focusWindow: (windowId) => {
        const { nextZIndex } = get();
        set((state) => ({
          windows: state.windows.map((w) => ({
            ...w,
            isFocused: w.id === windowId,
            zIndex: w.id === windowId ? nextZIndex : w.zIndex,
            isMinimized: w.id === windowId ? false : w.isMinimized,
          })),
          nextZIndex: nextZIndex + 1,
        }));
      },

      minimizeWindow: (windowId) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, isMinimized: true, isFocused: false } : w
          ),
        }));

        // Focus next window
        const remainingWindows = get().windows.filter(
          (w) => !w.isMinimized && w.id !== windowId
        );
        if (remainingWindows.length > 0) {
          const topWindow = remainingWindows.reduce((prev, curr) =>
            curr.zIndex > prev.zIndex ? curr : prev
          );
          get().focusWindow(topWindow.id);
        }
      },

      maximizeWindow: (windowId) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, isMaximized: true } : w
          ),
        }));
      },

      restoreWindow: (windowId) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId
              ? { ...w, isMaximized: false, isMinimized: false }
              : w
          ),
        }));
        get().focusWindow(windowId);
      },

      toggleFullscreen: (windowId) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, isFullscreen: !w.isFullscreen } : w
          ),
        }));
      },

      moveWindow: (windowId, x, y) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, x, y, isMaximized: false } : w
          ),
        }));
      },

      resizeWindow: (windowId, width, height) => {
        const window = get().windows.find((w) => w.id === windowId);
        if (!window) return;

        const newWidth = Math.max(width, window.minWidth || 300);
        const newHeight = Math.max(height, window.minHeight || 200);

        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId
              ? { ...w, width: newWidth, height: newHeight, isMaximized: false }
              : w
          ),
        }));
      },

      setWallpaper: (url) => {
        set({ wallpaper: url });
      },

      addDesktopIcon: (appId, x, y) => {
        const id = generateId();
        set((state) => ({
          desktopIcons: [...state.desktopIcons, { id, appId, x, y }],
        }));
      },

      moveDesktopIcon: (iconId, x, y) => {
        set((state) => ({
          desktopIcons: state.desktopIcons.map((icon) =>
            icon.id === iconId ? { ...icon, x, y } : icon
          ),
        }));
      },

      removeDesktopIcon: (iconId) => {
        set((state) => ({
          desktopIcons: state.desktopIcons.filter((icon) => icon.id !== iconId),
        }));
      },

      addToDock: (appId) => {
        const { dockItems } = get();
        if (dockItems.some((d) => d.appId === appId)) return;

        set((state) => ({
          dockItems: [...state.dockItems, { appId, isPinned: true }],
        }));
      },

      removeFromDock: (appId) => {
        set((state) => ({
          dockItems: state.dockItems.filter((d) => d.appId !== appId),
        }));
      },

      setDockPosition: (position) => {
        set({ dockPosition: position });
      },

      setDockAutoHide: (autoHide) => {
        set({ dockAutoHide: autoHide });
      },

      addNotification: (notification) => {
        const id = generateId();
        set((state) => ({
          notifications: [
            { ...notification, id, timestamp: Date.now(), read: false },
            ...state.notifications,
          ].slice(0, 50), // Keep max 50 notifications
        }));
      },

      markNotificationRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotification: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      lockScreen: () => {
        set({ isLocked: true });
      },

      unlockScreen: () => {
        set({ isLocked: false });
      },
    }),
    {
      name: "vybe-os-storage",
      version: 1,
      partialize: (state) => ({
        desktopIcons: state.desktopIcons,
        wallpaper: state.wallpaper,
        dockItems: state.dockItems.filter((d) => d.isPinned),
        dockPosition: state.dockPosition,
        dockAutoHide: state.dockAutoHide,
      }),
    }
  )
);
