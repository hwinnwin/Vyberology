#!/bin/bash
# Quick fix script for Vyberology.com
# Run this after getting the Supabase anon key from the dashboard

set -e

echo "🚨 Vyberology Quick Fix Script"
echo "================================"
echo ""

# Check if anon key is provided
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ SUPABASE_ANON_KEY not set"
    echo ""
    echo "Get it from: https://supabase.com/dashboard/project/qptrlxzyindcohsubidl/settings/api"
    echo ""
    echo "Then run:"
    echo "  export SUPABASE_ANON_KEY='eyJhbGc...your_key_here'"
    echo "  ./QUICKFIX.sh"
    exit 1
fi

echo "✅ Supabase anon key found"
echo ""

# Update .env.production
echo "📝 Updating .env.production..."
cat > .env.production <<EOF
# Vyberology Production Environment Variables
VITE_SUPABASE_URL=https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_SUPABASE_PROJECT_ID=qptrlxzyindcohsubidl
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SGaypKQHOT2DNgNdJJ0nZNP2zL7iK3Gb4D3ai4L6poMV6CD0mRSvNIfDpdbA3nXhgP0avW4jPlOsUXZKkuBy50s00unH0hCzd
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_V4_ENABLED=false
VITE_SENTRY_DSN=
EOF

echo "✅ .env.production updated"
echo ""

# Build
echo "🏗️  Building production bundle..."
npm run build

echo ""
echo "================================"
echo "✅ Build Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Go to Netlify dashboard: https://app.netlify.com"
echo "2. Find Vyberology site"
echo "3. Drag the 'dist' folder to redeploy"
echo ""
echo "OR configure env vars in Netlify and trigger rebuild"
echo ""
echo "Site will be fixed after deployment! 🎉"
