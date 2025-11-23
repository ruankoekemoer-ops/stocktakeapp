#!/bin/bash

cd "/Users/ruankoekemoer/Sharepoint Test"

echo "🚀 Pushing changes to GitHub..."

# Check git status
git status

# Add all changes
echo "📝 Adding files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Fix Microsoft authentication: require login before access

- Fixed sign-in button to properly trigger authentication
- Added login screen that blocks access until user signs in
- Users must authenticate before selecting role or accessing app
- Improved error handling and user feedback for auth flow
- Sign-out now properly blocks access again"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo "✅ Done!"
