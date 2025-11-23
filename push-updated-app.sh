#!/bin/bash
# Push updated Stock Take Management System to GitHub

set -e

cd "/Users/ruankoekemoer/Sharepoint Test"

echo "🚀 Pushing updated app to GitHub..."
echo ""

# Set up authentication if token is available
if [ -n "$GITHUB_TOKEN" ]; then
    echo "🔐 Using GitHub token from environment..."
    git config credential.helper store
    echo "https://${GITHUB_TOKEN}@github.com" > ~/.git-credentials
    chmod 600 ~/.git-credentials
else
    echo "⚠️  GITHUB_TOKEN not set. You may be prompted for credentials."
    echo "   Set it with: export GITHUB_TOKEN=your_token_here"
fi

# Add all files
echo "📝 Adding all files..."
git add .

# Commit
echo ""
echo "💾 Committing changes..."
git commit -m "Complete rewrite: Stock Take Management System with Company, Warehouse, Bin Location, and Manager setup

- Added Company management (multiple companies)
- Added Warehouse setup (linked to companies)
- Added Bin Location setup (aisle, shelf, level tracking)
- Added Warehouse Manager setup with authorization
- Manager authorization: managers can only count items for assigned warehouses
- Enhanced stock take with cascading dropdowns
- Updated database schema with all new tables
- Complete API rewrite with all CRUD endpoints
- Responsive UI with setup tabs and filtering" || echo "No changes to commit"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📍 Repository: https://github.com/ruankoekemoer-ops/stocktakeapp"
echo ""
echo "📝 Next steps:"
echo "   1. Update database schema: npx wrangler d1 execute stocktakedata --file=./schema.sql --remote"
echo "   2. Build static files: node build-static-files.js"
echo "   3. Deploy: npm run deploy"

