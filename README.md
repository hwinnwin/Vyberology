# Vyberology Monorepo

This repository contains the unified Vyberology codebase spanning the web client, Expo mobile app, and shared numerology delivery engine. The workspace is powered by the npm workspaces + Turborepo toolchain to make shared development fast, deterministic, and easy to extend.

## Project Structure

```
apps/
  web/        # Vite + React web client (Capacitor ready)
  mobile/     # Expo Router mobile application
packages/
  reading-engine/   # Shared deterministic numerology engine
 docs/       # Reference documentation (e.g., numerology logic)
turbo.json   # Turborepo pipeline configuration
```

## Prerequisites

- Node.js 18.x or 20.x (project engines specify >=18 <21)
- npm 9+ (ships with Node 18+) – yarn/pnpm also work if you prefer
- For mobile builds: Expo CLI, Android Studio (SDK + emulator), Xcode for iOS

## Install & Bootstrap

```bash
npm install
```

This installs all workspace dependencies (web, mobile, shared packages).

## Common Scripts

Run from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev --workspace apps/web` | Start the Vite web dev server |
| `npm run android --workspace mobile` | Build & run Expo app on Android (physical device or emulator) |
| `npm run ios --workspace mobile` | Build & run Expo app on iOS |
| `npm run test --workspace @vybe/reading-engine` | Run shared engine unit tests |
| `npm run test:cov --workspace @vybe/reading-engine` | Run engine tests with coverage (≈98% statements) |

## Feature Flags

Several behaviours are guarded by environment flags so production builds stay safe:

- **Web** (`apps/web/.env.local`)
  - `VITE_FEATURE_OCR=on` – enables OCR debug route
  - `VITE_FEATURE_PM_SENTRY=on` – lightweight error reporting
  - `VITE_FEATURE_DELIVERY=on` – new deterministic reading delivery blocks
- **Mobile** (`app.config` / Expo env)
  - `EXPO_PUBLIC_FEATURE_DELIVERY=on`

## Shared Delivery Engine

The shared package `@vybe/reading-engine` exposes deterministic numerology rendering with tone presets (`calm`, `direct`, `encouraging`) and structured `ReadingBlocks` output. See `docs/NUMEROLOGY_LOGIC.md` for details.

## Contributing Workflow

1. Create a feature branch from `main`.
2. `npm install` (after each pull) to stay in sync.
3. Run targeted scripts (web, mobile, engine) depending on the area you’re touching.
4. Ensure tests pass (`npm run test --workspace @vybe/reading-engine`).
5. Commit + push; use `npm run test:cov --workspace @vybe/reading-engine` when modifying the engine to keep coverage high.

## Legacy Snapshot

The pre-monorepo codebase is preserved on the `legacy/2025-pre-monorepo` branch should you need to reference historical structure.

## License

Internal project – consult project maintainers for usage guidelines.
