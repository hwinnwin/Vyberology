/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  // Core
  readonly VITE_APP_ENV?: string;
  readonly VITE_DEBUG?: string;

  // Supabase
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;

  // Stripe
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;

  // Analytics
  readonly VITE_FEATURE_ANALYTICS?: string;
  readonly VITE_POSTHOG_TOKEN?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_GA4_API_SECRET?: string;

  // Error tracking
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;

  // Feature flags
  readonly VITE_FEATURE_PM_SENTRY?: string;
  readonly VITE_FEATURE_DELIVERY?: string;
  readonly VITE_V4_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
