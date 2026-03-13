import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";

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

  return (
    <div className="min-h-screen grain">
      {/* ═══════════════════════════════════════
          HERO — Full viewport, parchment
          ═══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center bg-vy-parchment overflow-hidden">
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
            Signal Mapping System
          </p>

          <h1 className="vy-display text-[clamp(32px,7vw,64px)] text-vy-indigo mb-8 vy-reveal vy-reveal-2 leading-[1.1] vy-hero-heading">
            Your Life Is Already
            <br />
            Giving You Signals.
          </h1>

          <div className="vy-divider max-w-[100px] mx-auto mb-8 vy-reveal vy-reveal-3" />

          <p className="font-sans text-[clamp(16px,2.2vw,19px)] font-light text-vy-charcoal/65 max-w-[540px] mx-auto leading-relaxed mb-12 vy-reveal vy-reveal-4">
            Vyberology translates numerical patterns into structured
            guidance&nbsp;&mdash; helping you move with clarity toward your
            highest trajectory.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 vy-reveal vy-reveal-5">
            <button
              onClick={() => navigate("/auth")}
              className="px-8 py-3.5 bg-vy-charcoal text-vy-parchment font-sans text-sm font-medium tracking-[0.04em] rounded-full transition-all duration-300 hover:shadow-vy-glow hover:bg-vy-charcoal/90 active:scale-[0.98]"
            >
              Join Early Access
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("origin");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-3.5 bg-transparent border border-vy-gold/40 text-vy-charcoal/70 font-sans text-sm font-medium tracking-[0.04em] rounded-full transition-all duration-300 hover:border-vy-gold hover:text-vy-charcoal active:scale-[0.98]"
            >
              Watch the Origin Story
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 vy-reveal vy-reveal-6">
          <div className="w-px h-10 bg-gradient-to-b from-vy-gold/40 to-transparent mx-auto mb-2" />
          <p className="vy-label text-vy-warm-gray/50 text-[9px]">Scroll</p>
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
          <p className="vy-label text-vy-gold/70 mb-10">The Problem</p>

          <h2 className="vy-display text-[clamp(36px,6vw,56px)] text-vy-parchment mb-16 leading-[1.1]">
            Modern Life Is Loud.
          </h2>

          <div className="space-y-4 mb-16">
            <p className="font-sans text-lg sm:text-xl font-light text-vy-parchment/50">
              Too much input.
            </p>
            <p className="font-sans text-lg sm:text-xl font-light text-vy-parchment/50">
              Too many decisions.
            </p>
            <p className="font-sans text-lg sm:text-xl font-light text-vy-parchment/50">
              Not enough signal clarity.
            </p>
          </div>

          <div className="vy-divider max-w-[80px] mx-auto mb-16" />

          <p className="font-sans text-base sm:text-lg text-vy-parchment/70 leading-relaxed max-w-[440px] mx-auto">
            We don&rsquo;t lack information.
            <br />
            <span className="text-vy-parchment/90 font-normal">
              We lack interpretation.
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
            The Evolution
          </p>

          <h2 className="vy-display text-[clamp(32px,5.5vw,48px)] text-vy-charcoal text-center mb-10 leading-[1.15]">
            From Numerology
            <br />
            to Calibration.
          </h2>

          <div className="vy-divider max-w-[80px] mx-auto mb-12" />

          <p className="font-sans text-base sm:text-lg font-light text-vy-charcoal/60 leading-relaxed text-center max-w-[520px] mx-auto mb-16">
            Numerology mapped symbolic meaning to numbers.
            Vyberology expands it into a contextual system.
          </p>

          {/* Five pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 max-w-[520px] mx-auto mb-16">
            {[
              ["Full-sum mapping", "Not reduction"],
              ["Life Path architecture", "Your base frequency"],
              ["Soul Urge drive", "Inner motivation"],
              ["Expression projection", "How you show up"],
              ["Maturity integration", "Cycles of growth"],
            ].map(([title, sub], i) => (
              <div key={i} className="flex items-start">
                <GoldMarker />
                <div>
                  <p className="font-sans text-sm font-medium text-vy-charcoal tracking-[0.01em]">
                    {title}
                  </p>
                  <p className="font-sans text-xs text-vy-warm-gray mt-0.5">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="font-sans text-center text-sm sm:text-base text-vy-charcoal/50 italic max-w-[400px] mx-auto">
            This isn&rsquo;t fortune telling.
            <br />
            <span className="not-italic font-medium text-vy-charcoal/80">
              It&rsquo;s structured reflection.
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
            The System
          </p>

          <h2 className="vy-display text-[clamp(32px,5.5vw,48px)] text-vy-charcoal text-center mb-16 leading-[1.15]">
            A Mirror, Not A Prophet.
          </h2>

          <div className="space-y-5 max-w-[480px] mx-auto mb-16">
            {[
              "Generates structured readings from your birth data",
              "Maps personal cycles and recurring patterns",
              "Interprets visible number patterns in real-time",
              "Provides alignment prompts and guidance",
              "Tracks long-term evolution across readings",
            ].map((item, i) => (
              <div key={i} className="flex items-start group">
                <span className="inline-block w-6 h-px bg-vy-gold/40 mt-[11px] mr-4 shrink-0 transition-all duration-300 group-hover:w-8 group-hover:bg-vy-gold/70" />
                <p className="font-sans text-[15px] text-vy-charcoal/70 leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div className="vy-divider max-w-[60px] mx-auto mb-10" />

          <p className="font-sans text-center text-sm sm:text-base text-vy-charcoal/55 max-w-[420px] mx-auto leading-relaxed">
            The app standardises interpretation&nbsp;&mdash; reducing bias and
            increasing clarity.
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
            The Audience
          </p>

          <h2 className="vy-display text-[clamp(28px,5vw,44px)] text-vy-parchment text-center mb-16 leading-[1.2]">
            For People Who Care
            <br />
            About Their Trajectory.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-[560px] mx-auto mb-20">
            {[
              ["Founders", "Navigating major decisions with limited signal"],
              ["Creators", "In transition between phases of expression"],
              ["High-agency individuals", "Seeking calibration, not entertainment"],
              ["Anyone pursuing their highest timeline", "Willing to look inward before moving forward"],
            ].map(([title, desc], i) => (
              <div
                key={i}
                className="border-l border-vy-gold/20 pl-5"
              >
                <p className="font-sans text-sm font-medium text-vy-parchment tracking-[0.02em] mb-1.5">
                  {title}
                </p>
                <p className="font-sans text-xs font-light text-vy-parchment/40 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center max-w-[460px] mx-auto">
            <p className="font-sans text-sm text-vy-parchment/35 leading-relaxed">
              If you want passive entertainment, this isn&rsquo;t it.
            </p>
            <p className="font-sans text-sm text-vy-parchment/70 mt-2 font-medium">
              If you want structured reflection, it is.
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
            Not Belief.
            <br />
            Not Dogma. Not Fate.
          </h2>

          <div className="vy-divider max-w-[60px] mx-auto mb-10" />

          <p className="font-sans text-base sm:text-lg font-light text-vy-charcoal/55 leading-relaxed mb-10 max-w-[440px] mx-auto">
            Vyberology does not predict the future. It helps you interpret your
            present position relative to your potential direction.
          </p>

          <p className="vy-display-italic text-[clamp(24px,4vw,36px)] text-vy-gold/80">
            It&rsquo;s feedback.
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
            Start Reading
            <br />
            The Signal.
          </h2>

          <p className="font-sans text-sm sm:text-base font-light text-vy-parchment/45 leading-relaxed mb-12 max-w-[400px] mx-auto">
            Early access members receive lifetime founder pricing and priority
            feature input.
          </p>

          <button
            onClick={() => navigate("/auth")}
            className="px-10 py-4 bg-vy-gold/90 text-vy-charcoal font-sans text-sm font-semibold tracking-[0.06em] uppercase rounded-full transition-all duration-300 hover:bg-vy-gold hover:shadow-vy-glow active:scale-[0.98]"
          >
            Join Early Access
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
