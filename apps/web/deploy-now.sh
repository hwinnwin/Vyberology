#!/bin/bash
# Quick deployment script after authentication
# Run this AFTER you've logged into Supabase and unlocked Bitwarden

set -e

PROJECT_REF="qptrlxzyindcohsubidl"

echo "🚀 Deploying Vyberology"
echo "======================="
echo ""

# Get credentials from Bitwarden
echo "📦 Getting credentials from Bitwarden..."
STRIPE_KEY=$(bw list items --search "stripe" 2>/dev/null | jq -r '.[0].login.password // .[0].notes // empty')
OPENAI_KEY=$(bw list items --search "openai" 2>/dev/null | jq -r '.[0].login.password // .[0].notes // empty')

if [ -z "$STRIPE_KEY" ]; then
    echo "❌ Stripe key not found in Bitwarden"
    echo "   Search manually: bw list items --search \"stripe\" | jq"
    exit 1
fi

if [ -z "$OPENAI_KEY" ]; then
    echo "❌ OpenAI key not found in Bitwarden"
    echo "   Search manually: bw list items --search \"openai\" | jq"
    exit 1
fi

echo "✅ Got Stripe key: ${STRIPE_KEY:0:15}..."
echo "✅ Got OpenAI key: ${OPENAI_KEY:0:15}..."
echo ""

# Prompt for webhook secret
echo "⚠️  Need Stripe Webhook Secret"
echo "   1. Go to: https://dashboard.stripe.com/webhooks"
echo "   2. Create endpoint: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
echo "   3. Copy the signing secret (whsec_...)"
echo ""
read -p "Enter STRIPE_WEBHOOK_SECRET: " WEBHOOK_SECRET

if [ -z "$WEBHOOK_SECRET" ]; then
    echo "❌ Webhook secret required"
    exit 1
fi

echo ""
echo "🔐 Setting Supabase secrets..."
supabase secrets set \
  STRIPE_SECRET_KEY="$STRIPE_KEY" \
  OPENAI_API_KEY="$OPENAI_KEY" \
  STRIPE_WEBHOOK_SECRET="$WEBHOOK_SECRET" \
  --project-ref $PROJECT_REF

echo "✅ Secrets set"
echo ""

echo "📊 Deploying database migrations..."
supabase db push --linked --project-ref $PROJECT_REF
echo "✅ Migrations deployed"
echo ""

echo "⚡ Deploying edge functions..."
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

echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Configure Stripe products & prices in dashboard"
echo "2. Update .env.local with VITE_STRIPE_PUBLISHABLE_KEY"
echo "3. Test payment with card 4242 4242 4242 4242"
echo "4. Deploy frontend to your hosting platform"
echo ""
echo "See DEPLOY_QUICKSTART.md for details"
