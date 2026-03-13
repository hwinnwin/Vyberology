#!/bin/bash
set -e

echo "🔐 Retrieving Vyberology Credentials from Bitwarden"
echo "==================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if bw is installed
if ! command -v bw &> /dev/null; then
    echo "${RED}❌ Bitwarden CLI not found${NC}"
    echo "Install it with: brew install bitwarden-cli"
    exit 1
fi

echo "${GREEN}✅ Bitwarden CLI found${NC}"
echo ""

# Check login status
BW_STATUS=$(bw status | jq -r .status)
echo "${BLUE}Vault status: $BW_STATUS${NC}"

if [ "$BW_STATUS" == "unauthenticated" ]; then
    echo "${YELLOW}⚠️  Not logged in to Bitwarden${NC}"
    echo "Please login first: bw login"
    exit 1
fi

if [ "$BW_STATUS" == "locked" ]; then
    echo "${YELLOW}🔒 Vault is locked. Unlocking...${NC}"
    echo "Enter your Bitwarden master password:"
    BW_SESSION=$(bw unlock --raw)
    export BW_SESSION
    echo "${GREEN}✅ Vault unlocked${NC}"
    echo ""
else
    echo "${GREEN}✅ Vault is unlocked${NC}"
    echo ""
fi

# Search for credentials
echo "${BLUE}Searching for Vyberology credentials...${NC}"
echo ""

# Search for Stripe
echo "🔍 Looking for Stripe credentials..."
STRIPE_ITEMS=$(bw list items --search "stripe" 2>&1)
if [ $? -eq 0 ]; then
    echo "$STRIPE_ITEMS" | jq -r '.[] | "\(.name) - \(.id)"'
else
    echo "${YELLOW}⚠️  No Stripe items found or error: $STRIPE_ITEMS${NC}"
fi
echo ""

# Search for OpenAI
echo "🔍 Looking for OpenAI credentials..."
OPENAI_ITEMS=$(bw list items --search "openai" 2>&1)
if [ $? -eq 0 ]; then
    echo "$OPENAI_ITEMS" | jq -r '.[] | "\(.name) - \(.id)"'
else
    echo "${YELLOW}⚠️  No OpenAI items found or error: $OPENAI_ITEMS${NC}"
fi
echo ""

# Search for Vyberology
echo "🔍 Looking for Vyberology credentials..."
VYBE_ITEMS=$(bw list items --search "vyberology" 2>&1)
if [ $? -eq 0 ]; then
    echo "$VYBE_ITEMS" | jq -r '.[] | "\(.name) - \(.id)"'
else
    echo "${YELLOW}⚠️  No Vyberology items found or error: $VYBE_ITEMS${NC}"
fi
echo ""

# Try to get specific credentials
echo "${BLUE}Attempting to extract credentials...${NC}"
echo ""

# Try to find Stripe secret key
STRIPE_SECRET=$(bw list items --search "stripe" 2>&1 | jq -r '.[0].login.password // .[0].notes // empty' 2>/dev/null || echo "")
if [ -n "$STRIPE_SECRET" ] && [[ "$STRIPE_SECRET" == sk_* ]]; then
    echo "${GREEN}✅ Found Stripe Secret Key${NC}"
    echo "   Key starts with: ${STRIPE_SECRET:0:20}..."
    echo ""
    echo "Set it with:"
    echo "   supabase secrets set STRIPE_SECRET_KEY=\"$STRIPE_SECRET\""
    echo ""
else
    echo "${YELLOW}⚠️  Stripe Secret Key not found automatically${NC}"
    echo "   Please retrieve manually with: bw get item <item-id>"
    echo ""
fi

# Try to find OpenAI key
OPENAI_KEY=$(bw list items --search "openai" 2>&1 | jq -r '.[0].login.password // .[0].notes // empty' 2>/dev/null || echo "")
if [ -n "$OPENAI_KEY" ] && [[ "$OPENAI_KEY" == sk-* ]]; then
    echo "${GREEN}✅ Found OpenAI API Key${NC}"
    echo "   Key starts with: ${OPENAI_KEY:0:20}..."
    echo ""
    echo "Set it with:"
    echo "   supabase secrets set OPENAI_API_KEY=\"$OPENAI_KEY\""
    echo ""
else
    echo "${YELLOW}⚠️  OpenAI API Key not found automatically${NC}"
    echo "   Please retrieve manually with: bw get item <item-id>"
    echo ""
fi

# Manual retrieval instructions
echo "${BLUE}==================================================${NC}"
echo "${BLUE}Manual Retrieval (if needed):${NC}"
echo "${BLUE}==================================================${NC}"
echo ""
echo "To get a specific item:"
echo "   bw get item <item-id>"
echo ""
echo "To search and view all details:"
echo "   bw list items --search \"stripe\" | jq"
echo "   bw list items --search \"openai\" | jq"
echo ""
echo "To extract a specific field:"
echo "   bw get password <item-id>"
echo "   bw get notes <item-id>"
echo ""

# Save to temp file option
echo "${YELLOW}Would you like to save credentials to a temporary file? (y/n)${NC}"
read -r SAVE_CREDS

if [[ "$SAVE_CREDS" =~ ^[Yy]$ ]]; then
    TEMP_FILE="/tmp/vyberology-creds-$(date +%s).txt"

    echo "" > "$TEMP_FILE"
    echo "Vyberology Credentials" >> "$TEMP_FILE"
    echo "======================" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"

    if [ -n "$STRIPE_SECRET" ]; then
        echo "STRIPE_SECRET_KEY=$STRIPE_SECRET" >> "$TEMP_FILE"
    fi

    if [ -n "$OPENAI_KEY" ]; then
        echo "OPENAI_API_KEY=$OPENAI_KEY" >> "$TEMP_FILE"
    fi

    echo "# Add these manually:" >> "$TEMP_FILE"
    echo "# STRIPE_WEBHOOK_SECRET=whsec_..." >> "$TEMP_FILE"
    echo "# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..." >> "$TEMP_FILE"

    echo "" >> "$TEMP_FILE"
    echo "# Supabase commands:" >> "$TEMP_FILE"
    if [ -n "$STRIPE_SECRET" ]; then
        echo "supabase secrets set STRIPE_SECRET_KEY=\"$STRIPE_SECRET\"" >> "$TEMP_FILE"
    fi
    if [ -n "$OPENAI_KEY" ]; then
        echo "supabase secrets set OPENAI_API_KEY=\"$OPENAI_KEY\"" >> "$TEMP_FILE"
    fi

    chmod 600 "$TEMP_FILE"

    echo "${GREEN}✅ Credentials saved to: $TEMP_FILE${NC}"
    echo "${RED}⚠️  Remember to delete this file after use!${NC}"
    echo "   rm $TEMP_FILE"
    echo ""
fi

echo "${GREEN}Done! 🎉${NC}"
