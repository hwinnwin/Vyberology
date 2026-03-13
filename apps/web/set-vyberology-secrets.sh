#!/bin/bash
# Quick script to set Vyberology secrets from Bitwarden

echo "🔐 Setting Vyberology Secrets"
echo ""

# Unlock Bitwarden if needed
BW_STATUS=$(bw status | jq -r .status)
if [ "$BW_STATUS" == "locked" ]; then
    echo "Unlocking Bitwarden..."
    export BW_SESSION=$(bw unlock --raw)
fi

# Get credentials
echo "Retrieving Stripe secret..."
STRIPE_SECRET=$(bw list items --search "stripe" | jq -r '.[0].login.password // .[0].notes' 2>/dev/null | grep -o 'sk_[^[:space:]]*' | head -1)

echo "Retrieving OpenAI key..."
OPENAI_KEY=$(bw list items --search "openai" | jq -r '.[0].login.password // .[0].notes' 2>/dev/null | grep -o 'sk-[^[:space:]]*' | head -1)

# Set secrets
if [ -n "$STRIPE_SECRET" ]; then
    echo "Setting STRIPE_SECRET_KEY..."
    supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET"
else
    echo "⚠️  Stripe secret not found"
fi

if [ -n "$OPENAI_KEY" ]; then
    echo "Setting OPENAI_API_KEY..."
    supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"
else
    echo "⚠️  OpenAI key not found"
fi

echo ""
echo "Note: You still need to manually set:"
echo "  - STRIPE_WEBHOOK_SECRET (create webhook in Stripe dashboard)"
echo ""
