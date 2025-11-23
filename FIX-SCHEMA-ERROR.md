# 🔧 Fix Schema Error

The error occurred because the old `stock_items` table exists with a different structure. We need to drop the old tables first.

## Solution: Use Migration Script

I've created a migration script that drops old tables and creates new ones.

### Run This Command:

```bash
cd "/Users/ruankoekemoer/Sharepoint Test/cloudflare-worker"
npx wrangler d1 execute stocktakedata --file=./migrate-schema.sql --remote
```

## What This Does

1. **Drops old tables** (if they exist)
2. **Creates new tables** with the correct structure
3. **Creates indexes** for performance

## ⚠️ Important Warning

**This will DELETE all existing data!** 

If you have important data in the old `stock_items` table:
1. Export it first
2. Run the migration
3. Set up companies/warehouses
4. Re-import data with proper relationships

## Alternative: Preserve Data (Advanced)

If you want to preserve existing data, you'd need to:
1. Export existing stock_items
2. Run migration
3. Transform and re-import data

For a fresh start, the migration script is the easiest approach.

## After Migration

Once tables are created:
1. ✅ Build static files: `node build-static-files.js`
2. ✅ Deploy: `npm run deploy`
3. ✅ Start using the app!

