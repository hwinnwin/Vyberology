# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vyberology is a numerology-based personal reading application that calculates life path numbers, generates AI-powered readings, and provides compatibility analysis. The app combines traditional numerology calculations with modern AI interpretation and can be deployed as both a web app and mobile app (iOS/Android) via Capacitor.

**Tech Stack:**
- React 18 + TypeScript
- Vite (build tool)
- Supabase (backend/database)
- Capacitor 7 (mobile wrapper)
- shadcn/ui + Tailwind CSS (UI components)
- TanStack Query (data fetching)
- OpenAI API (AI-generated readings)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (web)
npm run dev

# Build for production
npm run build

# Build for development (with dev mode enabled)
npm run build:dev

# Lint the codebase
npm run lint

# Preview production build
npm run preview

# Run tests (uses vitest)
npx vitest

# Mobile-specific commands (after initial setup)
npx cap add ios          # Add iOS platform
npx cap add android      # Add Android platform
npm run build && npx cap sync  # Build and sync to native projects
npx cap run ios         # Run on iOS simulator/device
npx cap run android     # Run on Android emulator/device
```

## Architecture

### Core Numerology Engine (`src/lib/numerology/`)

The numerology system is modular and centered around several key calculation modules:

- **`calculators.ts`**: Core computation functions
  - `lifePathFromDOB()`: Calculates life path number from date of birth (ISO format)
  - `expressionFromName()`: Sum of all letters in full name
  - `soulUrgeFromName()`: Sum of vowels only
  - `personalityFromName()`: Sum of consonants only
  - `maturityNumber()`: Derived from expression + life path
  - `computeAll()`: Convenience function that calculates all numbers at once

- **`reduce.ts`**: Number reduction logic that preserves master numbers (11, 22, 33, 44)

- **`letterMap.ts`**: A-Z to 1-9 mapping (Pythagorean system), vowel definitions, name normalization

- **`chakraMap.ts`**: Maps numerology numbers to chakra energy centers

- **`composeReading.ts`**: Generates human-readable interpretations from calculated numbers

- **`compat.ts`** + **`compatLabels.ts`**: Compatibility calculations between two readings

- **`index.ts`**: Main export with `generateReading(fullName, dobISO)` function

**Key principle:** Master numbers (11, 22, 33) are preserved during final reduction steps. Intermediate calculations may reduce them, but the final `NumValue` objects retain `isMaster: true` when applicable.

### AI Reading Generation (`src/services/reading.ts` + `supabase/functions/generate-reading/`)

Readings can be enhanced with AI-generated text via OpenAI. **For security, all OpenAI API calls are made from a Supabase Edge Function**, keeping the API key secure on the backend.

- **`src/services/reading.ts`**: Frontend service that calls the `generate-reading` Edge Function
- **`supabase/functions/generate-reading/`**: Secure backend function that:
  - Receives reading parameters from the frontend
  - Calls OpenAI API with the secret key (stored in Supabase secrets)
  - Returns the generated reading
  - Supports depth modes: "lite" (~200 words), "standard" (~400 words), "deep" (~1000 words)

The AI layer is optional; numerology calculations work independently.

**Security Note:** The OpenAI API key is stored as a Supabase secret (`OPENAI_API_KEY`), not in frontend environment variables. See `SECURITY.md` for deployment instructions.

### Supabase Backend (`supabase/functions/`)

Edge functions written in Deno for serverless operations:

- **`generate-reading/`**: **[Primary AI endpoint]** Securely calls OpenAI API with depth modes and Lumen tone
- **`reading/`**: Numerology number reduction and mapping endpoint
- **`vybe-reading/`**: Alternative reading generation endpoint
- **`compare/`**: Compatibility analysis between two people
- **`ocr/`**: OCR processing for extracting numbers from images
- **`read/`**: Alternative reading endpoint
- **`readings/`**: Batch or historical readings
- **`seed-archetypes/`**: Seeds archetype data into Supabase

All functions use CORS headers to allow cross-origin requests from the frontend.

**Deploying Edge Functions:**
```bash
# Set required secrets first
supabase secrets set OPENAI_API_KEY=your-actual-key

# Deploy all functions
supabase functions deploy

# Or use the deployment script
./deploy-functions.sh
```

See `SECURITY.md` for complete deployment and security guidelines.

### Pages & Routing (`src/pages/`, `src/App.tsx`)

React Router v6 defines these routes:

- `/` → `Index.tsx`: Landing page with footer
- `/brand` → `Brand.tsx`: Branding information
- `/numerology` → `NumerologyReader.tsx`: Main numerology reading form
- `/compatibility` → `Compatibility.tsx`: Two-person compatibility analysis
- `/get-vybe` → `GetVybe.tsx`: Voice assistant / screenshot-based reading capture
- `/privacy` → `Privacy.tsx`: Privacy Policy page
- `/terms` → `Terms.tsx`: Terms of Service page
- `*` → `NotFound.tsx`: 404 handler

**Important:** New routes must be added **above** the catch-all `"*"` route in `App.tsx`.

### Feature Flags (`src/lib/featureFlags.ts`)

Environment-based feature toggles (development/staging/production):

```typescript
isFeatureEnabled("nav.header.v1") // Returns boolean
getFeatureFlags() // Returns all flags for current environment
```

Used to control UI elements like the app header during rollout.

### UI Components (`src/components/`)

Custom application components:

- **`ReadingForm.tsx`**: Input form for name + date of birth
- **`ReadingCard.tsx`**: Display single person's numerology reading
- **`ReadingActions.tsx`**: Reusable copy/share buttons for readings
- **`CompatibilityForm.tsx`**: Input form for two people
- **`PairReadingCard.tsx`**: Display compatibility results
- **`AppHeader.tsx`**: Top navigation (feature-flagged)
- **`Footer.tsx`**: Site footer with legal links and navigation
- **`ErrorBoundary.tsx`**: React error boundary for graceful error handling

All use shadcn/ui base components (`src/components/ui/`) built on Radix UI primitives.

### Data Files (`src/data/`)

Static reference data:

- **`archetypes.ts`**: Detailed descriptions of each numerology number (1-9, 11, 22, 33, 44) including essence, keywords, light/shadow expressions, chakra mappings, daily practices
- **`evolutionPaths.ts`**: Growth trajectories for each number
- **`keystoneActions.ts`**: Action-oriented guidance per number

These files are used by both the client-side reading composer and Supabase seed functions.

### Mobile Integration (Capacitor)

Configuration in `capacitor.config.ts`:

- App ID: `app.lovable.eebd950946e542d89b5f15154caa7b65`
- Web directory: `dist` (Vite output)
- Server URL: Points to Lovable-hosted preview during development

The `/get-vybe` page includes voice assistant functionality ("Hey Lumen") that works better on native mobile with Capacitor plugins like `@capacitor/screen-reader` and screenshot capture APIs.

## Testing

Tests are located in `/tests/` using Vitest:

- **`numerology.spec.ts`**: Validates core calculation accuracy with real-world examples
  - Ensures life path, expression, soul urge calculations are correct
  - Confirms master numbers are preserved

Run tests with: `npx vitest` or `npx vitest run` (single pass)

## Environment Variables

### Frontend Environment Variables (`.env`)

Required for local development:

- `VITE_SUPABASE_PROJECT_ID`: Supabase project ID
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anonymous/public key

These are accessed via `import.meta.env.VITE_*` in the code.

### Backend Secrets (Supabase)

These must be set as Supabase secrets (NOT in `.env`):

- `OPENAI_API_KEY`: OpenAI API key for AI-generated readings

Set via: `supabase secrets set OPENAI_API_KEY=your-key`

**⚠️ IMPORTANT:** Never commit API keys to git. The `.env` file is gitignored. Use `.env.example` as a template.

## Important Notes

- **Master numbers:** Always preserve 11, 22, 33, 44 during final reduction. The `reduce.ts` module handles this logic.
- **DOB format:** Date of birth should be in ISO format (`YYYY-MM-DD`) for consistency across calculators.
- **Name capitalization:** The `capitalizeName()` function in `letterMap.ts` normalizes name input before calculation.
- **Modular calculations:** Each numerology number can be calculated independently; the system doesn't require all inputs at once.
- **AI is optional:** The numerology engine works without any external API calls. AI generation is a layer on top for enhanced UX.
- **Supabase types:** Auto-generated types are in `src/integrations/supabase/types.ts` — regenerate if database schema changes.
- **Route ordering:** In `App.tsx`, custom routes must appear before the `"*"` catch-all route.

## Legal & Compliance

Vyberology includes comprehensive legal documentation for GDPR and CCPA compliance:

### Legal Documents

- **`PRIVACY_POLICY.md`**: Complete privacy policy covering data collection, usage, user rights (GDPR/CCPA)
- **`TERMS_OF_SERVICE.md`**: Terms of service including disclaimers, liability limitations, user responsibilities
- **`GDPR_COMPLIANCE.md`**: Detailed GDPR compliance guide for handling data subject requests

### Legal Pages

- `/privacy` → `Privacy.tsx`: User-facing privacy policy page
- `/terms` → `Terms.tsx`: User-facing terms of service page
- `Footer.tsx`: Includes links to legal pages on all main pages

### Data Collection Summary

**What we collect:**
- Name and date of birth for readings
- Optional account information (email, auth tokens)
- Usage data (via Supabase analytics)
- Screenshots (temporary, for voice assistant feature)

**What we DON'T collect:**
- Tracking cookies
- Third-party advertising data
- Payment information (handled by processors)
- We do NOT sell user data

### Third-Party Services

- **Supabase**: Backend/storage (data processing agreement required)
- **OpenAI**: AI reading generation (data sent: name, DOB, numerology numbers)
- **Lovable.dev**: Hosting platform

### User Rights

- **All users**: Access, correction, deletion, opt-out
- **EU users (GDPR)**: Right to be forgotten, data portability, restriction, objection
- **California users (CCPA)**: Know, delete, opt-out (no selling)

### Compliance Checklist

Before going live:
- [ ] Update contact email in legal documents (currently placeholder)
- [ ] Establish Data Processing Agreements with Supabase and OpenAI
- [ ] Appoint DPO if required (EU, 250+ employees, or systematic monitoring)
- [ ] Set up data subject request handling process
- [ ] Test data deletion workflows
- [ ] Review OpenAI's data retention policy (API requests)
- [ ] Verify Supabase data center locations for transfer compliance
- [ ] Consider cookie consent banner if adding analytics cookies

See `GDPR_COMPLIANCE.md` for detailed handling of user requests.

## Deployment

The app is deployed via Lovable's platform:

1. Push changes to the Lovable project
2. Use Lovable's "Share → Publish" to deploy
3. For custom domains: Project > Settings > Domains

For self-hosting:
1. `npm run build` generates static files in `dist/`
2. Deploy `dist/` to any static host (Vercel, Netlify, etc.)
3. Ensure environment variables are configured in hosting platform
4. Supabase functions must be deployed separately via Supabase CLI

**Before Production Deployment:**
- Update legal document contact information
- Ensure OPENAI_API_KEY is set in Supabase secrets
- Deploy Edge Functions to production
- Test legal page routes (/privacy, /terms)
- Verify footer displays on all pages
