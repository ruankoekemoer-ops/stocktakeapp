#!/bin/bash
# Script to fix the import issue by creating table and deploying

echo "=== Fixing Items Catalog Import ==="
echo ""

# Step 1: Create the database table
echo "Step 1: Creating items_catalog table..."
npx wrangler d1 execute stocktakedata --file=./add-items-catalog.sql --remote

if [ $? -eq 0 ]; then
    echo "✓ Table created successfully"
else
    echo "⚠ Table might already exist (that's okay)"
fi

echo ""
echo "Step 2: Deploying updated Worker code..."
npm run deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Deployment complete!"
    echo ""
    echo "Now you can run the import:"
    echo "  node import-items-from-excel.js"
else
    echo ""
    echo "✗ Deployment failed. Check the error above."
fi

