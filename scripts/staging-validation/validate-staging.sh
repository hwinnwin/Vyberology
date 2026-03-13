#!/bin/bash

# Staging Validation Orchestrator
# Runs all validation tests in sequence

set -e

STAGING_URL="${1}"
FUNCTION_URL="${2}"
STAGING_DB_URL="${3}"

if [ -z "$STAGING_URL" ]; then
  echo "Usage: $0 <staging-web-url> <function-url> [staging-db-url]"
  echo ""
  echo "Example:"
  echo "  $0 https://staging.vyberology.app https://xyz.functions.supabase.co postgresql://..."
  echo ""
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo "Staging Validation Suite"
echo "========================================"
echo "Staging URL: $STAGING_URL"
echo "Function URL: $FUNCTION_URL"
echo ""
echo "This will run:"
echo "  1. Error logging verification"
echo "  2. Integration tests (149 tests)"
echo "  3. E2E tests (18 tests)"
echo ""
read -p "Press Enter to continue..."

# Track results
FAILED_TESTS=()

# Test 1: Error Logging
echo ""
echo "========================================"
echo "Step 1/3: Error Logging Verification"
echo "========================================"
echo ""

if [ -n "$STAGING_DB_URL" ]; then
  if "$SCRIPT_DIR/verify-error-logging.sh" "$STAGING_URL" "$FUNCTION_URL" "$STAGING_DB_URL"; then
    echo "✓ Error logging verification passed"
  else
    echo "✗ Error logging verification failed"
    FAILED_TESTS+=("Error Logging")
  fi
else
  echo "⚠ Skipping error logging verification (no DB URL provided)"
fi

# Test 2: Integration Tests
echo ""
echo "========================================"
echo "Step 2/3: Integration Tests"
echo "========================================"
echo ""

if "$SCRIPT_DIR/run-integration-tests.sh" "$STAGING_URL"; then
  echo "✓ Integration tests passed"
else
  echo "✗ Integration tests failed"
  FAILED_TESTS+=("Integration Tests")
fi

# Test 3: E2E Tests
echo ""
echo "========================================"
echo "Step 3/3: E2E Tests"
echo "========================================"
echo ""

if "$SCRIPT_DIR/run-e2e-tests.sh" "$STAGING_URL"; then
  echo "✓ E2E tests passed"
else
  echo "✗ E2E tests failed"
  FAILED_TESTS+=("E2E Tests")
fi

# Final Summary
echo ""
echo "========================================"
echo "Validation Complete"
echo "========================================"
echo ""

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
  echo "✅ All validation tests passed!"
  echo ""
  echo "Next steps:"
  echo "  1. Collect evidence artifacts"
  echo "  2. Update documentation"
  echo "  3. Mark staging validation complete"
  echo ""
  exit 0
else
  echo "❌ Some validation tests failed:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
  echo ""
  echo "Please review the output above and fix any issues."
  exit 1
fi
