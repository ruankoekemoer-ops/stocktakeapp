# Stock Take Management System

A comprehensive warehouse inventory management system with company, warehouse, bin location, and manager setup.

## Features

✅ **Company Management** - Multiple companies support  
✅ **Warehouse Setup** - Warehouses linked to companies  
✅ **Bin Location Setup** - Detailed location tracking (aisle, shelf, level)  
✅ **Manager Setup** - Warehouse managers with authorization  
✅ **Stock Take** - Manager-authorized inventory counting  
✅ **View & Search** - Filter by warehouse, manager, search items  
✅ **Cloudflare D1** - Serverless SQLite database  

## Quick Start

### 1. Update Database Schema

```bash
cd cloudflare-worker
npx wrangler d1 execute stocktakedata --file=./schema.sql --remote
```

### 2. Build and Deploy

```bash
cd cloudflare-worker
node build-static-files.js
npm run deploy
```

### 3. Setup Order

1. **Companies** - Create your companies
2. **Warehouses** - Create warehouses for each company
3. **Bin Locations** - Set up bin locations in warehouses
4. **Managers** - Assign managers to warehouses
5. **Stock Take** - Start counting inventory

## App Structure

### Setup Tab
- **Companies** - Manage companies
- **Warehouses** - Manage warehouses (filter by company)
- **Bin Locations** - Manage bin locations (filter by warehouse)
- **Managers** - Manage warehouse managers (filter by warehouse)

### Stock Take Tab
- Select company → warehouse → manager → bin location
- Enter item details
- Manager authorization is automatically validated

### View Items Tab
- View all stock items
- Filter by warehouse or manager
- Search items
- Edit and delete items

## Manager Authorization

**Important:** Managers can only count items for warehouses they're assigned to.

- When creating a stock item, the system verifies the manager is assigned to the selected warehouse
- Returns error if manager is not authorized
- This ensures data integrity and proper access control

## Database Schema

```
companies
  ├── id, company_code, company_name
  └── warehouses
       ├── id, warehouse_code, warehouse_name, company_id, address
       ├── bin_locations
       │    └── id, bin_code, bin_name, warehouse_id, aisle, shelf, level
       ├── warehouse_managers
       │    └── id, manager_name, email, phone, warehouse_id, is_active
       └── stock_items
            └── id, item_name, item_code, quantity, company_id, warehouse_id, 
                bin_location_id, counted_by_manager_id, date, notes
```

## API Endpoints

- **Companies**: `/api/companies`
- **Warehouses**: `/api/warehouses`
- **Bin Locations**: `/api/bin-locations`
- **Managers**: `/api/managers`
- **Stock Items**: `/api/items`

See API documentation at: `https://stock-take-api.rkoekemoer.workers.dev/api`

## Technologies

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Hosting**: Cloudflare Workers

## License

MIT
