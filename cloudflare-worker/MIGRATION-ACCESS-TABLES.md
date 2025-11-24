# Migration: Add System Admin Access Tables

This migration adds the tables needed for the System Admin functionality:
- `manager_company_access` - Controls which managers have access to which companies
- `counter_company_access` - Controls which counters (by email) can count for which companies

## Steps to Apply Migration

1. **Navigate to the cloudflare-worker directory:**
   ```bash
   cd cloudflare-worker
   ```

2. **Run the migration script:**
   ```bash
   npx wrangler d1 execute stocktakedata --file=./add-access-tables.sql --remote
   ```

   Or if you need to use the database ID directly:
   ```bash
   npx wrangler d1 execute 7b0985e4-b27d-4c39-9438-0b638ae8b469 --file=./add-access-tables.sql --remote
   ```

3. **Deploy the updated Worker:**
   ```bash
   npm run deploy
   ```

## What This Migration Does

- Creates `manager_company_access` table with:
  - `id` (primary key)
  - `manager_id` (foreign key to warehouse_managers)
  - `company_id` (foreign key to companies)
  - `created_at` and `updated_at` timestamps
  - Unique constraint on (manager_id, company_id)

- Creates `counter_company_access` table with:
  - `id` (primary key)
  - `counter_email` (email address of the counter)
  - `company_id` (foreign key to companies)
  - `created_at` and `updated_at` timestamps
  - Unique constraint on (counter_email, company_id)

- Creates indexes for better query performance

## API Endpoints Added

The following endpoints are now available:

### Manager-Company Access
- `GET /api/manager-company-access` - List all access records (optional filters: `?manager_id=X&company_id=Y`)
- `POST /api/manager-company-access` - Create new access record
- `DELETE /api/manager-company-access/:id` - Delete access record

### Counter-Company Access
- `GET /api/counter-company-access` - List all access records (optional filters: `?counter_email=X&company_id=Y`)
- `POST /api/counter-company-access` - Create new access record
- `DELETE /api/counter-company-access/:id` - Delete access record

## Verification

After running the migration, you can verify the tables were created:

```bash
npx wrangler d1 execute stocktakedata --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%access%';" --remote
```

You should see:
- `manager_company_access`
- `counter_company_access`

