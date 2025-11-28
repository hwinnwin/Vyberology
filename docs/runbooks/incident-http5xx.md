# Runbook — High 5xx Error Rate

1. Check `/supabase/functions/v1/healthz` for readiness and confirm current `version` / `git`.
2. Review logs for the top erroring routes and payloads (sanitize before saving).
3. Identify failing dependency (OpenAI, Supabase) and toggle any circuit breaker or fallback if available.
4. If regression traced to latest deploy: `git revert <backout_hash>` and redeploy the previous artifact.
5. Capture context for post-incident: failing payload exemplar, root cause, and follow-up fix ticket.
