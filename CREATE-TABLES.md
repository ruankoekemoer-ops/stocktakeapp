# 📊 Create Database Tables in Cloudflare D1

The schema file has been created, but the tables need to be created in your Cloudflare D1 database.

## Run This Command

```bash
cd "/Users/ruankoekemoer/Sharepoint Test/cloudflare-worker"
npx wrangler d1 execute stocktakedata --file=./schema.sql --remote
```

This will create all the tables:
- ✅ `companies`
- ✅ `warehouses`
- ✅ `bin_locations`
- ✅ `warehouse_managers`
- ✅ `stock_items` (updated structure)

## Verify Tables Were Created

After running the command, verify the tables exist:

```bash
npx wrangler d1 execute stocktakedata --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

You should see:
- companies
- warehouses
- bin_locations
- warehouse_managers
- stock_items

## What the Schema Creates

1. **companies** - Company management
2. **warehouses** - Warehouses linked to companies
3. **bin_locations** - Bin locations within warehouses
4. **warehouse_managers** - Managers assigned to warehouses
5. **stock_items** - Stock items with full relationships

## Important Notes

⚠️ **This will create NEW tables.** If you have existing data in the old `stock_items` table, it will be replaced with the new structure.

The new `stock_items` table requires:
- `company_id` (required)
- `warehouse_id` (required)
- `counted_by_manager_id` (optional, but validated if provided)

## After Creating Tables

1. ✅ Tables created
2. ✅ Build static files: `node build-static-files.js`
3. ✅ Deploy: `npm run deploy`
4. ✅ Start using the app!

