#!/bin/bash
# Quick deploy script (run after initial setup)

set -e

echo "🚀 Deploying Cloudflare Worker..."

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Run: npm install -g wrangler"
    exit 1
fi

# Deploy
npm run deploy

echo ""
echo "✅ Deployment complete!"
echo "📝 Don't forget to update stock-take-app/js/config.js with your Worker URL"

