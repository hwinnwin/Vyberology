import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useOSStore, OS_APPS } from "@/stores/os";
import { Desktop } from "./Desktop";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { Window } from "./Window";

// Lazy load apps for better performance
const BrowserApp = lazy(() =>
  import("./apps/BrowserApp").then((m) => ({ default: m.BrowserApp }))
);
const FilesApp = lazy(() =>
  import("./apps/FilesApp").then((m) => ({ default: m.FilesApp }))
);
const MusicApp = lazy(() =>
  import("./apps/MusicApp").then((m) => ({ default: m.MusicApp }))
);
const TerminalApp = lazy(() =>
  import("./apps/TerminalApp").then((m) => ({ default: m.TerminalApp }))
);
const SettingsApp = lazy(() =>
  import("./apps/SettingsApp").then((m) => ({ default: m.SettingsApp }))
);
const NotesApp = lazy(() =>
  import("./apps/NotesApp").then((m) => ({ default: m.NotesApp }))
);
const AIAssistantApp = lazy(() =>
  import("./apps/AIAssistantApp").then((m) => ({ default: m.AIAssistantApp }))
);

// App component registry
const APP_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  BrowserApp,
  FilesApp,
  MusicApp,
  TerminalApp,
  SettingsApp,
  NotesApp,
  AIAssistantApp,
};

// Loading fallback
function AppLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-vyber-purple" />
    </div>
  );
}

/**
 * VybeOS - The main operating system shell
 * Provides desktop, window management, dock, and menu bar
 */
export function VybeOS() {
  const { windows, openWindow, addNotification } = useOSStore();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N - New browser window
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        openWindow("browser");
      }

      // Cmd/Ctrl + Shift + N - New terminal
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        openWindow("terminal");
      }

      // Cmd/Ctrl + Space - Spotlight (AI)
      if ((e.metaKey || e.ctrlKey) && e.key === " ") {
        e.preventDefault();
        openWindow("ai");
      }

      // Cmd/Ctrl + , - Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        openWindow("settings");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openWindow]);

  // Welcome notification on first load
  useEffect(() => {
    const hasShownWelcome = sessionStorage.getItem("vybeos-welcome");
    if (!hasShownWelcome) {
      setTimeout(() => {
        addNotification({
          title: "Welcome to VybeOS",
          message: "Double-click desktop icons or use the dock to open apps.",
          icon: "✨",
        });
        sessionStorage.setItem("vybeos-welcome", "true");
      }, 1000);
    }
  }, [addNotification]);

  // Render app content based on appId
  const renderAppContent = (appId: string) => {
    const app = OS_APPS.find((a) => a.id === appId);
    if (!app) return null;

    const Component = APP_COMPONENTS[app.component];
    if (!Component) {
      return (
        <div className="flex h-full items-center justify-center bg-gray-900 text-white/50">
          App not found: {app.component}
        </div>
      );
    }

    return (
      <Suspense fallback={<AppLoader />}>
        <Component />
      </Suspense>
    );
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-950">
      {/* Menu Bar */}
      <MenuBar />

      {/* Desktop (with icons and wallpaper) */}
      <div className="absolute inset-0 pt-7 pb-16">
        <Desktop />
      </div>

      {/* Windows */}
      {windows.map((win) => (
        <Window key={win.id} window={win}>
          {renderAppContent(win.appId)}
        </Window>
      ))}

      {/* Dock */}
      <Dock />
    </div>
  );
}
