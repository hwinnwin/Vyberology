#!/bin/bash

# Test script to verify Supabase authentication locally
# This will help us diagnose if the token or project-ref is the issue

set -e

echo "🔍 Testing Supabase Authentication..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Prompt for token
echo "📝 Please paste your Supabase Access Token (from dashboard):"
read -s SUPABASE_ACCESS_TOKEN
echo ""

# Prompt for project ref
echo "📝 Please paste your Supabase Project Reference ID:"
read SUPABASE_PROJECT_REF
echo ""

# Test 1: Check token format
echo "🧪 Test 1: Checking token format..."
if [[ $SUPABASE_ACCESS_TOKEN == sbp_* ]]; then
    echo "✅ Token starts with 'sbp_' ✓"
    echo "   Token length: ${#SUPABASE_ACCESS_TOKEN} characters"
else
    echo "❌ Token does NOT start with 'sbp_'!"
    echo "   First 4 chars: ${SUPABASE_ACCESS_TOKEN:0:4}"
    exit 1
fi
echo ""

# Test 2: Check project ref format
echo "🧪 Test 2: Checking project ref format..."
echo "   Project ref: $SUPABASE_PROJECT_REF"
echo "   Length: ${#SUPABASE_PROJECT_REF} characters"
echo ""

# Test 3: Try to list projects with the token
echo "🧪 Test 3: Testing token authentication..."
export SUPABASE_ACCESS_TOKEN
if supabase projects list 2>&1 | grep -q "error\|invalid\|fail"; then
    echo "❌ Token authentication FAILED!"
    supabase projects list
    exit 1
else
    echo "✅ Token authentication SUCCESS!"
    echo ""
    echo "📋 Your Supabase projects:"
    supabase projects list
fi
echo ""

# Test 4: Try to link to the project
echo "🧪 Test 4: Testing project link..."
if supabase link --project-ref "$SUPABASE_PROJECT_REF" 2>&1 | grep -q "error\|invalid\|fail"; then
    echo "❌ Project link FAILED!"
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
    exit 1
else
    echo "✅ Project link SUCCESS!"
fi
echo ""

echo "🎉 ALL TESTS PASSED!"
echo ""
echo "Your credentials are working! The issue must be with how GitHub Actions is handling the secrets."
echo ""
echo "Next steps:"
echo "1. Update GitHub secrets with these EXACT values"
echo "2. Make sure there are no trailing spaces or newlines"
echo "3. Try the deployment again"
