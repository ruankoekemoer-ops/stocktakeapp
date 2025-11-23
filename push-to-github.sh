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
git commit -m "Complete app redesign with modern dark mode UI

- Redesigned entire app with modern dark mode theme
- Implemented sidebar navigation for desktop and bottom nav for mobile
- Removed all emojis from main interface (kept only in role selection)
- Counter role now sees ONLY the counting interface (no navigation, headers, or other tabs)
- Manager role sees full interface with all features
- Added Switch Role functionality to return to role selection
- Replaced all alert() pop-ups with modern toast notifications
- Improved responsive design for mobile and desktop
- Clean, professional app-style interface"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo "✅ Done!"
