#!/bin/bash
# Safe push script - uses environment variable for token

set -e

cd "/Users/ruankoekemoer/Sharepoint Test"

echo "🚀 Pushing to GitHub repository..."
echo ""

# Check for token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN environment variable not set."
    echo "   Set it with: export GITHUB_TOKEN=your_token_here"
    echo "   Or you'll be prompted for credentials."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Configure git (if needed)
git config user.name "ruankoekemoer-ops" || true
git config user.email "rkoekemoer@masterdrilling.com" || true

# Add remote
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/ruankoekemoer-ops/stocktakeapp.git

# Set up authentication if token is provided
if [ -n "$GITHUB_TOKEN" ]; then
    echo "🔐 Configuring authentication..."
    git config credential.helper store
    echo "https://${GITHUB_TOKEN}@github.com" > ~/.git-credentials
    chmod 600 ~/.git-credentials
fi

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

