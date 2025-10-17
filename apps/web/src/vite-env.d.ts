/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_ANALYTICS?: string;
  readonly VITE_POSTHOG_TOKEN?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_GA4_API_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
