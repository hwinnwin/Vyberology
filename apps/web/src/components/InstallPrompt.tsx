import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-vy-gold/20 bg-vy-charcoal p-4 shadow-vy-glow animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <img
          src="/pwa-192x192.png"
          alt="Vyberology"
          className="h-10 w-10 rounded-lg"
        />
        <div className="flex-1">
          <p className="font-display text-sm font-semibold text-vy-parchment">
            Install Vyberology
          </p>
          <p className="font-sans text-xs text-vy-warm-gray">
            Add to your home screen for quick access
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-vy-warm-gray hover:text-vy-parchment transition-colors bg-transparent border-none cursor-pointer p-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="mt-3 w-full py-2.5 rounded-lg font-sans text-sm font-medium bg-vy-gold text-vy-charcoal hover:bg-vy-gold/90 transition-all duration-200 cursor-pointer border-none"
      >
        Install App
      </button>
    </div>
  );
}
