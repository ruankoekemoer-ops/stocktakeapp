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
git commit -m "Remove manager selection from stock take opening, add automatic validation

- Removed manager dropdown from Open Stock Take form
- Added automatic validation that managers exist for warehouse
- System automatically assigns first active manager
- Added visual validation messages
- Fixed manager loading and dropdown updates
- API validates managers exist before opening stock take"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main 2>&1 || git push -u origin master 2>&1

echo "✅ Done!"
