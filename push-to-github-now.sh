#!/bin/bash
# Quick push script with GitHub token

set -e

cd "/Users/ruankoekemoer/Sharepoint Test"

echo "🚀 Pushing to GitHub repository..."
echo ""

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Configure git (if needed)
git config user.name "ruankoekemoer-ops" || true
git config user.email "rkoekemoer@masterdrilling.com" || true

# Add remote with token
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin https://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@github.com/ruankoekemoer-ops/stocktakeapp.git

# Add all files
echo "📝 Adding files..."
git add .

# Commit
echo "💾 Committing changes..."
git commit -m "Initial commit: Stock Take App with Cloudflare D1 integration" || echo "No changes to commit"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "📍 Repository: https://github.com/ruankoekemoer-ops/stocktakeapp"

