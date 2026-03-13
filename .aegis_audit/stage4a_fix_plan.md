# Stage 4A v2.2 Fix Plan

## Scope
- Harden numerology edge handlers to consume shared types from `@vybe/reading-engine`.
- Extend handler coverage to assert JSON response headers and optional `Server-Timing`.
- Refresh Stage 4A audit artifacts (diff, checksums, report, allowlist).
- Normalize workspace tooling (pnpm@9, ESLint v9 flat config, shared tsconfig base).

## Tasks
1. Update Supabase Edge handlers (`read`, `reading`, `ocr`, `compare`, `generate-reading-v4`) to import shared boundary types from the reading engine barrel exports.
2. Add header assertions to handler tests to guarantee `Content-Type: application/json` and preserve optional timing visibility.
3. Establish monorepo tooling:
   - Add root `eslint.config.mjs` + targeted package ignores.
   - Create `tsconfig.base.json` and missing package configs.
   - Pin `pnpm@9.15.4` and add workspace scripts for lint/type/test plus audit helpers.
4. Regenerate audit artifacts:
   - `.aegis_audit/diff_files.txt`
   - `.aegis_audit/stage4a_report.json`
   - `.aegis_audit/checksums.json`
5. Capture lint/type/test runs with coverage ≥95% and record Codex checkpoint + signature.
6. Document the single allowed `any` escape in `.aegis_audit/stage4a_allow.txt` and surface the Stage 4A PR block.

## Verification
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `node scripts/hash-artifacts.mjs`
