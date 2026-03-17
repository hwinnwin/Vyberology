import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, Download, Heart } from "lucide-react";
import { ReadingRenderer } from "@/components/ReadingRenderer";
import { VybeShareCard } from "@/components/VybeShareCard";
import { Footer } from "@/components/Footer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { toast } from "@/hooks/use-toast";
import { getReadingById, type ReadingRow } from "@/services/readings";
import { TIER_BADGE, TIERS, type ReadingTier } from "@/lib/tiers";
import { trackAnalyticsEvent } from "@/lib/analytics";

const CHAKRA_COLORS: Record<string, string> = {
  root: "hsl(0, 45%, 45%)",
  sacral: "hsl(25, 60%, 55%)",
  "solar plexus": "hsl(42, 70%, 55%)",
  heart: "hsl(140, 25%, 50%)",
  throat: "hsl(195, 45%, 55%)",
  "third eye": "hsl(255, 35%, 55%)",
  crown: "hsl(280, 30%, 65%)",
};

function getChakraColor(chakraName: string): string {
  const lower = chakraName.toLowerCase();
  for (const [key, color] of Object.entries(CHAKRA_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "hsl(38, 41%, 58%)";
}

export default function ReadingResult() {
  const { readingId } = useParams<{ readingId: string }>();
  const navigate = useNavigate();
  const [reading, setReading] = useState<ReadingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!readingId) {
      setError("No reading ID provided");
      setLoading(false);
      return;
    }

    getReadingById(readingId)
      .then((data) => {
        if (!data) {
          setError("Reading not found");
        } else {
          setReading(data);
        }
      })
      .catch(() => setError("Failed to load reading"))
      .finally(() => setLoading(false));
  }, [readingId]);

  const handleDownloadPdf = async () => {
    if (!printRef.current || !reading) return;
    setPdfLoading(true);
    try {
      const { generateReadingPdf } = await import("@/lib/pdfGenerator");
      await generateReadingPdf(printRef.current, reading.full_name);
      void trackAnalyticsEvent("reading_pdf_downloaded", { platform: "web", tier: reading.tier });
      toast({ title: "PDF Downloaded", description: "Your reading has been saved as PDF." });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast({ title: "PDF Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vy-parchment grain">
        <LoadingSpinner size="lg" text="Loading your reading..." />
      </div>
    );
  }

  if (error || !reading) {
    return (
      <div className="min-h-screen flex flex-col bg-vy-parchment grain">
        <nav className="max-w-[720px] mx-auto w-full flex justify-between items-center px-6 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors bg-transparent border-none cursor-pointer">
            <ArrowLeft size={16} /> Back
          </button>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6">
          <ErrorMessage title="Reading Not Found" message={error || "This reading could not be loaded."} />
        </div>
      </div>
    );
  }

  const tier = reading.tier as ReadingTier;
  const tierConfig = TIERS[tier];
  const badge = TIER_BADGE[tier];
  const numbers = reading.numerology_numbers as Record<string, { value: number; isMaster: boolean }>;
  const semantics = reading.semantics as { chakra?: string; element?: string | string[]; themes?: string[]; note?: string } | null;
  const chakraName = semantics?.chakra ?? "";
  const chakraColor = getChakraColor(chakraName);
  const createdDate = new Date(reading.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const soulUrgeDeep = numbers.soulUrgeDeep;
  const soulUrgeUnified = !soulUrgeDeep || numbers.soulUrge?.value === soulUrgeDeep?.value;

  const numberCards = [
    { label: "Life Path", key: "lifePath" },
    { label: "Expression", key: "expression" },
    { label: "Personality", key: "personality" },
    ...(tier === "full-vybe" ? [{ label: "Maturity", key: "maturity" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-vy-parchment grain">
      {/* Nav */}
      <nav className="max-w-[720px] mx-auto w-full flex justify-between items-center px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Link
          to="/vybe"
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors no-underline"
        >
          <Home size={16} /> Home
        </Link>
      </nav>

      {/* Printable content wrapper */}
      <div ref={printRef}>
        {/* Header */}
        <header className="text-center px-6 pt-10 pb-6">
          <span className={`inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-4 ${badge.className}`}>
            {badge.text}
          </span>
          <p className="vy-label text-vy-warm-gray mb-2">{reading.full_name}</p>
          <h1 className="vy-display text-[clamp(28px,6vw,40px)] text-vy-charcoal mb-2">
            Your {tierConfig.label}
          </h1>
          <div className="vy-divider max-w-[80px] mx-auto mb-3" />
          <p className="font-sans text-xs text-vy-charcoal/40">{createdDate}</p>
        </header>

        {/* Number Cards */}
        <section className="max-w-[720px] mx-auto px-6 pb-8">
          <div className={`grid gap-3 ${numberCards.length <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
            {numberCards.map(({ label, key }) => {
              const num = numbers[key];
              if (!num) return null;
              return (
                <div
                  key={key}
                  className="relative text-center p-4 rounded-2xl border bg-white/50 backdrop-blur-sm"
                  style={{ borderColor: `${chakraColor}30` }}
                >
                  <span className="font-display text-3xl font-bold text-vy-charcoal">
                    {num.value}
                  </span>
                  {num.isMaster && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" title="Master Number" />
                  )}
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Dual Soul Urge */}
          <div className="mt-4">
            {soulUrgeUnified ? (
              <div className="text-center p-5 rounded-2xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: `${chakraColor}30` }}>
                <span className="font-display text-3xl font-bold text-vy-charcoal">
                  {numbers.soulUrge?.value}
                </span>
                {numbers.soulUrge?.isMaster && (
                  <span className="inline-block ml-2 w-2 h-2 rounded-full bg-vy-gold align-middle" title="Master Number" />
                )}
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                  Soul Urge
                </p>
                <p className="font-sans text-[11px] text-vy-charcoal/40 mt-2 max-w-[360px] mx-auto">
                  Your soul frequencies are unified — no Y in your birth name.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative text-center p-4 rounded-2xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: `${chakraColor}30` }}>
                    <span className="font-display text-3xl font-bold text-vy-charcoal">
                      {numbers.soulUrge?.value}
                    </span>
                    {numbers.soulUrge?.isMaster && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" title="Master Number" />
                    )}
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                      Active Soul Freq.
                    </p>
                  </div>
                  <div className="relative text-center p-4 rounded-2xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: `${chakraColor}30` }}>
                    <span className="font-display text-3xl font-bold text-vy-charcoal">
                      {soulUrgeDeep.value}
                    </span>
                    {soulUrgeDeep.isMaster && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" title="Master Number" />
                    )}
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                      Deep Soul Blueprint
                    </p>
                  </div>
                </div>
                <p className="font-sans text-[11px] text-vy-charcoal/40 text-center mt-3 max-w-[480px] mx-auto leading-relaxed">
                  Your Active Soul Frequency reveals how your soul is currently expressing.
                  Your Deep Soul Blueprint reveals your soul's deeper hunger and destiny.
                </p>
              </>
            )}
          </div>
        </section>

        {/* Chakra + Element */}
        {semantics && (
          <section className="max-w-[720px] mx-auto px-6 pb-8">
            <div className="flex flex-wrap justify-center gap-3">
              {chakraName && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-vy-charcoal/[0.08] bg-white/50">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chakraColor }} />
                  <span className="font-sans text-sm font-medium text-vy-charcoal/80">{chakraName}</span>
                </div>
              )}
              {semantics.element && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-vy-charcoal/[0.08] bg-white/50">
                  <span className="font-sans text-sm font-medium text-vy-charcoal/80">
                    {Array.isArray(semantics.element) ? semantics.element.map(e => e[0].toUpperCase() + e.slice(1)).join(" + ") : semantics.element}
                  </span>
                </div>
              )}
            </div>
            {semantics.themes && semantics.themes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {semantics.themes.map((theme, i) => (
                  <span key={i} className="font-sans text-xs font-medium px-4 py-1.5 rounded-full bg-vy-charcoal text-vy-parchment">
                    {theme}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* AI Reading */}
        {reading.reading_text && (
          <section className="max-w-[720px] mx-auto px-6 pb-8">
            <div className="vy-divider mb-8" />
            <div className="border border-vy-charcoal/[0.08] rounded-2xl p-6 bg-white/50 backdrop-blur-sm shadow-vy-soft">
              <ReadingRenderer text={reading.reading_text} />
            </div>
          </section>
        )}
      </div>

      {/* Actions */}
      <section className="max-w-[720px] mx-auto px-6 pb-8 w-full">
        <div className="vy-divider mb-8" />

        {/* Share Card */}
        <VybeShareCard
          fullName={reading.full_name}
          lifePathNumber={numbers.lifePath?.value ?? 0}
          chakraName={chakraName}
          chakraColor={chakraColor}
          elementName={
            semantics?.element
              ? Array.isArray(semantics.element)
                ? semantics.element.map(e => e[0].toUpperCase() + e.slice(1)).join(" + ")
                : semantics.element[0].toUpperCase() + semantics.element.slice(1)
              : undefined
          }
          themes={semantics?.themes}
          tier={tier}
          shareSlug={reading.share_slug ?? undefined}
          numbers={numbers}
        />

        {/* PDF Download ($19 only) */}
        {tierConfig.hasPdf && (
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="w-full mt-4 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {pdfLoading ? "Generating PDF..." : "Download PDF Report"}
          </button>
        )}
      </section>

      {/* CTA: Gift a reading */}
      <section className="max-w-[720px] mx-auto px-6 pb-16 w-full">
        <div className="p-6 rounded-2xl border border-vy-gold/20 bg-white/50 backdrop-blur-sm text-center">
          <Heart className="w-6 h-6 text-vy-gold mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold text-vy-charcoal mb-2">
            Gift a Reading
          </h3>
          <p className="font-sans text-sm text-vy-charcoal/50 mb-4">
            Know someone who would love their own Soul Blueprint?
          </p>
          <Link
            to="/lyf-path"
            className="inline-block px-6 py-2.5 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all no-underline"
          >
            Get a Reading for Someone You Love
          </Link>
        </div>
      </section>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
