#!/bin/bash
# Push first commit to GitHub to trigger Cloudflare deployment

set -e

cd "/Users/ruankoekemoer/Sharepoint Test"

echo "🚀 Pushing first commit to GitHub..."
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

# Check git status
echo "📊 Checking git status..."
git status

# Add all files
echo ""
echo "📝 Adding all files..."
git add .

# Commit
echo ""
echo "💾 Committing changes..."
git commit -m "Initial commit: Stock Take App with Cloudflare Worker serving frontend and API" || echo "No changes to commit"

# Ensure we're on main branch
echo ""
echo "🌿 Setting branch to main..."
git branch -M main

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📍 Repository: https://github.com/ruankoekemoer-ops/stocktakeapp"
echo ""
echo "🔄 Cloudflare should now automatically deploy from GitHub!"
echo "   Check your Cloudflare dashboard for deployment status."

