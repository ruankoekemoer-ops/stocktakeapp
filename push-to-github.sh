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
git commit -m "Fix role selection buttons and duplicate variable declarations

- Fixed duplicate variable declarations (currentStockTake, currentBinLocation, currentBinItems) that prevented JavaScript from loading
- Fixed role selection buttons not working - added pointer-events: none to child elements
- Added multiple event listeners (click, mousedown, touchstart) for better compatibility
- Changed buttons to use IDs instead of data attributes for more reliable selection
- Added comprehensive console logging for debugging
- Buttons now properly transition from role selection to app interface
- Tested and verified: Counter and Manager buttons both work correctly"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main 2>&1 || git push -u origin master 2>&1

echo "✅ Done!"
