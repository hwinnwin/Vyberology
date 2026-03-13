# Mobile & Web Dev Setup

Fast reference for onboarding to the Vybe monorepo.

## Prerequisites

- **Node 20.x** (CI runs on Node 20; use `nvm install 20 && nvm use 20` locally).
- **npm 10+** (bundled with Node 20) for workspace-aware installs.
- Expo CLI (`npx expo`) and Android/iOS tooling if you plan to build native clients.

## Install & Bootstrap

```bash
npm install        # installs all workspace packages
npm run build --workspaces
```

## Metro in the Monorepo

`apps/mobile/metro.config.js` watches the workspace root and resolves modules from the top-level `node_modules` first. When running Expo:

```bash
npx expo start --port 8084 -c
```

If port 8081 is already in use (e.g. Vite dev server), Expo will prompt to use an alternate port—accept the prompt or pass `--port` explicitly.

## Expo Native Prebuild

Prebuild generates native Android/iOS projects and ensures Gradle settings stay in sync:

```bash
cd apps/mobile
npx expo prebuild -p android
```

Clean builds: `rm -rf android/.gradle android/app/build` before re-running prebuild when dependencies change.

## Common Issues

| Issue | Fix |
|-------|-----|
| `Invalid hook call` / duplicate React | Ensure root `npm install` hoists React 19; Metro config prevents duplicate bundles. |
| Gradle cannot find `cordova.variables.gradle` | Run `npx cap sync android` (for apps/web Capacitor project) or remove stale native folders. |
| `Port 8081 is busy` when starting Expo | Run `npx expo start --port 8084 -c` or stop the existing Vite server. |
| Missing Android SDK | Create `apps/mobile/android/local.properties` with `sdk.dir=$HOME/Library/Android/sdk` (macOS) or your platform-specific path. |

## Useful Scripts

- `npm run dev` – turbo dev pipeline.
- `npm run test:cov --workspace @vybe/reading-engine` – numerology engine coverage.
- `npx expo run:android` – build + install the dev client on an emulator/device.

Keep machine-specific files (`android/local.properties`, `.env*`, `.expo/*`) out of commits.
