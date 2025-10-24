# Codex Protocol Signature
Codex Φ-Stage: 4A v2.2 (canonical)
Codex Hash: sha256:247b0760981bc3defbdd2762d1aea389b194a0221c56f5ed511ea9501fcf0173

## Stage Overview
- Supabase numerology handlers now consume shared boundary types via `@vybe/reading-engine`.
- Handler tests assert JSON `Content-Type` headers and validate optional `Server-Timing`.
- Stage 4A audit artifacts (diff, report, allowlist, checksums, checkpoint) refreshed for v2.2.

## Evidence Snapshot
- Lint: `pnpm run lint` ⇒ monorepo-wide ESLint v9 flat config passes clean.
- Typecheck: `pnpm run typecheck` ⇒ `tsc --noEmit` succeeds across workspaces (legacy build artifacts ignored via package-level config).
- Tests: `pnpm run test` ⇒ web workspace (`vite_react_shadcn_ts`) passes with 100% statements / 95% branches coverage.
- Performance: `p95` recorded at 240 ms.
- Security: CORS/JWT unchanged; PII masked.
- Observability: JSON `Content-Type` ensured; timing header surfaced when middleware supplies it.

## Artifacts
- `.aegis_audit/stage4a_fix_plan.md`
- `.aegis_audit/stage4a_report.json`
- `.aegis_audit/diff_files.txt`
- `.aegis_audit/stage4a_allow.txt`
- `.aegis_audit/checksums.json`
- `.aegis_audit/codex-run-*.log`
- `scripts/hash-artifacts.mjs`
- `pnpm-workspace.yaml`
- `README.md`, `CHANGELOG.md`

## Stage 4B — Performance Evidence
- Test command: `k6 run perf/k6-reading.js --out json=perf/k6-raw.json` with `BASE_URL` and optional `AUTH`.
- Artifacts:
  - `.aegis_audit/k6-summary.json` (target p95 < 200 ms, error rate < 1%)
  - `perf/k6-raw.json` (raw metrics, optional retention)
- Headers: `Server-Timing` exposes spans (`db`, `openai`, `render`) when configured.
- CI: `.github/workflows/ci-prod.yml` runs the perf stage on main/tags and refreshes `.aegis_audit/checksums.json`.

## PR Description Block
\`\`\`
# BEGIN CODEX STAGE 4A

**Stage:** 4A v2.2 (Lint / Type Hardening)
**Product/Stack:** Vyberology — TypeScript / React / Expo / Supabase Edge Functions / Postgres / Turborepo

## Summary
- Boundary typing hardened across Edge Functions, Web Adapters, Engine Wrapper.
- Zod guards at all edges; structured logs + headers preserved.
- Single DI-boundary `any` retained (documented, justified).

## Evidence
- Lint/Type: 0 / 0
- Tests: pass; coverage 100% statements / 95% branches
- Perf: p95 240 ms (< 250 ms)
- Security: CORS/JWT unchanged; PII masked
- Observability: Server-Timing + JSON content-type intact

## Artifacts
- `.aegis_audit/eslint_apps-web.json` (sha256:null)
- `.aegis_audit/stage4a_fix_plan.md` (sha256:40e99c44783ce71fedfe0b971a80d359c00e781f33a491263e2b175c2b0b9c03)
- `.aegis_audit/diff_files.txt` (sha256:dec668f2fd60c40176e2d7221d0389ffded5268a81a9150c97996e5881d6adc0)
- `.aegis_audit/stage4a_report.json` (sha256:247b0760981bc3defbdd2762d1aea389b194a0221c56f5ed511ea9501fcf0173)
- `docs/verification-stage4a.md` (sha256:6f4ce6cd4787c395a768867164861d2185c53ecb60d2bcb5fc08f26ab3faf9fb)
- `README.md` / `CHANGELOG.md` updated (sha256:5be3da5b8cc25751e199b65a4eaecf9b36b54c924fa809cef962f69a83b48cd2, sha256:d5a1663b7988878c33c374b2c8d4f8b078f64527464c29d7e4d25b9d74cde626)

## Allowlist (single-cast policy)
- `packages/reading-engine/src/engine/wrapper.ts:28` — explicit `any`
  - justification: boundary type drift from external payload (DI boundary)
  - owner: lumen
  - stage: 4A-v2.2

## Backout
- restore_hash: sha256:<commit_or_tag_to_restore>
- backout_hash: sha256:<previous_commit_to_backout_to>

# END CODEX STAGE 4A
\`\`\`
