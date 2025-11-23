#!/bin/bash
# Script to push everything to GitHub repository

set -e

REPO_URL="https://github.com/ruankoekemoer-ops/stocktakeapp.git"

echo "🚀 Setting up Git repository and pushing to GitHub..."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add remote (force update if exists)
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

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
echo "📍 Repository: $REPO_URL"

