#!/bin/bash
# Run the database schema setup with --remote flag

echo "📊 Setting up database schema on remote D1 database..."
npx wrangler d1 execute stocktakedata --file=./schema.sql --remote

echo ""
echo "✅ Database schema created successfully!"

