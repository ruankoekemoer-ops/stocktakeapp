#!/bin/bash
# Run this script to set up and deploy

set -e

echo "🚀 Setting up Cloudflare D1 database schema..."
npx wrangler d1 execute stocktakedata --file=./schema.sql

echo ""
echo "✅ Database schema created!"
echo ""
echo "🚀 Deploying Worker..."
npm run deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the Worker URL from above"
echo "   2. Open stock-take-app/js/config.js"
echo "   3. Replace 'YOUR_WORKER_URL_HERE' with your Worker URL"
echo "   4. Open stock-take-app/index.html in your browser"

