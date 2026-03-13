# Generate Reading V4 - Edge Function

**Stage B: IP Protection** - Server-side reading generation to protect phrasebook and deterministic logic.

## Architecture

```
Client (React)
    ↓ HTTPS POST
Edge Function (Deno)
    ↓ Import (bundled)
@vybe/reading-core-private
    ↓ Return JSON
Client receives reading
```

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy generate-reading-v4

# Test locally
supabase functions serve generate-reading-v4
```

## API

### Endpoint
```
POST https://[project-ref].supabase.co/functions/v1/generate-reading-v4
Authorization: Bearer [anon-key]
```

### Request
```json
{
  "input": {
    "raw": "15:51 74%",
    "context": "arriving home",
    "entryNo": 60
  },
  "explain": false,
  "userId": "user-uuid"
}
```

### Response
```json
{
  "reading": {
    "header": { "title": "...", "theme": ["..."] },
    "numerology": { "coreFrequency": 5, ... },
    "layeredMeaning": [...],
    "energyMessage": "...",
    "alignmentSummary": [...],
    "resonance": {...},
    "guidanceAspect": {...},
    "essenceSentence": "..."
  },
  "explain": { ... }
}
```

## Security

- ✅ Phrasebook never sent to client
- ✅ Deterministic logic server-side only
- ✅ RLS policies enforce user isolation
- ✅ Rate limiting via Supabase quotas

## TODO (Full Implementation)

1. Bundle @vybe/reading-core-private into Edge Function
2. Configure import map for private package
3. Add RLS policies to `readings` table
4. Update client SDK to call Edge Function
5. Add error handling + retry logic
6. Implement usage tracking/quotas
