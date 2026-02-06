# Launch Checklist

## Core functionality
- [ ] Verify new tab, navigation, and tab lifecycle flows
- [ ] Validate AI command palette and settings storage

## PWA readiness
- [ ] Install prompt appears (desktop + iOS)
- [ ] Service worker caches assets and supports offline reload
- [ ] Update flow shows and refreshes

## Performance
- [ ] Lighthouse 90+ across performance, accessibility, best practices, SEO
- [ ] Bundle size reviewed after code splitting
- [ ] Images and icons compressed

## Monitoring
- [ ] Analytics configured (Plausible or GA)
- [ ] Sentry DSN configured
- [ ] Web vitals reporting enabled

## Security
- [ ] CSP headers verified
- [ ] AI proxy configured with server API key
- [ ] Rate limits validated

## Deployment
- [ ] Netlify environment variables configured
- [ ] Health endpoint reachable at /health.json
- [ ] Rollback plan documented
