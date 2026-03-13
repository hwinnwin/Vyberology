#!/bin/bash
# Quick fix for Vyberology on Vercel
# Sets environment variables and redeploys

set -e

echo "🚨 Vyberology Vercel Quick Fix"
echo "==============================="
echo ""

# Check if anon key is provided
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ SUPABASE_ANON_KEY not set"
    echo ""
    echo "Get it from: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api"
    echo ""
    echo "Then run:"
    echo "  export SUPABASE_ANON_KEY='eyJhbGc...your_key_here'"
    echo "  ./VERCEL_QUICKFIX.sh"
    exit 1
fi

echo "✅ Supabase anon key found"
echo ""

# Set Vercel environment variables
echo "🔧 Setting Vercel environment variables..."
echo ""

vercel env add VITE_SUPABASE_URL production <<EOF
https://qptrlxzyindcohsubidl.supabase.co
EOF

vercel env add VITE_SUPABASE_ANON_KEY production <<EOF
$SUPABASE_ANON_KEY
EOF

vercel env add VITE_SUPABASE_PROJECT_ID production <<EOF
qptrlxzyindcohsubidl
EOF

vercel env add VITE_STRIPE_PUBLISHABLE_KEY production <<EOF
pk_live_51SGaypKQHOT2DNgNdJJ0nZNP2zL7iK3Gb4D3ai4L6poMV6CD0mRSvNIfDpdbA3nXhgP0avW4jPlOsUXZKkuBy50s00unH0hCzd
EOF

vercel env add VITE_APP_VERSION production <<EOF
1.0.0
EOF

vercel env add VITE_APP_ENV production <<EOF
production
EOF

vercel env add VITE_V4_ENABLED production <<EOF
false
EOF

echo ""
echo "✅ Environment variables set in Vercel"
echo ""

# Trigger deployment
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "Check your site: https://vyberology.com"
echo ""
echo "Site should be working now! 🎉"
