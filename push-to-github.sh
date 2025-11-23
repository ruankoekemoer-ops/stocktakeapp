#!/bin/bash

# Push changes to GitHub
# This script safely pushes all changes without exposing tokens

cd "/Users/ruankoekemoer/Sharepoint Test"

echo "🚀 Pushing to GitHub repository..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository. Initializing..."
    git init
    git remote add origin https://github.com/ruankoekemoer-ops/stocktakeapp.git 2>/dev/null || true
fi

# Add all changes
echo "📝 Adding files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit."
    exit 0
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "Redesign: Single company settings screen with improved dropdown flows

- Consolidated setup into single company-centric settings screen
- Fixed all dropdown dependencies and cascading updates
- Improved error prevention and validation
- Enhanced UI with better organization
- All modals pre-populate with selected company
- Auto-select newly created companies"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main 2>&1 || git push -u origin master 2>&1

echo "✅ Done!"
