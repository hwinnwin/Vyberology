import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ReadingRenderer } from "@/components/ReadingRenderer";
import { Footer } from "@/components/Footer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getReadingBySlug, type ReadingRow } from "@/services/readings";
import { TIER_BADGE, type ReadingTier } from "@/lib/tiers";

export default function SharedReading() {
  const { slug } = useParams<{ slug: string }>();
  const [reading, setReading] = useState<ReadingRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    getReadingBySlug(slug)
      .then((data) => setReading(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vy-parchment grain">
        <LoadingSpinner size="lg" text="Loading reading..." />
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-vy-parchment grain px-6">
        <h1 className="vy-display text-3xl text-vy-charcoal mb-4">Reading Not Found</h1>
        <p className="font-sans text-sm text-vy-charcoal/50 mb-6">This reading link may have expired or doesn't exist.</p>
        <Link
          to="/lyf-path"
          className="px-6 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all no-underline"
        >
          Get Your Own Reading
        </Link>
      </div>
    );
  }

  const tier = reading.tier as ReadingTier;
  const badge = TIER_BADGE[tier];
  const numbers = reading.numerology_numbers as Record<string, { value: number; isMaster: boolean }>;
  const semantics = reading.semantics as { chakra?: string; themes?: string[] } | null;
  const createdDate = new Date(reading.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-vy-parchment grain">
      {/* Header */}
      <header className="text-center px-6 pt-16 pb-8">
        <p className="vy-label text-vy-gold mb-4">Vyberology</p>
        <span className={`inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-4 ${badge.className}`}>
          {badge.text}
        </span>
        <p className="vy-label text-vy-warm-gray mb-2">{reading.full_name}</p>
        <h1 className="vy-display text-[clamp(36px,7vw,48px)] text-vy-charcoal mb-3">
          Life Path {numbers.lifePath?.value}
        </h1>
        <div className="vy-divider max-w-[80px] mx-auto mb-3" />
        <p className="font-sans text-xs text-vy-charcoal/40">{createdDate}</p>
      </header>

      {/* Numbers grid */}
      <section className="max-w-[720px] mx-auto px-6 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {(["lifePath", "expression", "personality"] as const).map((key) => {
            const num = numbers[key];
            if (!num) return null;
            const labels: Record<string, string> = { lifePath: "Life Path", expression: "Expression", personality: "Personality" };
            return (
              <div key={key} className="relative text-center p-4 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50">
                <span className="font-display text-3xl font-bold text-vy-charcoal">{num.value}</span>
                {num.isMaster && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" />}
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">{labels[key]}</p>
              </div>
            );
          })}
        </div>

        {/* Dual Soul Urge */}
        {(() => {
          const su = numbers.soulUrge;
          const sud = numbers.soulUrgeDeep;
          const unified = !sud || su?.value === sud?.value;
          if (!su) return null;
          return (
            <div className="mt-4">
              {unified ? (
                <div className="text-center p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50">
                  <span className="font-display text-3xl font-bold text-vy-charcoal">{su.value}</span>
                  {su.isMaster && <span className="inline-block ml-2 w-2 h-2 rounded-full bg-vy-gold align-middle" />}
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">Soul Urge</p>
                  <p className="font-sans text-[11px] text-vy-charcoal/40 mt-2">Your soul frequencies are unified — no Y in your birth name.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative text-center p-4 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50">
                      <span className="font-display text-3xl font-bold text-vy-charcoal">{su.value}</span>
                      {su.isMaster && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" />}
                      <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">Active Soul Freq.</p>
                    </div>
                    <div className="relative text-center p-4 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50">
                      <span className="font-display text-3xl font-bold text-vy-charcoal">{sud.value}</span>
                      {sud.isMaster && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" />}
                      <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">Deep Soul Blueprint</p>
                    </div>
                  </div>
                  <p className="font-sans text-[11px] text-vy-charcoal/40 text-center mt-3 max-w-[480px] mx-auto leading-relaxed">
                    Your Active Soul Frequency reveals how your soul is currently expressing. Your Deep Soul Blueprint reveals your soul's deeper hunger and destiny.
                  </p>
                </>
              )}
            </div>
          );
        })()}
      </section>

      {/* Themes */}
      {semantics?.themes && semantics.themes.length > 0 && (
        <section className="max-w-[720px] mx-auto px-6 pb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {semantics.themes.map((theme, i) => (
              <span key={i} className="font-sans text-xs font-medium px-4 py-1.5 rounded-full bg-vy-charcoal text-vy-parchment">
                {theme}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Reading preview (show first portion) */}
      {reading.reading_text && (
        <section className="max-w-[720px] mx-auto px-6 pb-8">
          <div className="vy-divider mb-8" />
          <div className="relative border border-vy-charcoal/[0.08] rounded-2xl p-6 bg-white/50 backdrop-blur-sm shadow-vy-soft overflow-hidden">
            <div className="max-h-[300px] overflow-hidden">
              <ReadingRenderer text={reading.reading_text} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-[720px] mx-auto px-6 pb-16 text-center">
        <div className="p-8 rounded-2xl border border-vy-gold/20 bg-white/50 backdrop-blur-sm">
          <p className="vy-label text-vy-gold mb-3">Your Turn</p>
          <h2 className="font-display text-2xl font-semibold text-vy-charcoal mb-3">
            Discover Your Soul Blueprint
          </h2>
          <p className="font-sans text-sm text-vy-charcoal/50 mb-6 max-w-[360px] mx-auto">
            Get your own personalized numerology reading with AI-powered deep interpretation.
          </p>
          <Link
            to="/lyf-path"
            className="inline-block px-8 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all no-underline"
          >
            Get Your VYBE Reading
          </Link>
        </div>
      </section>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
