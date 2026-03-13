#!/bin/bash
set -e

echo "🚀 Vyberology Deployment Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_REF="qptrlxzyindcohsubidl"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Login to Supabase
echo "${BLUE}Step 1: Login to Supabase${NC}"
echo "Running: supabase login"
supabase login || {
    echo "⚠️  If you've already logged in, that's fine. Continuing..."
}
echo ""

# Step 2: Link to project
echo "${BLUE}Step 2: Link to Supabase project${NC}"
echo "Project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF || {
    echo "⚠️  Already linked or connection issue. Continuing..."
}
echo ""

# Step 3: Check current secrets
echo "${BLUE}Step 3: Check Supabase secrets${NC}"
echo "Current secrets:"
supabase secrets list || echo "⚠️  Couldn't list secrets, but continuing..."
echo ""

# Step 4: Set required secrets (if not already set)
echo "${BLUE}Step 4: Set Stripe secrets${NC}"
echo "⚠️  You need to set these manually if not already done:"
echo ""
echo "  supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key"
echo "  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret"
echo "  supabase secrets set OPENAI_API_KEY=sk-proj-your_key"
echo ""
read -p "Have you set these secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please set the secrets first, then run this script again."
    exit 1
fi
echo ""

# Step 5: Deploy database migrations
echo "${BLUE}Step 5: Deploy database migrations${NC}"
echo "Deploying payment and feedback schemas..."
supabase db push --linked
echo "${GREEN}✅ Database migrations deployed${NC}"
echo ""

# Step 6: Deploy Edge Functions
echo "${BLUE}Step 6: Deploy Edge Functions${NC}"

echo "Deploying create-checkout-session..."
supabase functions deploy create-checkout-session
echo "${GREEN}✅ create-checkout-session deployed${NC}"
echo ""

echo "Deploying stripe-webhook..."
supabase functions deploy stripe-webhook
echo "${GREEN}✅ stripe-webhook deployed${NC}"
echo ""

# Step 7: Verify deployments
echo "${BLUE}Step 7: Verify deployments${NC}"
echo "Listing deployed functions..."
supabase functions list
echo ""

# Step 8: Build frontend
echo "${BLUE}Step 8: Build frontend${NC}"
echo "Building production bundle..."
npm run build
echo "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Final summary
echo "${GREEN}========================================${NC}"
echo "${GREEN}🎉 Deployment Complete!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "✅ Database migrations deployed"
echo "✅ Edge functions deployed"
echo "✅ Frontend built"
echo ""
echo "${YELLOW}Next steps:${NC}"
echo "1. Deploy frontend to your hosting platform (Vercel, Netlify, etc.)"
echo "2. Update .env with production credentials"
echo "3. Configure Stripe products in dashboard"
echo "4. Test payment flow with test cards"
echo ""
echo "📚 Documentation:"
echo "  - PAYMENT_SETUP.md - Stripe configuration guide"
echo "  - PAYMENT_INTEGRATION_COMPLETE.md - Implementation details"
echo "  - FEEDBACK_SYSTEM.md - Feedback system guide"
echo ""
echo "🔗 Useful Links:"
echo "  - Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
echo "  - Stripe Dashboard: https://dashboard.stripe.com"
echo ""
echo "${GREEN}Vyberology is ready to receive payments! 🚀${NC}"
