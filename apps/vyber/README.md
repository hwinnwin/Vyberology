# VybeR PWA

VybeR is an AI-powered browser experience built with React, TypeScript, and Vite, optimized for PWA deployments on Netlify.

## Quick start

```bash
npm install
npm run dev
```

For PWA-specific development:

```bash
npm run dev:pwa
```

## Build and deploy

```bash
npm run build:pwa
npm run preview:pwa
```

Production deploy (Netlify CLI):

```bash
npm run deploy:prod
```

## Environments

- `dev`: local development using `npm run dev` or `npm run dev:pwa`.
- `staging`: duplicate Netlify site with staging environment variables.
- `prod`: https://vyberology.com with production keys and monitoring enabled.

## Rollback strategy

- Use Netlify deploy history to roll back to a previous production deploy.
- Keep the last known-good build artifacts available for quick redeploy.

## Environment variables

Create a `.env.local` for development and configure Netlify environment variables for production.

Client-side (exposed to the browser):

- `VITE_PLAUSIBLE_DOMAIN` - Plausible domain for analytics.
- `VITE_GA_MEASUREMENT_ID` - GA4 measurement ID (uses cookie consent).
- `VITE_ANALYTICS_REQUIRE_CONSENT` - Set to `true` to always require consent.
- `VITE_SENTRY_DSN` - Sentry DSN for error tracking.
- `VITE_SENTRY_TRACES_SAMPLE_RATE` - Decimal between 0 and 1 for tracing.
- `VITE_CLAUDE_MODEL` - Optional override for the AI model.
- `VITE_AI_PROXY_URL` - Optional custom proxy URL for AI requests.
- `VITE_ALLOW_BROWSER_AI_KEY` - Set to `true` to allow direct browser API key use.
- `VITE_CLAUDE_API_KEY` - Dev-only fallback if browser key use is enabled.

Server-side (Netlify Functions only):

- `ANTHROPIC_API_KEY` - Required for `/.netlify/functions/claude-proxy`.
- `ALLOWED_ORIGINS` - Comma-separated CORS allowlist for the proxy.
- `AI_RATE_LIMIT_MAX` - Requests per window (default 10).
- `AI_RATE_LIMIT_WINDOW_MS` - Rate limit window in ms (default 60000).

## Testing

```bash
npm run test
npm run test:e2e
```

## PWA features

- Offline-ready caching with background sync for AI requests.
- Install prompts for desktop and iOS.
- Update notifications when a new service worker is available.

## Security notes

- Secrets should never be stored in `VITE_` variables for production.
- CSP and security headers are configured in `netlify.toml`.
- The AI proxy enforces basic rate limiting and input validation.

## Monitoring and alerts

- Configure Sentry alert rules for error spikes and performance regressions.
- Configure analytics dashboards to monitor activation and retention.

## Documentation

- Help page: `/help.html`
- Privacy policy: `/privacy.html`
- Terms of service: `/terms.html`
- Health check: `/health.json`
- Launch checklist: `docs/launch-checklist.md`
