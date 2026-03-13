#!/bin/bash

# 🔥 Divine Ass Kicker Secret Setup Script 🔥
# Run this to configure all deployment secrets interactively

set -e

echo "🔥 DIVINE ASS KICKER - SECRET CONFIGURATION 🔥"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI ready${NC}"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local description=$2
    local instructions=$3

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}Setting up: ${secret_name}${NC}"
    echo -e "${description}"
    echo ""
    echo -e "${instructions}"
    echo ""

    # Check if secret already exists
    if gh secret list | grep -q "^${secret_name}"; then
        echo -e "${YELLOW}⚠️  ${secret_name} already exists${NC}"
        read -p "Do you want to update it? (y/n): " update
        if [[ $update != "y" ]]; then
            echo "Skipping ${secret_name}"
            echo ""
            return
        fi
    fi

    read -sp "Enter ${secret_name}: " secret_value
    echo ""

    if [[ -z "$secret_value" ]]; then
        echo -e "${RED}❌ No value provided, skipping${NC}"
        echo ""
        return
    fi

    echo "$secret_value" | gh secret set "$secret_name"
    echo -e "${GREEN}✅ ${secret_name} configured!${NC}"
    echo ""
}

# Configure each secret
echo "Let's configure all 4 deployment secrets!"
echo ""

# 1. NETLIFY_AUTH_TOKEN
set_secret "NETLIFY_AUTH_TOKEN" \
    "📦 Netlify Authentication Token" \
    "How to get it:
    1. Go to: https://app.netlify.com
    2. Click your avatar (top right) → User settings
    3. Click 'Applications' in left sidebar
    4. Scroll to 'Personal access tokens'
    5. Click 'New access token'
    6. Description: 'Vyberology GitHub Deploy'
    7. Click 'Generate token'
    8. COPY THE TOKEN (you can't see it again!)"

# 2. NETLIFY_SITE_ID
set_secret "NETLIFY_SITE_ID" \
    "📦 Netlify Site ID" \
    "How to get it:
    1. Go to: https://app.netlify.com
    2. Click on your Vyberology site (or create new site)
    3. Click 'Site settings'
    4. Copy the 'Site ID' (under 'Site details')

    Note: If you don't have a site yet:
    - Click 'Add new site' → 'Import an existing project'
    - Connect GitHub → Select Vyberology
    - Build command: pnpm --filter ./apps/web run build
    - Publish directory: apps/web/dist
    - Click 'Deploy site' then come back here"

# 3. SUPABASE_ACCESS_TOKEN
set_secret "SUPABASE_ACCESS_TOKEN" \
    "🗄️  Supabase Access Token" \
    "How to get it:
    1. Go to: https://supabase.com/dashboard
    2. Click your avatar (top right)
    3. Click 'Account settings'
    4. Click 'Access Tokens' tab
    5. Click 'Generate new token'
    6. Name: 'Vyberology GitHub Deploy'
    7. Scopes: Select all (or minimum: functions.write, migrations.write)
    8. Click 'Generate token'
    9. COPY THE TOKEN immediately!"

# 4. SUPABASE_PROJECT_REF
set_secret "SUPABASE_PROJECT_REF" \
    "🗄️  Supabase Project Reference ID" \
    "How to get it:
    1. Go to: https://supabase.com/dashboard
    2. Click on your Vyberology project
    3. Click 'Settings' (gear icon in sidebar)
    4. Click 'General'
    5. Find 'Reference ID' under 'Project Details'
    6. Copy the ref (looks like: abcdefghijklmno)"

# Verify all secrets are set
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 SECRET CONFIGURATION COMPLETE!${NC}"
echo ""
echo "Current secrets:"
gh secret list

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🚀 READY TO DEPLOY!${NC}"
echo ""
echo "Next steps:"
echo "1. Trigger deployment:"
echo "   gh workflow run deploy.yml"
echo ""
echo "2. Watch the magic happen:"
echo "   gh run watch"
echo ""
echo -e "${GREEN}LET'S KICK SOME ASS! 💪🔥${NC}"
