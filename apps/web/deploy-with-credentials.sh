#!/bin/bash
# Vyberology deployment with credentials from Bitwarden
# Run AFTER: supabase login

set -e

PROJECT_REF="qptrlxzyindcohsubidl"

echo "🚀 Deploying Vyberology with Stripe LIVE keys"
echo "=============================================="
echo ""

# Stripe credentials from Bitwarden
STRIPE_SECRET="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"
STRIPE_WEBHOOK="whsec_YKGMLEMG1bqRzLyJ0H0IZueTypdT8nP"

# Check if OpenAI key provided
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set in environment"
    echo "   To add it: export OPENAI_API_KEY='sk-proj-...'"
    echo "   Or add later in Supabase dashboard"
    echo ""
    read -p "Continue without OpenAI key? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi

    echo "🔐 Setting Stripe secrets..."
    supabase secrets set \
      STRIPE_SECRET_KEY="$STRIPE_SECRET" \
      STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK" \
      --project-ref $PROJECT_REF
else
    echo "🔐 Setting all secrets (Stripe + OpenAI)..."
    supabase secrets set \
      STRIPE_SECRET_KEY="$STRIPE_SECRET" \
      STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK" \
      OPENAI_API_KEY="$OPENAI_API_KEY" \
      --project-ref $PROJECT_REF
fi

echo "✅ Secrets set"
echo ""

echo "📊 Deploying database migrations..."
supabase db push --linked --project-ref $PROJECT_REF
echo "✅ Database deployed"
echo ""

echo "⚡ Deploying Edge Functions..."
supabase functions deploy create-checkout-session --project-ref $PROJECT_REF
echo "✅ create-checkout-session deployed"
echo ""

supabase functions deploy stripe-webhook --project-ref $PROJECT_REF
echo "✅ stripe-webhook deployed"
echo ""

echo "🔍 Verifying deployment..."
supabase functions list --project-ref $PROJECT_REF
echo ""

echo "🏗️  Building frontend..."
npm run build
echo "✅ Frontend built"
echo ""

echo "📝 Creating .env.local..."
cat > .env.local <<'EOF'
VITE_SUPABASE_URL=https://qptrlxzyindcohsubidl.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_from_dashboard
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SGaypKQHOT2DNgNdJJ0nZNP2zL7iK3Gb4D3ai4L6poMV6CD0mRSvNIfDpdbA3nXhgP0avW4jPlOsUXZKkuBy50s00unH0hCzd
EOF
echo "✅ .env.local created (update VITE_SUPABASE_ANON_KEY)"
echo ""

echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase anon key"
echo "2. Configure Stripe products in dashboard"
echo "3. Test payment with: npm run dev"
echo "4. Deploy frontend build to hosting"
echo ""
echo "See CREDENTIALS_READY.md for details"
echo ""
echo "Vyberology is ready to receive payments! 💰"
