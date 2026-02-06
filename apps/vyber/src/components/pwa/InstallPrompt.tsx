import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "@/lib/toast";

const DISMISS_KEY = "vyber_install_prompt_dismissed";

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone)
    ? true
    : false;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const shouldShowIos = useMemo(() => isIos() && !isStandalone(), []);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    const handleInstalled = () => {
      toast("VybeR installed successfully.", { variant: "success" });
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  if (isDismissed || isStandalone()) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      toast("VybeR installed. You can launch it from your home screen.", {
        variant: "success",
      });
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt && !shouldShowIos) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur animate-toast-in">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-vyber-purple to-vyber-pink">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold">Install VybeR</p>
          <p className="text-xs text-muted-foreground">
            {shouldShowIos
              ? "Tap Share then Add to Home Screen to install."
              : "Add VybeR to your home screen for faster access and offline use."}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!shouldShowIos && deferredPrompt && (
        <button
          onClick={handleInstall}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-vyber-purple to-vyber-pink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Install app
        </button>
      )}
    </div>
  );
}
