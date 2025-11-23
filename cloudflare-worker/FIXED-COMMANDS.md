# ✅ Fixed Commands

The error you got was because the command syntax changed. Here are the corrected commands:

## Step 1: Update Wrangler

```bash
npm install --save-dev wrangler@4
```

Or globally:
```bash
npm install -g wrangler@4
```

## Step 2: Find your database name

First, list your databases to find the name:

```bash
npx wrangler d1 list
```

This will show all your D1 databases with their names and IDs.

## Step 3: Set up database schema

Once you know the database name, use it as the first argument:

```bash
npx wrangler d1 execute <your-database-name> --file=./schema.sql
```

**OR** if you want to use the database ID directly, try:

```bash
npx wrangler d1 execute 7b0985e4-b27d-4c39-9438-0b638ae8b469 --file=./schema.sql
```

The database name or ID goes as the first positional argument (no `--database-id` flag needed).

## Step 3: Deploy

```bash
npm run deploy
```

## Quick Fix - Run This Now

From the `cloudflare-worker` directory:

```bash
# Update wrangler
npm install --save-dev wrangler@4

# Run the schema (corrected command)
npx wrangler d1 execute --database-id=7b0985e4-b27d-4c39-9438-0b638ae8b469 --file=./schema.sql

# Deploy
npm run deploy
```

## Verify the Schema Was Created

You can check if the table was created:

```bash
npx wrangler d1 execute --database-id=7b0985e4-b27d-4c39-9438-0b638ae8b469 --command="SELECT name FROM sqlite_master WHERE type='table';"
```

This should show `stock_items` in the results.

