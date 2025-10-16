#!/bin/bash
# Vyberology - Setup and Deploy Script (uses npx - no installation required)
# Usage: ./setup-and-deploy.sh

set -e

echo "🚀 Vyberology - Supabase Setup & Deployment"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_REF="qptrlxzyindcohsubidl"

echo -e "${YELLOW}Note: This script uses 'npx supabase' so no global installation is required.${NC}"
echo ""

# Get OpenAI API key from environment or prompt
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}Please enter your OpenAI API key:${NC}"
    read -s OPENAI_KEY
    echo ""
else
    OPENAI_KEY="$OPENAI_API_KEY"
    echo -e "${GREEN}Using OPENAI_API_KEY from environment${NC}"
    echo ""
fi

# Step 1: Login
echo "📝 Step 1: Login to Supabase"
echo "This will open your browser for authentication..."
echo ""
npx supabase login

echo ""
echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Step 2: Link project
echo "🔗 Step 2: Linking to project ${PROJECT_REF}"
echo ""
npx supabase link --project-ref $PROJECT_REF

echo ""
echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Step 3: Set secrets
echo "🔐 Step 3: Setting OpenAI API key secret"
echo ""
npx supabase secrets set OPENAI_API_KEY=$OPENAI_KEY

echo ""
echo -e "${GREEN}✅ Secret set successfully${NC}"
echo ""

# Step 4: Verify secrets
echo "🔍 Step 4: Verifying secrets..."
echo ""
npx supabase secrets list

echo ""

# Step 5: Deploy functions
echo "🚀 Step 5: Deploying Edge Functions"
echo ""
read -p "Ready to deploy the generate-reading function? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx supabase functions deploy generate-reading

    echo ""
    echo -e "${GREEN}✅ Function deployed successfully!${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping deployment${NC}"
    echo ""
fi

# Final summary
echo "═══════════════════════════════════════════"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Test your Edge Function with:"
echo "     npm run dev"
echo ""
echo "  2. Or test the deployed function:"
echo "     curl -X POST https://qptrlxzyindcohsubidl.supabase.co/functions/v1/generate-reading \\"
echo "       -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"fullName\": \"Test User\", \"inputs\": []}'"
echo ""
echo "  3. Deploy your frontend:"
echo "     npm run build"
echo ""
echo -e "${YELLOW}⚠️  Security reminder: Never commit .env files to git!${NC}"
echo ""
