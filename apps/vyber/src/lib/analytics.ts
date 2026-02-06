const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const REQUIRE_CONSENT =
  (import.meta.env.VITE_ANALYTICS_REQUIRE_CONSENT as string | undefined) === "true" ||
  Boolean(GA_MEASUREMENT_ID);

const ANALYTICS_CONSENT_KEY = "vyber_analytics_consent";

let initialized = false;

function loadScript(src: string, attrs: Record<string, string> = {}) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    Object.entries(attrs).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export function isAnalyticsConfigured() {
  return Boolean(PLAUSIBLE_DOMAIN || GA_MEASUREMENT_ID);
}

export function isConsentRequired() {
  return REQUIRE_CONSENT;
}

export function getAnalyticsConsent() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
}

export function hasStoredConsent() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ANALYTICS_CONSENT_KEY) !== null;
}

export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? "granted" : "denied");
}

export async function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  if (!isAnalyticsConfigured()) return;
  if (REQUIRE_CONSENT && !getAnalyticsConsent()) return;

  initialized = true;

  if (PLAUSIBLE_DOMAIN) {
    await loadScript("https://plausible.io/js/script.js", {
      defer: "true",
      "data-domain": PLAUSIBLE_DOMAIN,
    });
  }

  if (GA_MEASUREMENT_ID) {
    await loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      anonymize_ip: true,
    });
  }
}

export function trackEvent(eventName: string, props?: Record<string, string>) {
  if (!initialized) return;
  if (PLAUSIBLE_DOMAIN && window.plausible) {
    window.plausible(eventName, props ? { props } : undefined);
  }
  if (GA_MEASUREMENT_ID && window.gtag) {
    window.gtag("event", eventName, props || {});
  }
}
