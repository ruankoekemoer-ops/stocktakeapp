# 🔄 Migration Guide - New Stock Take System

The app has been completely rewritten with a comprehensive warehouse management system.

## New Features

### 1. **Company Setup**
- Manage multiple companies
- Each company can have multiple warehouses
- Company code and name required

### 2. **Warehouse Setup**
- Create warehouses linked to companies
- Warehouse code, name, and company required
- Optional address field

### 3. **Bin Location Setup**
- Create bin locations within warehouses
- Bin code required, name optional
- Aisle, shelf, and level tracking
- Unique bin codes per warehouse

### 4. **Warehouse Manager Setup**
- Assign managers to specific warehouses
- Managers can ONLY count items for their assigned warehouse
- Email and phone contact information
- Manager authorization enforced at API level

### 5. **Enhanced Stock Take**
- Select company → warehouse → manager → bin location
- Manager validation ensures only authorized managers can count
- Full tracking of who counted what and where

## Database Migration

### Step 1: Update Database Schema

Run the new schema to create all tables:

```bash
cd cloudflare-worker
npx wrangler d1 execute stocktakedata --file=./schema.sql --remote
```

**⚠️ WARNING:** This will create new tables. Your existing `stock_items` data structure will change.

### Step 2: Migrate Existing Data (Optional)

If you have existing stock items, you'll need to:
1. Export existing data
2. Set up companies and warehouses
3. Re-import items with proper company/warehouse assignments

## New Database Structure

```
companies
  └── warehouses
       ├── bin_locations
       ├── warehouse_managers
       └── stock_items (references company, warehouse, bin, manager)
```

## API Endpoints

### Companies
- `GET /api/companies` - List all companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Warehouses
- `GET /api/warehouses?company_id=X` - List warehouses (optional filter)
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/:id` - Update warehouse
- `DELETE /api/warehouses/:id` - Delete warehouse

### Bin Locations
- `GET /api/bin-locations?warehouse_id=X` - List bin locations (optional filter)
- `POST /api/bin-locations` - Create bin location
- `PUT /api/bin-locations/:id` - Update bin location
- `DELETE /api/bin-locations/:id` - Delete bin location

### Managers
- `GET /api/managers?warehouse_id=X` - List managers (optional filter)
- `POST /api/managers` - Create manager
- `PUT /api/managers/:id` - Update manager
- `DELETE /api/managers/:id` - Deactivate manager

### Stock Items
- `GET /api/items?warehouse_id=X&manager_id=Y` - List items (optional filters)
- `POST /api/items` - Create item (with manager authorization check)
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

## Manager Authorization

**Key Feature:** Managers can only count items for warehouses they're assigned to.

When creating/updating stock items:
1. System checks if manager is assigned to the selected warehouse
2. Returns 403 error if manager is not authorized
3. Prevents unauthorized stock counts

## Setup Order

1. **Companies** - Create companies first
2. **Warehouses** - Link warehouses to companies
3. **Bin Locations** - Create bin locations within warehouses
4. **Managers** - Assign managers to warehouses
5. **Stock Take** - Start counting items

## Deploy

```bash
cd cloudflare-worker
node build-static-files.js
npm run deploy
```

## Breaking Changes

- Old `stock_items` table structure is replaced
- `location` field replaced with `warehouse_id` and `bin_location_id`
- New required fields: `company_id`, `warehouse_id`
- Manager authorization is now enforced

## Need Help?

- Check API endpoints at `/api` for available routes
- Verify database schema is updated
- Ensure all setup sections are completed before stock take

