# Staging Validation Checklist

**Date:** 2025-10-27
**Phase:** Soft Launch Preparation
**Goal:** Validate staging deployment before production launch

---

## 🎯 Overview

This checklist tracks the final validation steps before soft launch. All items must be ✅ before proceeding to production.

---

## 📋 Codex Tasks (Infrastructure)

### 1. Pipeline & Build ✅
- [x] Confirm pnpm-only build works (no npm/Rollup conflicts)
- [ ] Verify CI pipeline runs successfully on main
- [ ] Capture staging URL from workflow summary
- [ ] Verify smoke tests pass
- [ ] Check build artifacts are correct

**Commands:**
```bash
# Monitor CI pipeline
gh run list --branch main --limit 1

# View workflow details
gh run view <run-id> --log

# Expected: All jobs green, no Rollup binary errors
```

---

### 2. Database Migration
- [ ] Apply error_logs migration to staging
  ```bash
  psql $STAGING_DB_URL < supabase/migrations/20251027_error_logs.sql
  ```
- [ ] Verify table created
  ```sql
  SELECT COUNT(*) FROM public.error_logs;
  -- Expected: 0 (empty table)
  ```
- [ ] Verify indexes created
  ```sql
  \d error_logs
  -- Should show indexes on: ts, service, level, environment
  ```
- [ ] Verify RLS enabled
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'error_logs';
  -- rowsecurity should be TRUE
  ```

---

### 3. Edge Functions Deployment
- [ ] Deploy vybe-reading function
- [ ] Deploy ocr function
- [ ] Deploy read function
- [ ] Deploy compare function
- [ ] Deploy error-digest function
- [ ] Deploy log-error function

**Commands:**
```bash
export ENV=staging

supabase functions deploy vybe-reading --project-ref <STAGING_REF>
supabase functions deploy ocr --project-ref <STAGING_REF>
supabase functions deploy read --project-ref <STAGING_REF>
supabase functions deploy compare --project-ref <STAGING_REF>
supabase functions deploy error-digest --project-ref <STAGING_REF>
supabase functions deploy log-error --project-ref <STAGING_REF>
```

---

### 4. CORS/JWT Hardening
- [ ] Verify CORS allowed origins (no wildcard *)
  - Expected: `https://staging.vyberology.app`, `https://app.vyberology.app`
  - Screenshot: `/docs/evidence/cors.png`

- [ ] Verify JWT verification enabled on all functions
  - Check: `verify_jwt = true` for all 6 functions
  - Screenshot: `/docs/evidence/jwt-verify.png`

- [ ] Review service role key exposure
  - [ ] Confirm service role key never in client code
  - [ ] Rotate if necessary

**Verification:**
```bash
# Check CORS headers
curl -I "$SUPABASE_FUNCTION_URL/vybe-reading" | grep -i "access-control"
# Should NOT show: Access-Control-Allow-Origin: *
```

---

### 5. Staging URL Documentation
- [ ] Document staging URL in shared location
- [ ] Add to GitHub repository secrets
- [ ] Update READINESS_TRACKER.md with staging links

**Staging URLs:**
```
Web App: https://staging.vyberology.app
Functions: https://<PROJECT_REF>.functions.supabase.co
Dashboard: https://supabase.com/dashboard/project/<PROJECT_REF>/
```

---

## 🔍 Claude Tasks (Validation)

### 6. Error Logger Verification
- [ ] Trigger test error in staging
  ```bash
  # Force CORS error
  curl -X POST "$SUPABASE_FUNCTION_URL/vybe-reading" \
    -H "Origin: https://invalid-origin.com" \
    -H "Content-Type: application/json" \
    -d '{"inputs": []}'
  ```

- [ ] Query error_logs table
  ```sql
  SELECT ts, service, level, code, left(message,80) as msg
  FROM public.error_logs
  ORDER BY ts DESC
  LIMIT 10;
  ```

- [ ] Verify error logged correctly
  - [ ] `service` = 'edge:function:vybe-reading'
  - [ ] `level` = 'warn'
  - [ ] `code` = 'CORS_ORIGIN_NOT_ALLOWED'
  - [ ] `environment` = 'staging'
  - [ ] `request_id` is valid UUID
  - [ ] `ip` and `ua` captured

- [ ] Test all 6 functions
  - [ ] vybe-reading
  - [ ] ocr
  - [ ] read
  - [ ] compare
  - [ ] error-digest
  - [ ] log-error

---

### 7. Integration Tests Against Staging
- [ ] Run integration tests against staging
  ```bash
  E2E_BASE_URL="$STAGING_WEB_URL" pnpm --filter ./apps/web test
  ```

- [ ] Verify all 149 tests pass
- [ ] Check test output for failures
- [ ] Document any staging-specific issues

---

### 8. E2E Tests Against Staging
- [ ] Run E2E tests against staging
  ```bash
  E2E_BASE_URL="$STAGING_WEB_URL" pnpm --filter ./apps/web e2e
  ```

- [ ] Verify 18 E2E tests pass
  - [ ] 9 auth flow tests
  - [ ] 9 reading generation tests

- [ ] Review screenshots
- [ ] Check video recordings for failures

---

### 9. Parity Verification
Run complete parity checklist from [PRODUCTION_READINESS_PROGRESS.md](PRODUCTION_READINESS_PROGRESS.md):

#### Authentication & Authorization
- [ ] Email OTP flow works
- [ ] JWT verification active
- [ ] Session persistence works
- [ ] Screenshot: `/docs/evidence/otp.png`
- [ ] Screenshot: `/docs/evidence/jwt-verify.png`
- [ ] Screenshot: `/docs/evidence/session.png`

#### Edge Functions
- [ ] vybe-reading: Success + error cases
- [ ] ocr: Success + error cases
- [ ] read: Success + error cases
- [ ] compare: Success + error cases
- [ ] error-digest: Slack integration or disabled
- [ ] log-error: RPC write_error_log works

#### Analytics & Observability
- [ ] Sentry events visible
- [ ] PostHog events tracked
- [ ] Web Vitals metrics in Sentry
- [ ] Screenshot: `/docs/evidence/sentry-errors.png`
- [ ] Screenshot: `/docs/evidence/web-vitals.png`

#### Security Configuration
- [ ] CORS origins verified (no wildcard)
- [ ] JWT verification enabled
- [ ] Rate limiting active (test 429 response)
- [ ] Screenshot: `/docs/evidence/cors.png`

#### Performance Verification
- [ ] Run Lighthouse against staging
  ```bash
  export STAGING_URL="https://staging.vyberology.app"
  pnpm dlx @lhci/cli autorun --config=lighthouserc.json
  ```

- [ ] Verify scores:
  - [ ] Performance ≥90
  - [ ] LCP ≤2500ms
  - [ ] CLS ≤0.1
  - [ ] TBT ≤200ms

- [ ] Save report: `/docs/evidence/lighthouse-report.html`

#### Database Parity
- [ ] Schema version matches expected
- [ ] RLS policies identical to spec
- [ ] Indexes created
- [ ] Functions/triggers match
- [ ] Query: `/docs/evidence/error-logs.sql`

---

### 10. Evidence Collection
Capture all 9 required artifacts:

1. **otp.png** - Email OTP flow screenshot
   - [ ] Captured
   - [ ] Location: `/docs/evidence/otp.png`

2. **jwt-verify.png** - JWT configuration
   - [ ] Captured
   - [ ] Location: `/docs/evidence/jwt-verify.png`

3. **session.png** - Session persistence in DevTools
   - [ ] Captured
   - [ ] Location: `/docs/evidence/session.png`

4. **cors.png** - CORS configuration in Supabase dashboard
   - [ ] Captured
   - [ ] Location: `/docs/evidence/cors.png`

5. **sentry-errors.png** - Sentry error tracking dashboard
   - [ ] Captured
   - [ ] Location: `/docs/evidence/sentry-errors.png`

6. **web-vitals.png** - Web Vitals metrics in Sentry
   - [ ] Captured
   - [ ] Location: `/docs/evidence/web-vitals.png`

7. **jwt-config.png** - Edge Function JWT verification setting
   - [ ] Captured
   - [ ] Location: `/docs/evidence/jwt-config.png`

8. **lighthouse-report.html** - Full Lighthouse CI report
   - [ ] Captured
   - [ ] Location: `/docs/evidence/lighthouse-report.html`

9. **error-logs.sql** - Sample query results from error_logs table
   - [ ] Captured
   - [ ] Location: `/docs/evidence/error-logs.sql`

---

## 📈 Coverage & Gates (Both)

### 11. Coverage Baseline Update
After integration tests pass against staging:

```bash
# Extract new coverage (Codex)
cat apps/web/coverage/coverage-summary.json | jq '.total.statements.pct' > ops/coverage-baseline.json

# Commit new baseline
git checkout -b codex/raise-coverage-floor
git add ops/coverage-baseline.json
git commit -m "ops: raise coverage baseline to $(cat ops/coverage-baseline.json)%"
git push -u origin codex/raise-coverage-floor
gh pr create --title "ops: raise coverage baseline"
```

- [ ] Coverage baseline updated
- [ ] PR created
- [ ] CI gates enforcing new baseline

---

### 12. Lighthouse Budget Verification
- [ ] Lighthouse CI runs on PR
- [ ] Budgets pass or are tuned
- [ ] Performance scores documented
- [ ] Any failures addressed

---

## 📝 Documentation Updates

### 13. Update Progress Documents
- [ ] PRODUCTION_READINESS_PROGRESS.md
  - Add staging URLs
  - Add parity verification results
  - Mark evidence artifacts collected

- [ ] READINESS_TRACKER.md
  - Mark Phase 2 complete
  - Document staging validation complete
  - Update production readiness score

- [ ] PHASE2_EXECUTION_SUMMARY.md
  - Add "Staging Validation Complete" section
  - Link to evidence artifacts
  - Document any issues found/resolved

---

### 14. Close Phase 1 Issues
- [ ] Close P0-001: Integration tests ✅
- [ ] Close P0-002: ESLint & types ✅
- [ ] Close P0-004: Error logger rollout ✅
- [ ] Close P0-005: Staging parity ✅

---

## ✅ Soft Launch Readiness Criteria

All items below must be ✅:

### Infrastructure
- [ ] CI pipeline green with pnpm-only build
- [ ] Staging deployed and accessible
- [ ] Error logs migration applied
- [ ] All 6 Edge Functions deployed with error logging
- [ ] CORS/JWT hardened (no wildcards, JWT verification on)
- [ ] Service role key secured

### Testing
- [ ] 149/149 integration tests passing against staging
- [ ] 18/18 E2E tests passing against staging
- [ ] Error logger verified writing to database
- [ ] All critical user journeys tested

### Evidence
- [ ] All 9 evidence artifacts captured
- [ ] Parity checklist 100% complete
- [ ] Lighthouse budgets passing
- [ ] Performance scores documented

### Documentation
- [ ] All progress documents updated
- [ ] Staging URLs documented
- [ ] Phase 1 issues closed
- [ ] Coverage baseline raised

### Metrics
- [ ] Production readiness: **85+/100** ✅
- [ ] Test coverage: **100% critical paths** ✅
- [ ] ESLint errors: **0** ✅
- [ ] Error logging: **6/6 functions** ✅
- [ ] Lighthouse Performance: **≥90** ✅

---

## 🚀 Next Steps After Validation

Once all items are ✅:

1. **Soft Launch Window**
   - Deploy to production
   - Monitor error logs
   - Track Web Vitals
   - Respond to incidents per runbook

2. **Phase 3 Initiation**
   - Begin P0-007: Performance optimization
   - Begin P0-008: Code quality polish
   - Start P0-009: Production deployment pipeline

3. **Monitoring**
   - Daily error log review
   - Weekly Lighthouse checks
   - Monthly restore drills
   - Quarterly security audits

---

## 📞 Communication

**Codex Status Updates:**
- Comment in this document when tasks complete
- Tag @Claude when staging is ready for validation
- Report any blockers immediately

**Claude Status Updates:**
- Report validation results in this document
- Flag any failing tests or issues
- Provide recommendations for fixes

**Escalation:**
- Critical issues: Immediate notification
- Blockers: Same-day resolution
- Non-critical: Track in issues, address in next sprint

---

**Status:** 🟡 In Progress
**Next Milestone:** Staging Validation Complete
**Target:** Soft launch readiness by end of week

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Codex
