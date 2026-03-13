import { useRef, useState } from "react";
import { Share2, Copy, Download, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { trackAnalyticsEvent } from "@/lib/analytics";
import type { ReadingTier } from "@/lib/tiers";

interface NumberInfo {
  value: number;
  isMaster: boolean;
}

interface VybeShareCardProps {
  fullName: string;
  lifePathNumber: number;
  chakraName?: string;
  chakraColor?: string;
  elementName?: string;
  themes?: string[];
  tier: ReadingTier;
  shareSlug?: string;
  numbers?: Record<string, NumberInfo>;
}

export function VybeShareCard({
  fullName,
  lifePathNumber,
  chakraName,
  chakraColor = "hsl(38, 41%, 58%)",
  elementName,
  themes,
  tier,
  shareSlug,
  numbers,
}: VybeShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = shareSlug ? `${window.location.origin}/r/${shareSlug}` : "";
  const firstName = fullName.split(" ")[0];

  const numberCards = numbers
    ? [
        { label: "LIFE PATH", num: numbers.lifePath },
        { label: "EXPRESSION", num: numbers.expression },
        { label: "SOUL URGE", num: numbers.soulUrge },
        { label: "PERSONALITY", num: numbers.personality },
        ...(numbers.maturity ? [{ label: "MATURITY", num: numbers.maturity }] : []),
      ].filter((c) => c.num)
    : [];

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `vyberology-${firstName.toLowerCase()}-reading.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      void trackAnalyticsEvent("share_card_downloaded", { platform: "web", tier });
      toast({ title: "Card Downloaded", description: "Your share card has been saved." });
    } catch (err) {
      console.error("Card download failed:", err);
      toast({ title: "Download Failed", description: "Could not generate card image.", variant: "destructive" });
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    void trackAnalyticsEvent("share_link_copied", { platform: "web", tier });
    toast({ title: "Link Copied", description: shareUrl });
  };

  const handleShareTwitter = () => {
    const text = `I just discovered my Life Path number is ${lifePathNumber}. Get your own VYBE Reading:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    void trackAnalyticsEvent("share_twitter", { platform: "web", tier });
  };

  const handleShareWhatsApp = () => {
    const text = `Check out my Vyberology reading! Life Path ${lifePathNumber}. Get yours: ${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    void trackAnalyticsEvent("share_whatsapp", { platform: "web", tier });
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    void trackAnalyticsEvent("share_facebook", { platform: "web", tier });
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `My Vyberology Reading — Life Path ${lifePathNumber}`,
        text: `I just discovered my Life Path number is ${lifePathNumber}. Get your own VYBE Reading:`,
        url: shareUrl,
      });
      void trackAnalyticsEvent("share_native", { platform: "web", tier });
    } catch {
      // User cancelled share — not an error
    }
  };

  return (
    <div>
      {/* Share Card (visible + downloadable) */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl p-6 mb-4"
        style={{
          background: "linear-gradient(135deg, hsl(20, 8%, 8%) 0%, hsl(20, 8%, 14%) 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-white/[0.06] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-white/[0.04] pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Vyberology
            </p>
            {tier === "full-vybe" && (
              <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                Full VYBE
              </span>
            )}
          </div>

          {/* Name */}
          <p className="font-sans text-xs font-medium text-white/50 mb-3">{fullName}</p>

          {/* Life Path Hero */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-16 h-16 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: chakraColor }}
            >
              <span className="font-display text-3xl font-bold text-white">{lifePathNumber}</span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">Life Path {lifePathNumber}</p>
              {chakraName && (
                <p className="font-sans text-xs text-white/40 mt-0.5">{chakraName}</p>
              )}
            </div>
          </div>

          {/* All Numbers Grid */}
          {numberCards.length > 1 && (
            <div className={`grid gap-2 mb-5 ${numberCards.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
              {numberCards.map(({ label, num }) => (
                <div key={label} className="text-center py-2.5 px-1 rounded-xl bg-white/[0.06] relative">
                  <span className="font-display text-xl font-bold text-white block leading-none">
                    {num!.value}
                  </span>
                  {num!.isMaster && (
                    <span
                      className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: chakraColor }}
                    />
                  )}
                  <span className="font-sans text-[8px] font-semibold uppercase tracking-[0.06em] text-white/35 mt-1 block leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Chakra + Element row */}
          {(chakraName || elementName) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {chakraName && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chakraColor }} />
                  <span className="font-sans text-[10px] font-medium text-white/50">{chakraName}</span>
                </div>
              )}
              {elementName && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06]">
                  <span className="font-sans text-[10px] font-medium text-white/50">{elementName}</span>
                </div>
              )}
            </div>
          )}

          {/* Theme tags */}
          {themes && themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {themes.map((theme, i) => (
                <span
                  key={i}
                  className="font-sans text-[9px] font-medium px-2.5 py-1 rounded-full bg-white/[0.08] text-white/45"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <p className="font-sans text-[10px] text-white/30">
              Get your reading at vyberology.com
            </p>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleDownloadCard}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-xs font-medium bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12] transition-all cursor-pointer border-none"
        >
          <Download className="w-3.5 h-3.5" /> Save Card
        </button>

        {shareSlug && (
          <>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-xs font-medium bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12] transition-all cursor-pointer border-none"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </button>

            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-xs font-medium bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12] transition-all cursor-pointer border-none"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X
            </button>

            <button
              onClick={handleShareFacebook}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-xs font-medium bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12] transition-all cursor-pointer border-none"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-xs font-medium bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12] transition-all cursor-pointer border-none"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>

            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-xs font-medium bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12] transition-all cursor-pointer border-none"
              >
                <Share2 className="w-3.5 h-3.5" /> More
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
