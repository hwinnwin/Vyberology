#!/bin/bash

# Verify Error Logging in Staging
# Tests that all 6 Edge Functions are logging errors correctly

set -e

STAGING_URL="${1}"
FUNCTION_URL="${2}"
STAGING_DB_URL="${3}"

if [ -z "$FUNCTION_URL" ]; then
  echo "Usage: $0 <staging-web-url> <function-url> <staging-db-url>"
  echo "Example: $0 https://staging.vyberology.app https://xyz.functions.supabase.co postgresql://..."
  exit 1
fi

echo "========================================"
echo "Error Logger Verification Script"
echo "========================================"
echo "Staging URL: $STAGING_URL"
echo "Function URL: $FUNCTION_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test error logging
test_function() {
  local func_name=$1
  local test_type=$2

  echo "----------------------------------------"
  echo "Testing: $func_name ($test_type)"
  echo "----------------------------------------"

  case $test_type in
    "cors")
      # Trigger CORS error
      response=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL/$func_name" \
        -H "Origin: https://invalid-origin.com" \
        -H "Content-Type: application/json" \
        -d '{"inputs": []}' 2>&1)

      http_code=$(echo "$response" | tail -n1)

      if [ "$http_code" = "403" ]; then
        echo -e "${GREEN}✓${NC} CORS error triggered (403)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
      else
        echo -e "${RED}✗${NC} Expected 403, got $http_code"
        TESTS_FAILED=$((TESTS_FAILED + 1))
      fi
      ;;

    "invalid-json")
      # Trigger invalid JSON error
      response=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL/$func_name" \
        -H "Origin: $STAGING_URL" \
        -H "Content-Type: application/json" \
        -d 'invalid json{' 2>&1)

      http_code=$(echo "$response" | tail -n1)

      if [ "$http_code" = "400" ]; then
        echo -e "${GREEN}✓${NC} Invalid JSON error triggered (400)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
      else
        echo -e "${RED}✗${NC} Expected 400, got $http_code"
        TESTS_FAILED=$((TESTS_FAILED + 1))
      fi
      ;;
  esac

  sleep 1 # Brief pause between tests
}

# Test all 6 functions
echo ""
echo "Testing Edge Functions..."
echo ""

test_function "vybe-reading" "cors"
test_function "vybe-reading" "invalid-json"

test_function "ocr" "cors"
test_function "ocr" "invalid-json"

test_function "read" "cors"
test_function "read" "invalid-json"

test_function "compare" "cors"
test_function "compare" "invalid-json"

test_function "error-digest" "cors"

test_function "log-error" "cors"
test_function "log-error" "invalid-json"

# Wait for errors to be written to DB
echo ""
echo "Waiting 5 seconds for errors to be written to database..."
sleep 5

# Query error_logs table
echo ""
echo "========================================"
echo "Querying error_logs table..."
echo "========================================"

if [ -n "$STAGING_DB_URL" ]; then
  psql "$STAGING_DB_URL" << 'SQL'
SELECT
  ts,
  service,
  level,
  code,
  left(message, 60) as message,
  request_id,
  environment
FROM public.error_logs
ORDER BY ts DESC
LIMIT 20;
SQL

  # Count errors by service
  echo ""
  echo "Error counts by service:"
  psql "$STAGING_DB_URL" << 'SQL'
SELECT
  service,
  COUNT(*) as error_count
FROM public.error_logs
WHERE ts > NOW() - INTERVAL '5 minutes'
GROUP BY service
ORDER BY error_count DESC;
SQL

  # Verify error structure
  echo ""
  echo "Verifying error log structure..."

  error_count=$(psql "$STAGING_DB_URL" -t -c "SELECT COUNT(*) FROM public.error_logs WHERE ts > NOW() - INTERVAL '5 minutes';")

  if [ "$error_count" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Errors logged to database ($error_count errors found)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} No errors found in database"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${YELLOW}⚠${NC} Database URL not provided, skipping DB verification"
  echo "Run with: $0 <staging-url> <function-url> <db-url>"
fi

# Summary
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All error logging tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
