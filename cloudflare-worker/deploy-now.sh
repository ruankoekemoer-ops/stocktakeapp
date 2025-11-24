#!/bin/bash
# Rebuild and deploy directly using wrangler

cd "/Users/ruankoekemoer/Sharepoint Test/cloudflare-worker"

echo "🔨 Building static files..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🚀 Deploying to Cloudflare..."
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "The items-catalog API endpoints are now live."
    echo "You can now run: node import-items-from-excel.js"
else
    echo ""
    echo "❌ Deployment failed. Check the error above."
    exit 1
fi

