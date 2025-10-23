# compare edge function (DI + typing)

- Core logic lives in `handler.ts` (pure helpers + `prepareCompareResult`).
- `index.ts` keeps the existing CORS + rate-limit flow and delegates to the typed handler.
- Request payload: see `CompareRequest` in `handler.ts` (`aName`, `aDob`, `bName`, `bDob`).
- Response envelope: `Result<CompareOk, CompareErr>`; returns 400 for invalid payloads.
- Tests: `npx vitest run supabase/functions/compare/handler.test.ts`.
