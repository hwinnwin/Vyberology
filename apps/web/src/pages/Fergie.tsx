import { useState, useEffect, useRef } from "react";
import "./fergie.css";

const SPECS = [
  { label: "Engine", value: "2.5L Inline-5 TFSI", icon: "cylinder" },
  { label: "Power", value: "401 HP", icon: "bolt" },
  { label: "Torque", value: "369 lb-ft", icon: "gauge" },
  { label: "0-60 mph", value: "3.3 sec", icon: "timer" },
  { label: "Top Speed", value: "180 mph", icon: "speed" },
  { label: "Drive", value: "quattro AWD", icon: "wheels" },
];

const PERFORMANCE_HIGHLIGHTS = [
  {
    number: "01",
    title: "Five-Cylinder Fury",
    description:
      "The legendary 2.5L inline-five produces that unmistakable warble — a sound so visceral it turns heads before you even come into view. 401 horsepower channeled through seven gears of dual-clutch precision.",
  },
  {
    number: "02",
    title: "quattro Dominance",
    description:
      "Rear-biased torque vectoring quattro all-wheel drive. It doesn't just grip — it rotates. RS Torque Splitter distributes power to each rear wheel independently, making oversteer your ally.",
  },
  {
    number: "03",
    title: "Track-Bred DNA",
    description:
      "RS sport suspension with adaptive dampers. RS ceramic brakes available. Launch control that pins you to the seat with 1.2G of acceleration force. Built for the Nürburgring, unleashed on your road.",
  },
];

const GALLERY_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
    alt: "RS3 front aggressive stance",
    caption: "Widebody Aggression",
  },
  {
    url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80",
    alt: "RS3 interior cockpit",
    caption: "Driver-Focused Cockpit",
  },
  {
    url: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
    alt: "RS3 rear diffuser detail",
    caption: "Functional Aerodynamics",
  },
  {
    url: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80",
    alt: "RS3 wheel detail",
    caption: "19\" Forged Alloys",
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function Fergie() {
  const [loaded, setLoaded] = useState(false);
  const [activeGallery, setActiveGallery] = useState(0);
  const heroSection = useInView(0.1);
  const specsSection = useInView(0.1);
  const perfSection = useInView(0.1);
  const gallerySection = useInView(0.1);
  const ctaSection = useInView(0.1);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGallery((prev) => (prev + 1) % GALLERY_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fergie-page">
      {/* Preloader */}
      <div className={`fergie-preloader ${loaded ? "fergie-preloader--done" : ""}`}>
        <div className="fergie-preloader__ring" />
        <span className="fergie-preloader__text">RS3</span>
      </div>

      {/* Fixed nav */}
      <nav className="fergie-nav">
        <div className="fergie-nav__logo">
          <svg viewBox="0 0 100 40" className="fergie-nav__audi-rings">
            <circle cx="18" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="38" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="58" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="78" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="fergie-nav__links">
          <a href="#specs">Specs</a>
          <a href="#performance">Performance</a>
          <a href="#gallery">Gallery</a>
          <a href="#configure">Configure</a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section ref={heroSection.ref} className="fergie-hero">
        <div className="fergie-hero__noise" />
        <div className="fergie-hero__gradient" />
        <div className="fergie-hero__lines">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="fergie-hero__line" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>

        <div className={`fergie-hero__content ${heroSection.inView ? "fergie--visible" : ""}`}>
          <div className="fergie-hero__badge">
            <span className="fergie-hero__badge-dot" />
            RS Performance
          </div>
          <h1 className="fergie-hero__title">
            <span className="fergie-hero__title-the">The</span>
            <span className="fergie-hero__title-name">Fergie</span>
          </h1>
          <p className="fergie-hero__subtitle">
            Audi RS 3 Sportback — 401 HP of Five-Cylinder Fury
          </p>
          <div className="fergie-hero__stats">
            <div className="fergie-hero__stat">
              <span className="fergie-hero__stat-value">
                <AnimatedCounter target={401} />
              </span>
              <span className="fergie-hero__stat-label">Horsepower</span>
            </div>
            <div className="fergie-hero__stat-divider" />
            <div className="fergie-hero__stat">
              <span className="fergie-hero__stat-value">
                <AnimatedCounter target={3} suffix=".3s" />
              </span>
              <span className="fergie-hero__stat-label">0-60 mph</span>
            </div>
            <div className="fergie-hero__stat-divider" />
            <div className="fergie-hero__stat">
              <span className="fergie-hero__stat-value">
                <AnimatedCounter target={180} suffix=" mph" />
              </span>
              <span className="fergie-hero__stat-label">Top Speed</span>
            </div>
          </div>
          <div className="fergie-hero__ctas">
            <a href="#configure" className="fergie-btn fergie-btn--primary">
              Configure Yours
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fergie-btn__arrow">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href="#performance" className="fergie-btn fergie-btn--ghost">
              Explore Performance
            </a>
          </div>
        </div>

        <div className="fergie-hero__scroll">
          <div className="fergie-hero__scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ─── SPECS ─── */}
      <section id="specs" ref={specsSection.ref} className="fergie-specs">
        <div className="fergie-specs__header">
          <span className="fergie-section-tag">01 / Technical</span>
          <h2 className={`fergie-section-title ${specsSection.inView ? "fergie--visible" : ""}`}>
            Built Without<br />Compromise
          </h2>
        </div>
        <div className="fergie-specs__grid">
          {SPECS.map((spec, i) => (
            <div
              key={spec.label}
              className={`fergie-spec-card ${specsSection.inView ? "fergie--visible" : ""}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="fergie-spec-card__accent" />
              <span className="fergie-spec-card__label">{spec.label}</span>
              <span className="fergie-spec-card__value">{spec.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PERFORMANCE ─── */}
      <section id="performance" ref={perfSection.ref} className="fergie-perf">
        <div className="fergie-perf__bg-text">RS3</div>
        <span className="fergie-section-tag">02 / Performance</span>
        <h2 className={`fergie-section-title ${perfSection.inView ? "fergie--visible" : ""}`}>
          Engineered to<br />Dominate
        </h2>
        <div className="fergie-perf__items">
          {PERFORMANCE_HIGHLIGHTS.map((item, i) => (
            <div
              key={item.number}
              className={`fergie-perf__item ${perfSection.inView ? "fergie--visible" : ""}`}
              style={{ transitionDelay: `${i * 150 + 200}ms` }}
            >
              <span className="fergie-perf__number">{item.number}</span>
              <div className="fergie-perf__body">
                <h3 className="fergie-perf__title">{item.title}</h3>
                <p className="fergie-perf__desc">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section id="gallery" ref={gallerySection.ref} className="fergie-gallery">
        <span className="fergie-section-tag">03 / Gallery</span>
        <h2 className={`fergie-section-title ${gallerySection.inView ? "fergie--visible" : ""}`}>
          Every Angle,<br />Engineered
        </h2>
        <div className="fergie-gallery__viewer">
          <div className="fergie-gallery__main">
            {GALLERY_IMAGES.map((img, i) => (
              <div
                key={i}
                className={`fergie-gallery__slide ${i === activeGallery ? "fergie-gallery__slide--active" : ""}`}
              >
                <img src={img.url} alt={img.alt} loading="lazy" />
                <div className="fergie-gallery__caption">{img.caption}</div>
              </div>
            ))}
          </div>
          <div className="fergie-gallery__thumbs">
            {GALLERY_IMAGES.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveGallery(i)}
                className={`fergie-gallery__thumb ${i === activeGallery ? "fergie-gallery__thumb--active" : ""}`}
              >
                <img src={img.url} alt={img.alt} loading="lazy" />
                <div className="fergie-gallery__thumb-bar" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="configure" ref={ctaSection.ref} className="fergie-cta">
        <div className="fergie-cta__noise" />
        <div className={`fergie-cta__content ${ctaSection.inView ? "fergie--visible" : ""}`}>
          <span className="fergie-section-tag fergie-section-tag--light">04 / Your Move</span>
          <h2 className="fergie-cta__title">
            Make It <span className="fergie-cta__title-accent">Yours</span>
          </h2>
          <p className="fergie-cta__subtitle">
            Configure your RS 3 with exclusive Fergie Edition options.<br />
            Limited to 500 units worldwide.
          </p>
          <div className="fergie-cta__actions">
            <button className="fergie-btn fergie-btn--primary fergie-btn--lg">
              Build &amp; Price
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fergie-btn__arrow">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="fergie-btn fergie-btn--outline fergie-btn--lg">
              Book a Test Drive
            </button>
          </div>
          <div className="fergie-cta__trust">
            <span>Starting at $62,500 MSRP</span>
            <span className="fergie-cta__trust-sep">|</span>
            <span>4yr / 50,000mi Warranty</span>
            <span className="fergie-cta__trust-sep">|</span>
            <span>Audi Care Included</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="fergie-footer">
        <div className="fergie-footer__inner">
          <svg viewBox="0 0 100 40" className="fergie-footer__rings">
            <circle cx="18" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="38" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="58" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="78" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p className="fergie-footer__legal">
            The Fergie Edition is a conceptual showcase. Audi, RS, and quattro are registered trademarks of AUDI AG.
          </p>
        </div>
      </footer>
    </div>
  );
}
