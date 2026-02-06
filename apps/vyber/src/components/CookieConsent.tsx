import { useEffect, useState } from "react";
import {
  hasStoredConsent,
  initAnalytics,
  isAnalyticsConfigured,
  isConsentRequired,
  setAnalyticsConsent,
} from "@/lib/analytics";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAnalyticsConfigured() || !isConsentRequired()) return;
    setVisible(!hasStoredConsent());
  }, []);

  if (!visible) return null;

  const handleChoice = async (granted: boolean) => {
    setAnalyticsConsent(granted);
    setVisible(false);
    if (granted) {
      await initAnalytics();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 text-sm backdrop-blur animate-toast-in">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          We use analytics to improve performance and reliability. You can opt out anytime.{" "}
          <a href="/privacy.html" className="text-vyber-purple hover:underline">
            Learn more
          </a>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleChoice(false)}
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            Decline
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="rounded-full bg-gradient-to-r from-vyber-purple to-vyber-pink px-4 py-1.5 text-xs font-medium text-white"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
