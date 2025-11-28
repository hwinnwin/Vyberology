# Incident Response Playbook

**Part of:** Production Readiness Phase 2
**Owner:** Codex (IC), Claude (Deputy)
**Last Updated:** 2025-10-27

---

## Overview

This playbook defines procedures for responding to production incidents in Vyberology, ensuring quick resolution and minimizing impact to users.

---

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **SEV1** | Critical | < 15 min | Data loss/breach, complete outage >30min, security incident |
| **SEV2** | Major | < 1 hour | Major feature outage, significant performance degradation |
| **SEV3** | Minor | < 4 hours | Partial feature degradation, non-critical bugs |
| **SEV4** | Low | Next business day | Cosmetic issues, minor inconveniences |

---

## Roles & Responsibilities

### Incident Commander (IC)
- **Primary:** Codex
- **Backup:** Claude
- **Responsibilities:**
  - Declare incident and severity
  - Coordinate response efforts
  - Make decisions on mitigation strategies
  - Communicate with stakeholders
  - Drive postmortem

### Deputy
- **Primary:** Claude
- **Backup:** TBD
- **Responsibilities:**
  - Support IC with technical execution
  - Gather logs and diagnostic data
  - Implement fixes and workarounds
  - Monitor system health

### Scribe
- **Assignment:** Rotating
- **Responsibilities:**
  - Document timeline in real-time
  - Record decisions and actions
  - Collect evidence (logs, screenshots)
  - Draft incident report

### Communications Lead
- **Default:** IC
- **Responsibilities:**
  - Update status page
  - Post Slack/email updates
  - Coordinate with users if needed

---

## Incident Lifecycle

### 1. Detection
**Sources:**
- Monitoring alerts (Sentry, Supabase)
- User reports
- Team observations

**Initial Actions:**
```markdown
1. Acknowledge alert/report
2. Assess severity (is this an incident?)
3. If yes → proceed to Declaration
4. If no → create bug ticket and monitor
```

### 2. Declaration
**IC Actions:**
```bash
# 1. Create incident ticket
gh issue create \
  --title "SEV-X: [Brief description]" \
  --label "incident,sev-X" \
  --body "$(cat << 'INCIDENT'
**Start Time:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Severity:** X
**Impact:** [user-facing impact]
**IC:** Codex
**Deputy:** Claude
**Status:** Investigating

## Timeline
- [timestamp] Incident detected
INCIDENT
)"

# 2. Open bridge
# Post in #incidents Slack: "@here SEV-X incident declared. Join bridge: <zoom-link>"

# 3. Start scribe doc
# Create real-time timeline in incident ticket
```

### 3. Investigation
**Deputy Actions:**
```bash
# Gather diagnostics
# 1. Check error logs
psql $DB_URL -c "SELECT * FROM error_logs WHERE ts > now() - interval '1 hour' ORDER BY ts DESC LIMIT 100;"

# 2. Check Sentry
# Visit Sentry dashboard, filter by last 1 hour

# 3. Check Supabase health
# Dashboard → Database → Performance
# Dashboard → Edge Functions → Logs

# 4. Check recent deployments
gh api repos/{owner}/{repo}/deployments \
  --jq '.[] | select(.created_at > "2025-10-27T00:00:00Z") | {env: .environment, created: .created_at, sha: .sha}'

# 5. Share findings in bridge
```

### 4. Mitigation
**Priority:** Stop the bleeding

**Options (in order of preference):**

#### A. Rollback (if caused by deployment)
```bash
# 1. Identify last good deployment
git log --oneline -10

# 2. Revert to last good commit
git revert <bad-commit-sha> --no-edit
git push origin main

# 3. Monitor for recovery
```

#### B. Feature Flag Disable (if specific feature)
```typescript
// Update feature flags
// apps/web/src/lib/featureFlags.ts
export const FEATURES = {
  'problematic.feature': false, // Disable immediately
};

// Deploy
pnpm --filter ./apps/web build && # deploy
```

#### C. Database Fix (if data corruption)
```sql
-- Emergency data fix (document ALL changes)
UPDATE readings
SET ...
WHERE ...;

-- Log action
INSERT INTO error_logs (environment, service, level, code, message, details)
VALUES ('production', 'manual-intervention', 'warn', 'EMERGENCY_FIX', 'Applied manual data fix', '{"query": "...", "rows_affected": X}');
```

#### D. Scale Up (if resource exhaustion)
```bash
# Supabase: Upgrade plan temporarily
# Dashboard → Settings → Billing → Upgrade

# Or: Optimize query
# Identify and kill long-running queries
```

### 5. Communication

**30-Minute Cadence Updates:**
```markdown
## Update [timestamp]
**Status:** Investigating / Mitigating / Monitoring / Resolved
**Impact:** [current user impact]
**Actions:** [what we're doing]
**ETA:** [estimated resolution time]
**Next update:** [timestamp + 30min]
```

**Channels:**
- Post in #incidents Slack
- Update GitHub issue
- Status page (if SEV1/SEV2)

### 6. Resolution
**IC Declares Resolution When:**
- Root cause identified and fixed
- System metrics returned to normal
- No user impact for 30+ minutes
- Monitoring confirms stability

**Actions:**
```markdown
1. Announce resolution in bridge
2. Update incident ticket: add "Resolved" label
3. Thank team
4. Schedule postmortem (within 48h)
```

### 7. Postmortem
**Timeline:** Within 48 hours of resolution

**Template:**
```markdown
# Incident Postmortem: SEV-X [Brief Title]

## Metadata
- **Date:** YYYY-MM-DD
- **Duration:** X hours Y minutes
- **Severity:** X
- **IC:** Codex
- **Scribe:** [name]

## Summary
[2-3 sentence executive summary]

## Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | Incident detected |
| HH:MM | IC declared SEV-X |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Incident resolved |

## Impact
- **Users affected:** X users / Y% of user base
- **Duration:** X minutes
- **Revenue impact:** $X estimated
- **Data loss:** None / [description]

## Root Cause
[Detailed technical explanation]

## Detection
- **How detected:** [alert / user report / team]
- **Time to detect:** X minutes
- **Could we detect faster?** [analysis]

## Response
- **Time to mitigate:** X minutes
- **What went well:** [list]
- **What went poorly:** [list]

## Resolution
[What fixed it]

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| [Prevent recurrence] | Codex | YYYY-MM-DD | P0 |
| [Improve detection] | Claude | YYYY-MM-DD | P1 |
| [Update runbook] | Scribe | YYYY-MM-DD | P2 |

## Lessons Learned
- [Lesson 1]
- [Lesson 2]
- [Lesson 3]

## Follow-up
- [ ] Action items tracked in GitHub
- [ ] Postmortem shared with team
- [ ] Runbooks updated
- [ ] Monitoring improved
```

---

## Incident Scenarios & Playbooks

### Scenario 1: Edge Function Outage

**Symptoms:**
- Sentry: High error rate for Edge Function invocations
- Users: Unable to generate readings

**Investigation:**
```bash
# 1. Check Edge Function logs
supabase functions logs <function-name> --project-ref $PROD_REF

# 2. Check error_logs table
psql $DB_URL -c "SELECT * FROM error_logs WHERE service LIKE 'edge:%' AND ts > now() - interval '1 hour';"

# 3. Test function manually
curl -X POST https://<project-ref>.supabase.co/functions/v1/<function-name> \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Common Causes:**
- API key exhausted (OpenAI)
- Deployment error
- Database connection limit hit

**Mitigation:**
```bash
# If API key issue:
# Add more quota or switch to backup key

# If deployment error:
# Rollback to previous version
supabase functions deploy <function-name> --project-ref $PROD_REF

# If database issue:
# Check connection pool, scale if needed
```

---

### Scenario 2: Database Performance Degradation

**Symptoms:**
- Slow page loads
- High database CPU in Supabase dashboard
- Timeouts in logs

**Investigation:**
```sql
-- Find slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND (now() - pg_stat_activity.query_start) > interval '5 seconds'
ORDER BY duration DESC;

-- Check locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

**Mitigation:**
```sql
-- Kill long-running queries (if safe)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = <problem-pid>;

-- Or optimize query
CREATE INDEX CONCURRENTLY idx_... ON table(column);
```

---

### Scenario 3: Data Loss / Corruption

**Severity:** SEV1 (always)

**Immediate Actions:**
```bash
# 1. STOP writes immediately
# Disable Edge Functions or feature flag the feature

# 2. Take emergency backup
supabase db dump --db-url $PROD_DB_URL > emergency-backup-$(date +%Y%m%d-%H%M%S).sql

# 3. Assess extent
psql $DB_URL -c "SELECT count(*) FROM readings WHERE <corruption-condition>;"

# 4. Restore from backup (see DATABASE_OPERATIONS.md)
```

**DO NOT:**
- Make ad-hoc schema changes under pressure
- Delete data without IC approval
- Modify production database without logging

---

### Scenario 4: Security Incident

**Severity:** SEV1 (always)

**Immediate Actions:**
```bash
# 1. Contain: Revoke compromised credentials
supabase secrets unset COMPROMISED_KEY --project-ref $PROD_REF

# 2. Assess: Check access logs
psql $DB_URL -c "SELECT * FROM auth.audit_log_entries WHERE created_at > now() - interval '24 hours';"

# 3. Notify: Alert team and stakeholders
# Post in #security-incidents immediately

# 4. Document: Preserve all evidence
```

**DO NOT:**
- Delete logs or evidence
- Communicate publicly before consulting legal/security
- Make changes without documenting

---

## Communication Templates

### Initial Announcement (SEV1/SEV2)
```
🚨 INCIDENT DECLARED: SEV-X

Impact: [brief user-facing impact]
Start: [timestamp]
Status: Investigating
IC: Codex
Bridge: [link]

Updates every 30min in this thread.
```

### Update Template
```
📊 UPDATE [HH:MM UTC]

Status: [Investigating/Mitigating/Monitoring]
Progress: [what we've done]
Next steps: [what's happening now]
ETA: [if known]

Next update: [HH:MM UTC]
```

### Resolution Announcement
```
✅ RESOLVED [HH:MM UTC]

Impact: [summary]
Duration: [X hours/minutes]
Root cause: [brief explanation]
Resolution: [what fixed it]

Postmortem: [within 48h]
Thanks to: [team members]
```

---

## Contacts & Escalation

**On-Call Rotation:** TBD
**Pager:** TBD
**Slack:** #incidents

**Escalation Path:**
1. IC (Codex)
2. Deputy (Claude)
3. Engineering Lead
4. CTO

**External Contacts:**
- Supabase Support: support@supabase.com
- Sentry Support: support@sentry.io

---

## Incident History

| Date | Severity | Duration | Summary | Postmortem |
|------|----------|----------|---------|------------|
| TBD | - | - | No incidents yet | - |

---

**Last Updated:** 2025-10-27
**Last Incident:** None
**Next Drill:** 2025-11-15 (Tabletop exercise)
