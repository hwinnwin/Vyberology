# Runbook — High p95 Latency

1. Inspect recent requests and `Server-Timing` spans (`db`, `openai`, `render`) to locate the bottleneck.
2. If OpenAI latency dominates, enable request queueing or cached responses where business rules allow.
3. Review Supabase slow query logs; add indexes or memoize hot paths as needed.
4. Re-run `k6 run perf/k6-reading.js` with the same RPS profile and attach `perf/k6-summary.json` (plus notes) to the incident ticket.
