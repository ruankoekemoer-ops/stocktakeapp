#!/bin/bash
# Push updates to GitHub

cd "/Users/ruankoekemoer/Sharepoint Test"

echo "🔄 Checking git status..."
git status

echo ""
echo "📝 Adding all changes..."
git add -A

echo ""
echo "💾 Committing changes..."
git commit -m "Add items catalog system: database table, API endpoints, import script, and auto-populate item names on scan

- Created items_catalog database table (stock_code, item_name, requires_serial_number)
- Added API endpoints for items catalog (GET, POST, PUT, DELETE, lookup by stock_code)
- Updated frontend to auto-populate item names when stock codes are scanned
- Created import script to import items from CSV file
- Added diagnostic and test scripts for troubleshooting
- Item name field is now read-only and auto-filled from catalog"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
else
    echo ""
    echo "❌ Push failed. Check the error above."
fi
