# 🔧 Quick Fix - Run These Commands

The command needs the database **name** (not just ID) as the first argument.

## Step 1: Find your database name

```bash
npx wrangler d1 list
```

This will show something like:
```
┌─────────────────────────────────────┬──────────────────────┐
│ name                                │ id                   │
├─────────────────────────────────────┼──────────────────────┤
│ stock-take-db                       │ 7b0985e4-b27d-4c39... │
└─────────────────────────────────────┴──────────────────────┘
```

Copy the **name** from the first column.

## Step 2: Run the schema with the database name

```bash
npx wrangler d1 execute <database-name> --file=./schema.sql
```

Replace `<database-name>` with the name from Step 1.

**Example:**
```bash
npx wrangler d1 execute stock-take-db --file=./schema.sql
```

## Step 3: Deploy

```bash
npm run deploy
```

---

## Alternative: Use database ID directly

You can also try using the database ID as the name:

```bash
npx wrangler d1 execute 7b0985e4-b27d-4c39-9438-0b638ae8b469 --file=./schema.sql
```

If that doesn't work, use the database name from `wrangler d1 list`.

