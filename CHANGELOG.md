
### chore(functions): typed DI handler for read
- Extract pure handler factory with runtime guards.
- Keep CORS/JWT/telemetry unchanged.
- Add unit tests for BAD_REQUEST and success path.

### chore(functions): typed DI handler for compare
- Extract compatibility math into a pure handler with runtime guards.
- Preserve existing CORS + rate limit behaviour.
- Add Vitest coverage for invalid + valid compare payloads.
