#!/bin/bash
# Rebuild and deploy the app

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
    echo "Your app is now live at: https://stock-take-api.rkoekemoer.workers.dev"
else
    echo ""
    echo "❌ Deployment failed. Check the error above."
    exit 1
fi

