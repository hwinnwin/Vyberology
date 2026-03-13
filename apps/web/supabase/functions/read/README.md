# read edge function (DI + typing)

- Handler lives in `handler.ts` (pure, testable).
- `index.ts` wires `withCors` · `requireJwt` · `withTiming` and delegates to the handler.
- Request: see `ReadRequest` in `handler.ts` (mirrors the current payload).
- Response: `Result<ReadOk, ReadErr>`; returns 400 for bad payload, 200 for success.
- Tests: `npx vitest run supabase/functions/read/handler.test.ts`.
