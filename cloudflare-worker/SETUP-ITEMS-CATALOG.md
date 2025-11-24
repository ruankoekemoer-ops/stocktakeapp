# Setup Items Catalog - Step by Step

## Step 1: Create the Database Table

First, make sure the `items_catalog` table exists in your Cloudflare D1 database:

```bash
cd cloudflare-worker
npx wrangler d1 execute stocktakedata --file=./add-items-catalog.sql --remote
```

You should see a success message. If you get an error, the table might already exist (that's okay).

## Step 2: Test the Setup

Run the test script to verify everything is ready:

```bash
cd cloudflare-worker
node test-import.js
```

This will check:
- ✓ CSV file exists and is readable
- ✓ CSV format is correct
- ✓ Fetch API is available
- ✓ API is accessible

## Step 3: Install node-fetch (if needed)

If the test shows fetch is not available, install it:

```bash
cd cloudflare-worker
npm install node-fetch
```

## Step 4: Run the Import

Once everything is ready, run the import:

```bash
cd cloudflare-worker
node import-items-from-excel.js
```

The script will:
- Read the CSV file from `.github/Files/Item's for count.csv`
- Parse each row (Alternative New Code, D365 Name, Serial Required)
- Import items into the database
- Show progress every 100 items
- Display a summary at the end

## Troubleshooting

### "File not found" error

1. Check the file path:
   ```bash
   ls -la "../.github/Files/Item's for count.csv"
   ```

2. Make sure you're running from the `cloudflare-worker` directory

3. The file should be at: `../.github/Files/Item's for count.csv` (relative to cloudflare-worker)

### "fetch is not available" error

Install node-fetch:
```bash
npm install node-fetch
```

Or use Node.js 18+ which has built-in fetch.

### "API not accessible" error

1. Make sure the Cloudflare Worker is deployed:
   ```bash
   npm run deploy
   ```

2. Test the API directly:
   ```bash
   curl https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog
   ```

### "Table not found" error

Make sure you've created the table:
```bash
npx wrangler d1 execute stocktakedata --file=./add-items-catalog.sql --remote
```

## CSV Format

The CSV file should have this format:
- Column 1: Alternative New Code (stock code)
- Column 2: D365 Name (item name)
- Column 3: Serial Required (Yes/no)

Example:
```csv
Alternative New Code,D365 Name,Serial Required
1050003160,"NOZZLE, CUTTING, 0F HARRIS",Yes
1050003260,1F Cutting Nozzle,no
```

## Verify Import

After importing, verify items were added:

```bash
curl "https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog?stock_code=1050003160"
```

Or check the total count:
```bash
curl "https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog" | jq '. | length'
```

