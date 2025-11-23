-- Cloudflare D1 Database Schema for Stock Take App
-- Run this with: wrangler d1 execute stocktakedata --file=./schema.sql --remote

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_code TEXT UNIQUE NOT NULL,
    warehouse_name TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Bin Locations table
CREATE TABLE IF NOT EXISTS bin_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bin_code TEXT NOT NULL,
    bin_name TEXT,
    warehouse_id INTEGER NOT NULL,
    aisle TEXT,
    shelf TEXT,
    level TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    UNIQUE(bin_code, warehouse_id)
);

-- Warehouse Managers table
CREATE TABLE IF NOT EXISTS warehouse_managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manager_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    warehouse_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Stock Items table (updated to reference new structure)
CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    item_code TEXT,
    quantity INTEGER DEFAULT 0,
    bin_location_id INTEGER,
    warehouse_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    counted_by_manager_id INTEGER,
    date DATE,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bin_location_id) REFERENCES bin_locations(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (counted_by_manager_id) REFERENCES warehouse_managers(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(company_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_bin_locations_code ON bin_locations(bin_code);
CREATE INDEX IF NOT EXISTS idx_bin_locations_warehouse ON bin_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_warehouse ON stock_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_company ON stock_items(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_bin ON stock_items(bin_location_id);
CREATE INDEX IF NOT EXISTS idx_managers_warehouse ON warehouse_managers(warehouse_id);
