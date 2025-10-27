#!/bin/bash

# Run Integration Tests Against Staging
# Executes all 149 integration tests against staging environment

set -e

STAGING_URL="${1:-https://staging.vyberology.app}"

echo "========================================"
echo "Integration Test Runner"
echo "========================================"
echo "Target: $STAGING_URL"
echo ""

# Navigate to web app directory
cd "$(dirname "$0")/../../apps/web"

# Set environment variable
export E2E_BASE_URL="$STAGING_URL"

echo "Running 149 integration tests against staging..."
echo ""

# Run tests with coverage
pnpm test:run

# Check exit code
TEST_EXIT_CODE=$?

echo ""
echo "========================================"
echo "Test Results"
echo "========================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✓ All integration tests passed!"
  echo ""

  # Display coverage summary if available
  if [ -f "coverage/coverage-summary.json" ]; then
    echo "Coverage Summary:"
    cat coverage/coverage-summary.json | jq '.total | {
      statements: .statements.pct,
      branches: .branches.pct,
      functions: .functions.pct,
      lines: .lines.pct
    }'
  fi

  exit 0
else
  echo "✗ Some tests failed"
  echo ""
  echo "Check the output above for details"
  exit 1
fi
