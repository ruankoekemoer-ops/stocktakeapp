# Import Items from Excel Guide

This guide explains how to import items from the Excel file into the `items_catalog` database table.

## Step 1: Convert Excel to CSV

The Excel file at `.github/Files/Item's for count.xlsx` needs to be converted to CSV format first.

### Option A: Using Excel
1. Open the Excel file
2. Go to File → Save As
3. Choose "CSV (Comma delimited) (*.csv)"
4. Save as `Item's for count.csv` in the same folder

### Option B: Using Google Sheets
1. Upload the Excel file to Google Sheets
2. Go to File → Download → Comma-separated values (.csv)
3. Save the CSV file

### Option C: Online Converter
Use an online Excel to CSV converter tool.

## Step 2: Expected CSV Format

The CSV should have at least 2 columns:
- **Column 1**: Stock Code (required)
- **Column 2**: Item Name (required)
- **Column 3**: Requires Serial Number (optional, Y/N or 1/0)

Example:
```csv
Stock Code,Item Name,Requires Serial Number
ABC123,Widget A,Y
DEF456,Widget B,N
GHI789,Widget C,1
```

## Step 3: Import Items

### Option A: Using the Import Script

1. Make sure the CSV file is at: `.github/Files/Item's for count.csv`
2. Run the import script:
   ```bash
   cd cloudflare-worker
   node import-items-from-excel.js
   ```

### Option B: Using the API Directly

You can also import items one by one using the API:

```bash
curl -X POST https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog \
  -H "Content-Type: application/json" \
  -d '{
    "stock_code": "ABC123",
    "item_name": "Widget A",
    "requires_serial_number": true
  }'
```

### Option C: Bulk Import via API

Create a script that reads your CSV and makes POST requests to `/api/items-catalog` for each row.

## Step 4: Verify Import

Check that items were imported:

```bash
curl https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog
```

Or test a lookup:

```bash
curl "https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog?stock_code=ABC123"
```

## Notes

- Duplicate stock codes will be rejected (409 error)
- The import script will skip duplicates and continue
- Item names are auto-populated when scanning stock codes in the app
- If an item requires a serial number, a warning will be shown when scanned

