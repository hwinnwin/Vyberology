
### chore(functions): typed DI handler for read
- Extract pure handler factory with runtime guards.
- Keep CORS/JWT/telemetry unchanged.
- Add unit tests for BAD_REQUEST and success path.

### chore(functions): typed DI handler for compare
- Extract compatibility math into a pure handler with runtime guards.
- Preserve existing CORS + rate limit behaviour.
- Add Vitest coverage for invalid + valid compare payloads.

### chore(functions): typed DI handler for ocr
- Validate OCR payloads and default to accurate mode.
- Route OpenAI calls through a DI handler and return structured readings.
- Add unit coverage for invalid payload, default mode, and success path.
