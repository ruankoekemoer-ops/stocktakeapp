#!/bin/bash
# Setup script for Cloudflare Worker deployment

set -e  # Exit on error

echo "🚀 Setting up Cloudflare Worker for Stock Take App"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
else
    echo "✅ Wrangler is already installed"
fi

echo ""
echo "🔐 Step 1: Login to Cloudflare"
echo "   (This will open your browser for authentication)"
wrangler login

echo ""
echo "📊 Step 2: Finding database name..."
echo "   Listing databases..."
DATABASE_NAME=$(wrangler d1 list | grep -i "7b0985e4-b27d-4c39-9438-0b638ae8b469" | awk '{print $1}' | head -1)

if [ -z "$DATABASE_NAME" ]; then
    echo "   Could not find database name automatically."
    echo "   Please run: wrangler d1 list"
    echo "   Then run: wrangler d1 execute <database-name> --file=./schema.sql"
    exit 1
fi

echo "   Found database: $DATABASE_NAME"
echo "   Setting up database schema..."
wrangler d1 execute "$DATABASE_NAME" --file=./schema.sql

echo ""
echo "📦 Step 3: Installing dependencies..."
npm install

echo ""
echo "🚀 Step 4: Deploying Worker..."
echo "   (After deployment, copy the Worker URL and update stock-take-app/js/config.js)"
npm run deploy

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the Worker URL from above"
echo "   2. Open stock-take-app/js/config.js"
echo "   3. Replace 'YOUR_WORKER_URL_HERE' with your actual Worker URL"
echo "   4. Open stock-take-app/index.html in your browser"

