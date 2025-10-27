#!/bin/bash

# Run E2E Tests Against Staging
# Executes all 18 Playwright E2E tests against staging environment

set -e

STAGING_URL="${1:-https://staging.vyberology.app}"

echo "========================================"
echo "E2E Test Runner (Playwright)"
echo "========================================"
echo "Target: $STAGING_URL"
echo ""

# Navigate to web app directory
cd "$(dirname "$0")/../../apps/web"

# Set environment variable
export E2E_BASE_URL="$STAGING_URL"

echo "Running 18 E2E tests against staging..."
echo ""

# Run Playwright tests
pnpm e2e

# Check exit code
TEST_EXIT_CODE=$?

echo ""
echo "========================================"
echo "Test Results"
echo "========================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✓ All E2E tests passed!"
  echo ""
  echo "Test artifacts saved to:"
  echo "  - Screenshots: test-results/screenshots/"
  echo "  - Videos: test-results/videos/"
  echo "  - Reports: playwright-report/"
  echo ""
  echo "View report with: pnpm e2e:report"
  exit 0
else
  echo "✗ Some E2E tests failed"
  echo ""
  echo "Check test-results/ directory for screenshots and videos"
  echo "View full report with: pnpm e2e:report"
  exit 1
fi
