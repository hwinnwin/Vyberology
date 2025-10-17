# @vybe/analytics-adapter

Lightweight, feature-flagged analytics helpers for the Vybe monorepo. By default all tracking calls are safe no-ops; individual apps opt-in by enabling the feature flag and wiring one or more adapters.

## Usage

```ts
import {
  configureAnalytics,
  track,
  createPosthogAdapter,
  createGA4Adapter,
} from "@vybe/analytics-adapter";

const analyticsEnabled = process.env.FEATURE_ANALYTICS === "on";

configureAnalytics({
  enabled: analyticsEnabled,
  adapters: [
    createPosthogAdapter({
      token: process.env.POSTHOG_TOKEN,
      host: process.env.POSTHOG_HOST,
    }),
    createGA4Adapter({
      measurementId: process.env.GA4_MEASUREMENT_ID,
      apiSecret: process.env.GA4_API_SECRET,
    }),
  ],
  context: { platform: "web" },
});

await track("app_open", { build: process.env.APP_VERSION });
```

### Feature Flags

- Web (Vite): `VITE_FEATURE_ANALYTICS=on`
- Mobile (Expo): `EXPO_PUBLIC_FEATURE_ANALYTICS=on`

Skip adapters or leave secrets unset to keep behaviour as a silent no-op.

## Tests

```bash
npm run test --workspace @vybe/analytics-adapter
```
