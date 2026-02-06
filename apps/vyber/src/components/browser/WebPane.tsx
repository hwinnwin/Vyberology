import { useEffect, useCallback, useState, useRef, lazy, Suspense } from "react";
import { useTabsStore, Tab } from "@/stores/tabs";
import { NewTab } from "./NewTab";
import { Loader2, ExternalLink, Globe, RefreshCw, AlertTriangle } from "lucide-react";
import { isTauri } from "@/lib/platform";

// Lazy load the Music Player for better initial load performance
const MusicPlayer = lazy(() =>
  import("@/components/pages/MusicPlayer").then((m) => ({ default: m.MusicPlayer }))
);

interface WebPaneProps {
  tab: Tab;
  pane?: "left" | "right";
}

export function WebPane({ tab, pane }: WebPaneProps) {
  const { updateTab, splitView, setActivePane } = useTabsStore();
  const [hasOpened, setHasOpened] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Open URL - Tauri uses native webview, PWA uses iframe
  const openUrl = useCallback(async (tabId: string, url: string) => {
    if (!url || url.startsWith("vyber://")) return;

    try {
      setError(null);
      setIframeError(false);

      if (isTauri) {
        // Tauri: use native webview
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("create_tab", { tabId, url });
      }

      let hostname = url;
      try {
        hostname = new URL(url).hostname;
      } catch {
        hostname = url;
      }

      // Update tab state
      updateTab(tabId, {
        ...(isTauri ? { isLoading: false } : {}),
        title: hostname,
      });
      setHasOpened(url);
    } catch (err) {
      console.error("Failed to open URL:", err);
      setError(String(err));
      updateTab(tabId, { isLoading: false });
    }
  }, [updateTab]);

  // Auto-open URL when tab navigates
  useEffect(() => {
    if (!tab) return;
    if (tab.url.startsWith("vyber://")) return;
    if (hasOpened === tab.url) return;

    const timer = setTimeout(() => {
      if (tab.isLoading) {
        openUrl(tab.id, tab.url);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [tab?.url, tab?.isLoading, tab?.id, hasOpened, openUrl]);

  // Reset state when URL changes
  useEffect(() => {
    if (tab?.url !== hasOpened) {
      setHasOpened(null);
      setError(null);
      setIframeError(false);
    }
  }, [tab?.url, hasOpened]);

  // Trigger reload when refresh token changes
  useEffect(() => {
    if (tab?.reloadToken) {
      setHasOpened(null);
    }
  }, [tab?.reloadToken]);

  // Handle iframe load complete
  const handleIframeLoad = useCallback(() => {
    if (tab) {
      updateTab(tab.id, { isLoading: false });
    }
  }, [tab, updateTab]);

  // Handle iframe error (X-Frame-Options / CSP blocked)
  const handleIframeError = useCallback(() => {
    setIframeError(true);
    if (tab) {
      updateTab(tab.id, { isLoading: false });
    }
  }, [tab, updateTab]);

  // Handle pane click to set active
  const handlePaneClick = useCallback(() => {
    if (pane && splitView.enabled) {
      setActivePane(pane);
    }
  }, [pane, splitView.enabled, setActivePane]);

  if (!tab) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No tab selected</p>
      </div>
    );
  }

  // Show music player for vyber://player
  if (tab.url === "vyber://player" || tab.url === "vyber://music") {
    return (
      <div className="h-full w-full" onClick={handlePaneClick}>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-vyber-purple" />
            </div>
          }
        >
          <MusicPlayer />
        </Suspense>
      </div>
    );
  }

  // Show new tab page for vyber:// URLs
  if (tab.url.startsWith("vyber://")) {
    return (
      <div className="h-full w-full overflow-auto" onClick={handlePaneClick}>
        <NewTab />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary/20 p-8 text-center"
        role="alert"
        onClick={handlePaneClick}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20">
          <Globe className="h-8 w-8 text-red-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Failed to open page</h2>
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setError(null);
              updateTab(tab.id, { isLoading: true });
              openUrl(tab.id, tab.url);
            }}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => window.open(tab.url, "_blank", "noopener,noreferrer")}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </button>
        </div>
      </div>
    );
  }

  // PWA Mode: Show iframe for web content
  if (!isTauri && hasOpened === tab.url) {
    return (
      <div className="relative h-full w-full web-content" onClick={handlePaneClick}>
        {/* Loading overlay */}
        {tab.isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-vyber-purple" />
          </div>
        )}

        {/* Iframe blocked warning */}
        {iframeError && (
          <div
            className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary/20 p-8 text-center"
            role="alert"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">This site can't be embedded</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                {new URL(tab.url).hostname} doesn't allow being displayed in frames.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open(tab.url, "_blank", "noopener,noreferrer")}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-vyber-purple to-vyber-pink px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </button>
            </div>
          </div>
        )}

        {/* Web content iframe */}
        {!iframeError && (
          <iframe
            ref={iframeRef}
            key={`${tab.id}-${tab.reloadToken}`}
            src={tab.url}
            className="h-full w-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
            allow="accelerometer; camera; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={tab.title || tab.url}
          />
        )}
      </div>
    );
  }

  // Tauri Mode: Show page opened state (content in native webview)
  if (isTauri && hasOpened === tab.url) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary/20 p-8 text-center"
        onClick={handlePaneClick}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-vyber-purple via-vyber-pink to-vyber-cyan shadow-glow">
          <Globe className="h-8 w-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Browsing in new window</h2>
          <p className="max-w-md text-sm text-muted-foreground">{tab.url}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => openUrl(tab.id, tab.url)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            Open Again
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground/50">
          The page is open in a separate browser window
        </p>
      </div>
    );
  }

  // Show loading state
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary/20 p-8 text-center"
      onClick={handlePaneClick}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-vyber-purple" />
        <div className="space-y-2">
          <h2 className="text-base font-medium">Loading...</h2>
          <p className="max-w-md text-sm text-muted-foreground truncate">{tab.url}</p>
        </div>
      </div>
      <div className="w-full max-w-sm animate-pulse space-y-3">
        <div className="h-2 w-3/4 rounded-full bg-secondary/60" />
        <div className="h-2 w-5/6 rounded-full bg-secondary/60" />
        <div className="h-2 w-2/3 rounded-full bg-secondary/60" />
      </div>
    </div>
  );
}
