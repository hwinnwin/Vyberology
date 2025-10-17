import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackAnalyticsEvent } from "@/lib/analytics";

type ReadingBlocks = {
  header: string;
  elemental: string;
  chakra: string;
  resonance: string;
  essence: string;
  intention: string;
  reflection: string;
};

type ReadingDeliveryProps = {
  reading: {
    text: string;
    blocks: ReadingBlocks;
  };
  className?: string;
};

type ReadingDeliveryProps = {
  reading: DeliveredReading;
  className?: string;
};

const BLOCK_LABELS: Array<{
  key: keyof ReadingBlocks;
  heading: string;
}> = [
  { key: "elemental", heading: "Elemental Focus" },
  { key: "chakra", heading: "Chakra Guidance" },
  { key: "resonance", heading: "Resonance" },
  { key: "essence", heading: "Essence" },
  { key: "intention", heading: "Intention" },
  { key: "reflection", heading: "Reflection" },
];

const copyToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for older browsers
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export function ReadingDelivery({ reading, className }: ReadingDeliveryProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const notify = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2400);
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(reading.text);
      notify("Reading copied to clipboard.");
    } catch (error) {
      console.error("Copy failed", error);
      notify("Unable to copy — please try again.");
      void trackAnalyticsEvent("error_occurred", {
        platform: "web",
        scope: "reading_copy",
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  const handleShare = async () => {
    const method = navigator.share ? "web-share" : "fallback-copy";
    void trackAnalyticsEvent("share_clicked", {
      platform: "web",
      method,
    });
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vyberology Reading",
          text: reading.text,
        });
        notify("Reading shared.");
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          console.error("Share failed", error);
          notify("Share failed — copied instead.");
          await handleCopy();
          void trackAnalyticsEvent("error_occurred", {
            platform: "web",
            scope: "reading_share",
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      }
      return;
    }

    await handleCopy();
    notify("Sharing not supported — copied instead.");
  };

  return (
    <article
      className={cn(
        "rounded-lg border border-border bg-background/60 p-6 shadow-sm",
        className
      )}
      aria-live="polite"
    >
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">{reading.blocks.header}</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy} aria-label="Copy reading to clipboard">
            Copy Text
          </Button>
          <Button onClick={handleShare} aria-label="Share reading">
            Share
          </Button>
        </div>
      </header>

      {feedback ? (
        <p className="mb-4 text-sm text-muted-foreground" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="space-y-5">
        {BLOCK_LABELS.map(({ key, heading }) => (
          <section key={key} className="space-y-1">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {heading}
            </h4>
            <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
              {reading.blocks[key]}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
