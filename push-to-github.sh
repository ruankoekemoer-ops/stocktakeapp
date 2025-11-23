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
git commit -m "Fix SQL error and add QR code scanning

- Fixed SQL query error: Changed w.warehouse_id to w.id as warehouse_id in bin-locations lookup
- Added QR code scanning functionality using html5-qrcode library
- Added camera button (📷) to bin location inputs (counter and manager modes)
- Added camera button (📷) to item code input
- QR scanner opens in modal with camera view
- Automatically triggers appropriate handler after successful scan
- Works on mobile devices with back camera support"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main 2>&1 || git push -u origin master 2>&1

echo "✅ Done!"
