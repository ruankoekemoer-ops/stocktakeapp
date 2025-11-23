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
git commit -m "Add role selection screen and fix scanning interface

- Added role selection screen that appears first on app load
- Counter mode: Only shows Stock Take and Open Stock Takes tabs (NO setup/view)
- Manager mode: Shows all tabs (Setup, Stock Take, View Items, Open Stock Takes)
- Fixed scanning interface visibility - now shows when stock take is open
- Added Open Stock Takes list with ability to open/close stock takes
- Enhanced scanning sections with auto-focus and auto-scroll
- Added API endpoint to get single stock take by ID
- Role preference saved in localStorage
- Switch Role button to change roles
- Improved visual hierarchy and mobile-friendly scanning inputs"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main 2>&1 || git push -u origin master 2>&1

echo "✅ Done!"
