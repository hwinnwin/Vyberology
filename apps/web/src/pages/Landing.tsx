import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

/* ─────────────────────────────────────────────
   Intersection Observer hook for scroll reveals
   ───────────────────────────────────────────── */
function useScrollReveal() {
  const refs = useRef<(HTMLElement | null)[]>([]);

  const setRef = useCallback((index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("landed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return setRef;
}

/* ─────────────────────────────────────────────
   Sacred Geometry SVG — concentric circles
   ───────────────────────────────────────────── */
function SacredCircles({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="400" cy="400" r="380" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      <circle cx="400" cy="400" r="280" stroke="currentColor" strokeWidth="0.5" opacity="0.10" />
      <circle cx="400" cy="400" r="180" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <circle cx="400" cy="400" r="80" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      {/* Vesica piscis intersection */}
      <circle cx="340" cy="400" r="160" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
      <circle cx="460" cy="400" r="160" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
      {/* Cross lines */}
      <line x1="400" y1="20" x2="400" y2="780" stroke="currentColor" strokeWidth="0.3" opacity="0.04" />
      <line x1="20" y1="400" x2="780" y2="400" stroke="currentColor" strokeWidth="0.3" opacity="0.04" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Thin gold marker
   ───────────────────────────────────────────── */
function GoldMarker() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-vy-gold/60 mr-4 mt-[7px] shrink-0"
      aria-hidden="true"
    />
  );
}

/* ═════════════════════════════════════════════
   LANDING PAGE
   ═════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const setRef = useScrollReveal();
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/vybe", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen grain">
      {/* ═══════════════════════════════════════
          HERO — Full viewport, parchment
          ═══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center bg-vy-parchment overflow-hidden">
        {/* Sign in — top left */}
        <button
          onClick={() => navigate("/auth")}
          className="absolute top-5 left-6 z-20 font-sans text-xs font-medium tracking-[0.06em] uppercase text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 bg-transparent border-none cursor-pointer"
        >
          {t("auth.signIn")}
        </button>

        {/* Language toggle — top right */}
        <div className="absolute top-5 right-6 z-20 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-vy-charcoal/30" />
          {LANGUAGES.map((lang, idx) => (
            <span key={lang.code} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-vy-charcoal/20 text-xs">|</span>}
              <button
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`font-sans text-xs tracking-[0.04em] bg-transparent border-none cursor-pointer px-1 py-0.5 transition-colors duration-200 ${
                  i18n.language === lang.code || i18n.language.startsWith(lang.code + "-")
                    ? "text-vy-charcoal font-medium"
                    : "text-vy-charcoal/35 hover:text-vy-charcoal/60"
                }`}
              >
                {lang.label}
              </button>
            </span>
          ))}
        </div>

        {/* Sacred geometry background */}
        <SacredCircles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,800px)] h-[min(90vw,800px)] text-vy-gold pointer-events-none" />

        {/* Slow rotating outer ring */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(110vw,1000px)] h-[min(110vw,1000px)] rounded-full border border-vy-gold/[0.06] pointer-events-none"
          style={{ animation: "vy-spin 120s linear infinite" }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[740px] mx-auto px-6 text-center">
          <p className="vy-label text-vy-gold mb-8 vy-reveal vy-reveal-1">
            {t("landing.heroLabel")}
          </p>

          <h1 className="vy-display text-[clamp(32px,7vw,64px)] text-vy-indigo mb-8 vy-reveal vy-reveal-2 leading-[1.1] vy-hero-heading">
            {t("landing.heroHeading1")}
            <br />
            {t("landing.heroHeading2")}
          </h1>

          <div className="vy-divider max-w-[100px] mx-auto mb-8 vy-reveal vy-reveal-3" />

          <p className="font-sans text-[clamp(16px,2.2vw,19px)] font-light text-vy-charcoal/65 max-w-[540px] mx-auto leading-relaxed mb-12 vy-reveal vy-reveal-4">
            {t("landing.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 vy-reveal vy-reveal-5">
            <button
              onClick={() => navigate("/vybe")}
              className="px-8 py-3.5 bg-vy-charcoal text-vy-parchment font-sans text-sm font-medium tracking-[0.04em] rounded-full transition-all duration-300 hover:shadow-vy-glow hover:bg-vy-charcoal/90 active:scale-[0.98]"
            >
              {t("landing.heroCtaPrimary")}
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("origin");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-3.5 bg-transparent border border-vy-gold/40 text-vy-charcoal/70 font-sans text-sm font-medium tracking-[0.04em] rounded-full transition-all duration-300 hover:border-vy-gold hover:text-vy-charcoal active:scale-[0.98]"
            >
              {t("landing.heroCtaSecondary")}
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 vy-reveal vy-reveal-6">
          <div className="w-px h-10 bg-gradient-to-b from-vy-gold/40 to-transparent mx-auto mb-2" />
          <p className="vy-label text-vy-warm-gray/50 text-[9px]">{t("landing.scroll")}</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 1 — THE PROBLEM (dark)
          ═══════════════════════════════════════ */}
      <section id="origin" className="bg-vy-charcoal py-32 sm:py-40 px-6">
        <div
          ref={setRef(0)}
          className="landing-reveal max-w-[600px] mx-auto text-center"
        >
          <p className="vy-label text-vy-gold/70 mb-10">{t("landing.problemLabel")}</p>

          <h2 className="vy-display text-[clamp(36px,6vw,56px)] text-vy-parchment mb-16 leading-[1.1]">
            {t("landing.problemHeading")}
          </h2>

          <div className="space-y-4 mb-16">
            <p className="font-sans text-lg sm:text-xl font-light text-vy-parchment/50">
              {t("landing.problemLine1")}
            </p>
            <p className="font-sans text-lg sm:text-xl font-light text-vy-parchment/50">
              {t("landing.problemLine2")}
            </p>
            <p className="font-sans text-lg sm:text-xl font-light text-vy-parchment/50">
              {t("landing.problemLine3")}
            </p>
          </div>

          <div className="vy-divider max-w-[80px] mx-auto mb-16" />

          <p className="font-sans text-base sm:text-lg text-vy-parchment/70 leading-relaxed max-w-[440px] mx-auto">
            {t("landing.problemBody1")}
            <br />
            <span className="text-vy-parchment/90 font-normal">
              {t("landing.problemBody2")}
            </span>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 2 — THE SHIFT (parchment)
          ═══════════════════════════════════════ */}
      <section className="bg-vy-parchment py-32 sm:py-40 px-6">
        <div
          ref={setRef(1)}
          className="landing-reveal max-w-[680px] mx-auto"
        >
          <p className="vy-label text-vy-gold/70 text-center mb-10">
            {t("landing.evolutionLabel")}
          </p>

          <h2 className="vy-display text-[clamp(32px,5.5vw,48px)] text-vy-charcoal text-center mb-10 leading-[1.15]">
            {t("landing.evolutionHeading1")}
            <br />
            {t("landing.evolutionHeading2")}
          </h2>

          <div className="vy-divider max-w-[80px] mx-auto mb-12" />

          <p className="font-sans text-base sm:text-lg font-light text-vy-charcoal/60 leading-relaxed text-center max-w-[520px] mx-auto mb-16">
            {t("landing.evolutionBody")}
          </p>

          {/* Five pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 max-w-[520px] mx-auto mb-16">
            {([
              ["landing.pillar1Title", "landing.pillar1Sub"],
              ["landing.pillar2Title", "landing.pillar2Sub"],
              ["landing.pillar3Title", "landing.pillar3Sub"],
              ["landing.pillar4Title", "landing.pillar4Sub"],
              ["landing.pillar5Title", "landing.pillar5Sub"],
            ] as const).map(([titleKey, subKey], i) => (
              <div key={i} className="flex items-start">
                <GoldMarker />
                <div>
                  <p className="font-sans text-sm font-medium text-vy-charcoal tracking-[0.01em]">
                    {t(titleKey)}
                  </p>
                  <p className="font-sans text-xs text-vy-warm-gray mt-0.5">
                    {t(subKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="font-sans text-center text-sm sm:text-base text-vy-charcoal/50 italic max-w-[400px] mx-auto">
            {t("landing.evolutionClose1")}
            <br />
            <span className="not-italic font-medium text-vy-charcoal/80">
              {t("landing.evolutionClose2")}
            </span>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 3 — WHAT THE APP DOES
          ═══════════════════════════════════════ */}
      <section className="bg-vy-cream py-32 sm:py-40 px-6">
        <div
          ref={setRef(2)}
          className="landing-reveal max-w-[640px] mx-auto"
        >
          <p className="vy-label text-vy-gold/70 text-center mb-10">
            {t("landing.systemLabel")}
          </p>

          <h2 className="vy-display text-[clamp(32px,5.5vw,48px)] text-vy-charcoal text-center mb-16 leading-[1.15]">
            {t("landing.systemHeading")}
          </h2>

          <div className="space-y-5 max-w-[480px] mx-auto mb-16">
            {([
              "landing.systemItem1",
              "landing.systemItem2",
              "landing.systemItem3",
              "landing.systemItem4",
              "landing.systemItem5",
            ] as const).map((key, i) => (
              <div key={i} className="flex items-start group">
                <span className="inline-block w-6 h-px bg-vy-gold/40 mt-[11px] mr-4 shrink-0 transition-all duration-300 group-hover:w-8 group-hover:bg-vy-gold/70" />
                <p className="font-sans text-[15px] text-vy-charcoal/70 leading-relaxed">
                  {t(key)}
                </p>
              </div>
            ))}
          </div>

          <div className="vy-divider max-w-[60px] mx-auto mb-10" />

          <p className="font-sans text-center text-sm sm:text-base text-vy-charcoal/55 max-w-[420px] mx-auto leading-relaxed">
            {t("landing.systemClose")}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 4 — WHO IT'S FOR (dark)
          ═══════════════════════════════════════ */}
      <section className="bg-vy-charcoal py-32 sm:py-40 px-6">
        <div
          ref={setRef(3)}
          className="landing-reveal max-w-[720px] mx-auto"
        >
          <p className="vy-label text-vy-gold/70 text-center mb-10">
            {t("landing.audienceLabel")}
          </p>

          <h2 className="vy-display text-[clamp(28px,5vw,44px)] text-vy-parchment text-center mb-16 leading-[1.2]">
            {t("landing.audienceHeading1")}
            <br />
            {t("landing.audienceHeading2")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-[560px] mx-auto mb-20">
            {([
              ["landing.audience1Title", "landing.audience1Desc"],
              ["landing.audience2Title", "landing.audience2Desc"],
              ["landing.audience3Title", "landing.audience3Desc"],
              ["landing.audience4Title", "landing.audience4Desc"],
            ] as const).map(([titleKey, descKey], i) => (
              <div key={i} className="border-l border-vy-gold/20 pl-5">
                <p className="font-sans text-sm font-medium text-vy-parchment tracking-[0.02em] mb-1.5">
                  {t(titleKey)}
                </p>
                <p className="font-sans text-xs font-light text-vy-parchment/40 leading-relaxed">
                  {t(descKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center max-w-[460px] mx-auto">
            <p className="font-sans text-sm text-vy-parchment/35 leading-relaxed">
              {t("landing.audienceClose1")}
            </p>
            <p className="font-sans text-sm text-vy-parchment/70 mt-2 font-medium">
              {t("landing.audienceClose2")}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 5 — POSITIONING (parchment)
          ═══════════════════════════════════════ */}
      <section className="bg-vy-parchment py-32 sm:py-40 px-6">
        <div
          ref={setRef(4)}
          className="landing-reveal max-w-[580px] mx-auto text-center"
        >
          <h2 className="vy-display text-[clamp(28px,5vw,44px)] text-vy-charcoal mb-10 leading-[1.2]">
            {t("landing.positioningHeading1")}
            <br />
            {t("landing.positioningHeading2")}
          </h2>

          <div className="vy-divider max-w-[60px] mx-auto mb-10" />

          <p className="font-sans text-base sm:text-lg font-light text-vy-charcoal/55 leading-relaxed mb-10 max-w-[440px] mx-auto">
            {t("landing.positioningBody")}
          </p>

          <p className="vy-display-italic text-[clamp(24px,4vw,36px)] text-vy-gold/80">
            {t("landing.positioningClose")}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA (dark)
          ═══════════════════════════════════════ */}
      <section className="relative bg-vy-charcoal py-32 sm:py-40 px-6 overflow-hidden">
        {/* Faint sacred geometry */}
        <SacredCircles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] text-vy-gold pointer-events-none opacity-40" />

        <div
          ref={setRef(5)}
          className="landing-reveal relative z-10 max-w-[580px] mx-auto text-center"
        >
          <h2 className="vy-display text-[clamp(32px,6vw,52px)] text-vy-parchment mb-8 leading-[1.15]">
            {t("landing.ctaHeading1")}
            <br />
            {t("landing.ctaHeading2")}
          </h2>

          <p className="font-sans text-sm sm:text-base font-light text-vy-parchment/45 leading-relaxed mb-12 max-w-[400px] mx-auto">
            {t("landing.ctaBody")}
          </p>

          <button
            onClick={() => navigate("/vybe")}
            className="px-10 py-4 bg-vy-gold/90 text-vy-charcoal font-sans text-sm font-semibold tracking-[0.06em] uppercase rounded-full transition-all duration-300 hover:bg-vy-gold hover:shadow-vy-glow active:scale-[0.98]"
          >
            {t("landing.ctaButton")}
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════ */}
      <Footer />

      {/* ═══════════════════════════════════════
          Scoped styles for scroll reveals
          ═══════════════════════════════════════ */}
      <style>{`
        .landing-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .landing-reveal.landed {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes vy-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
