# Staging Validation Scripts

Automated scripts for validating staging deployment before soft launch.

## Scripts

### 1. `validate-staging.sh` (Main Orchestrator)

Runs all validation tests in sequence.

**Usage:**
```bash
./validate-staging.sh <staging-url> <function-url> [db-url]
```

**Example:**
```bash
./validate-staging.sh \
  https://staging.vyberology.app \
  https://xyz.functions.supabase.co \
  postgresql://postgres:password@db.supabase.co:5432/postgres
```

**What it does:**
1. Error logging verification (11 tests)
2. Integration tests (149 tests)
3. E2E tests (18 tests)

---

### 2. `verify-error-logging.sh`

Tests that all 6 Edge Functions are logging errors to the database.

**Usage:**
```bash
./verify-error-logging.sh <staging-url> <function-url> <db-url>
```

**Tests:**
- CORS errors (6 functions)
- Invalid JSON errors (5 functions)
- Database insertion verification
- Error structure validation

**Example:**
```bash
./verify-error-logging.sh \
  https://staging.vyberology.app \
  https://xyz.functions.supabase.co \
  postgresql://...
```

---

### 3. `run-integration-tests.sh`

Runs all 149 integration tests against staging.

**Usage:**
```bash
./run-integration-tests.sh <staging-url>
```

**Example:**
```bash
./run-integration-tests.sh https://staging.vyberology.app
```

**What it tests:**
- Authentication flows (14 tests)
- Reading generation (23 tests)
- All other integration tests (112 tests)

---

### 4. `run-e2e-tests.sh`

Runs all 18 Playwright E2E tests against staging.

**Usage:**
```bash
./run-e2e-tests.sh <staging-url>
```

**Example:**
```bash
./run-e2e-tests.sh https://staging.vyberology.app
```

**What it tests:**
- Auth flow E2E tests (9 tests)
- Reading generation E2E tests (9 tests)

---

## Prerequisites

### Required Tools
- `bash` (4.0+)
- `curl`
- `psql` (PostgreSQL client)
- `pnpm` (for running tests)
- `jq` (for JSON parsing)

### Required Environment
- Staging deployment must be live
- Edge Functions must be deployed
- error_logs table must exist
- Node.js and dependencies installed

---

## Quick Start

1. **Get staging credentials from Codex:**
   ```bash
   STAGING_URL="https://staging.vyberology.app"
   FUNCTION_URL="https://xyz.functions.supabase.co"
   STAGING_DB_URL="postgresql://..."
   ```

2. **Run full validation:**
   ```bash
   ./validate-staging.sh "$STAGING_URL" "$FUNCTION_URL" "$STAGING_DB_URL"
   ```

3. **Review results:**
   - Check console output
   - Review test reports
   - Check artifacts in `test-results/`

---

## Troubleshooting

### "command not found: psql"
Install PostgreSQL client:
```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql-client
```

### "command not found: jq"
Install jq:
```bash
# macOS
brew install jq

# Ubuntu
sudo apt-get install jq
```

### Tests timeout
Increase timeout in test configurations:
- Integration tests: `vitest.config.ts`
- E2E tests: `playwright.config.ts`

### Error logs not appearing in database
1. Verify migration applied:
   ```sql
   \d error_logs
   ```
2. Check Edge Function environment variables
3. Verify service role key is correct

---

## Output Artifacts

### Error Logging Verification
- Console output with pass/fail for each function
- SQL query results showing logged errors

### Integration Tests
- Test results summary
- Coverage report (if enabled)
- `coverage/` directory with detailed coverage

### E2E Tests
- Test results summary
- Screenshots: `test-results/screenshots/`
- Videos: `test-results/videos/`
- HTML report: `playwright-report/`

---

## CI Integration

These scripts can be integrated into CI:

```yaml
# Example GitHub Actions job
staging-validation:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - uses: actions/setup-node@v4

    - name: Install dependencies
      run: pnpm install

    - name: Run staging validation
      env:
        STAGING_URL: ${{ secrets.STAGING_URL }}
        FUNCTION_URL: ${{ secrets.FUNCTION_URL }}
        STAGING_DB_URL: ${{ secrets.STAGING_DB_URL }}
      run: |
        ./scripts/staging-validation/validate-staging.sh \
          "$STAGING_URL" \
          "$FUNCTION_URL" \
          "$STAGING_DB_URL"
```

---

## Exit Codes

All scripts use standard exit codes:
- `0` - All tests passed
- `1` - Some tests failed

This allows easy integration with CI/CD pipelines.

---

## Related Documentation

- [STAGING_VALIDATION_CHECKLIST.md](../../docs/STAGING_VALIDATION_CHECKLIST.md)
- [PHASE2_EXECUTION_SUMMARY.md](../../docs/PHASE2_EXECUTION_SUMMARY.md)
- [CODEX_HANDOFF_PHASE2.md](../../docs/CODEX_HANDOFF_PHASE2.md)

---

**Created:** 2025-10-27
**Owner:** Claude
**Purpose:** Automate staging validation for soft launch readiness
