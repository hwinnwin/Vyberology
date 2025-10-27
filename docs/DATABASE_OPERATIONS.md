# Database Operations (Supabase)

## Backups
- Nightly logical backups via `pg_dump` (UTC 14:00 / 01:00 AEDT)
- Retention: 30 days rolling, weekly keep for 12 weeks
- Storage: Supabase object store + encrypted offsite (KMS)

## Restore Test (Monthly)
- Schedule: 15th of each month (next drill due **2025-11-15 AEDT**)
- Spin up temp db, restore latest dump, run migrations, verify checksum
- Execute regression smoke tests against restored staging
- Record findings + timestamp in this document under "Restore Verification Log"

## Runbook
1. Trigger on-demand backup
2. Verify manifest + SHA256
3. Document in this file under "Restore Tests"

## Error Logs Retention
- `public.error_logs` retained for 90 days
- `pg_cron` job (`purge_old_error_logs_daily`) deletes rows older than 90 days; verify monthly before restore drill

## Restore Verification Log
- _2025-10-27_: Drill scheduled; awaiting first execution on 2025-11-15 AEDT.
