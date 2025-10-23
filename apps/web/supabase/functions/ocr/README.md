# ocr edge function (DI + typing)

- Core logic lives in `handler.ts` where payloads are validated (`imageUrl`, optional `lang`, `mode`).
- `index.ts` keeps existing CORS + rate-limit flow and delegates to `prepareOcrResult` after parsing JSON.
- OCR execution (`runOcr`) calls OpenAI Vision with the supplied URL; defaults to `mode: "accurate"` when omitted.
- Response shape: `{ text, numbers, readings, meta? }` wrapped behind the standard `Result` envelope.
- Tests: `npx vitest run supabase/functions/ocr/handler.test.ts`.
