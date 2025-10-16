#!/bin/bash
# Deploy Supabase Edge Functions
# Usage: ./deploy-functions.sh

set -e

echo "🚀 Deploying Vyberology Edge Functions to Supabase..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase."
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if secrets are set
echo "⚠️  Make sure you've set the required secrets:"
echo "   supabase secrets set OPENAI_API_KEY=your-key"
echo ""
read -p "Have you set the OPENAI_API_KEY secret? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please set the secrets first, then run this script again."
    exit 1
fi

# Deploy all functions
echo "📦 Deploying all Edge Functions..."
supabase functions deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test your function:"
echo "curl -X POST https://qptrlxzyindcohsubidl.supabase.co/functions/v1/generate-reading \\"
echo "  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"fullName\": \"Test User\", \"inputs\": []}'"
