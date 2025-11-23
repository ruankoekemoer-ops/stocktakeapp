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
git commit -m "Add Microsoft authentication and improve counter workflow

- Implemented Microsoft authentication using MSAL.js
- Added sign in/sign out functionality with user info display
- Counter improvements: number pad for quantity input, auto-launch scanner after adding item
- Redesigned View Items screen as full-screen page with proper data display
- Added comprehensive filtering and search for stock items
- Improved card-based layout for better data visualization
- Added MICROSOFT-AUTH-SETUP.md guide for Azure AD configuration"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo "✅ Done!"
