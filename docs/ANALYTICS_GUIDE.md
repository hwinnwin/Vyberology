# Analytics Integration Guide

The `@vybe/analytics-adapter` package provides opt-in, feature-flagged analytics across web (Vite) and mobile (Expo) apps. By default the exported `track()` helper is a silent no-op—turn on per platform via environment flags and optional adapter secrets.

## Feature Flags

| Platform | Flag | Location |
|----------|------|----------|
| Web (Vite) | `VITE_FEATURE_ANALYTICS=on` | `.env.local` or deployment config |
| Mobile (Expo) | `EXPO_PUBLIC_FEATURE_ANALYTICS=on` | `apps/mobile/app.json` ➝ `expo.extra` or build env |

Unset or set to anything other than `on` to keep analytics disabled.

## Adapter Options

Create adapters and pass them to `configureAnalytics` in each app:

```ts
import {
  configureAnalytics,
  createPosthogAdapter,
  createGA4Adapter,
} from "@vybe/analytics-adapter";

const analyticsEnabled = process.env.VITE_FEATURE_ANALYTICS === "on";

configureAnalytics({
  enabled: analyticsEnabled,
  adapters: [
    createPosthogAdapter({
      token: process.env.VITE_POSTHOG_TOKEN,
      host: process.env.VITE_POSTHOG_HOST,
    }),
    createGA4Adapter({
      measurementId: process.env.VITE_GA4_MEASUREMENT_ID,
      apiSecret: process.env.VITE_GA4_API_SECRET,
    }),
  ],
  context: { platform: "web" },
});
```

- **PostHog** requires both `POSTHOG_TOKEN` and `POSTHOG_HOST`.
- **GA4 Measurement Protocol** requires `GA4_MEASUREMENT_ID` and an API secret (`GA4_API_SECRET`).
- Missing secrets → adapter resolves to `null` and tracking remains a no-op. No runtime errors are thrown.

## Standard Events

| Event | Trigger |
|-------|---------|
| `app_open` | App/website boot (once per session) |
| `ocr_image_selected` | User picks an image for OCR |
| `ocr_numbers_extracted` | Numeric tokens parsed from OCR result |
| `reading_generated` | Reading successfully rendered |
| `share_clicked` | Share button pressed (native share or copy fallback) |
| `error_occurred` | Recoverable failure (share, OCR save, Supabase write, etc.) |

All events attach contextual props (platform, counts, scope) but never include PII. When analytics is disabled the calls resolve immediately without network requests.

## Testing Locally

1. Enable the flag for the target app.
2. Provide temporary secrets (or leave blank to simulate no-op behaviour).
3. Check console logs / PostHog / GA dashboards for `app_open` and `reading_generated` events.

Remember to remove any local secrets before committing; environment variables live outside the repo.
