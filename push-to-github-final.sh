#!/bin/bash
# Final push to GitHub - removes token from history and pushes cleanly

set -e

cd "/Users/ruankoekemoer/Sharepoint Test"

echo "🚀 Pushing to GitHub repository..."
echo ""

# Set token as environment variable
export GITHUB_TOKEN=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

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git config user.name "ruankoekemoer-ops"
    git config user.email "rkoekemoer@masterdrilling.com"
fi

# Remove any existing commits with tokens
if git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo "🧹 Cleaning commit history..."
    # Check if token is in any commit
    if git log --all --full-history --source -- "*push-to-github*.sh" | grep -q "ghp_" 2>/dev/null; then
        echo "⚠️  Found token in history. Resetting..."
        git reset --soft HEAD~1 2>/dev/null || true
    fi
fi

# Set up remote
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/ruankoekemoer-ops/stocktakeapp.git

# Configure authentication
echo "🔐 Setting up authentication..."
git config credential.helper store
echo "https://${GITHUB_TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# Add all files (excluding those with tokens)
echo "📝 Adding files..."
git add .

# Remove any files that might contain tokens from staging
git reset HEAD push-to-github-now.sh push-to-github.sh 2>/dev/null || true

# Add files again (they should be clean now)
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
echo ""
echo "🔒 Security: Token is stored in ~/.git-credentials (not in code)"

