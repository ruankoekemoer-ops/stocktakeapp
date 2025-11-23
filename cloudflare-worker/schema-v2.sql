-- Cloudflare D1 Database Schema v2 for Stock Take App
-- New workflow: Open/Close stock takes, scan bin locations, scan items, submit bin locations
-- Run this with: wrangler d1 execute stocktakedata --file=./schema-v2.sql --remote

-- Companies table (unchanged)
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Warehouses table (unchanged)
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

-- Bin Locations table (unchanged)
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

-- Warehouse Managers table (unchanged)
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

-- Stock Takes table (NEW) - Track open/closed stock takes
CREATE TABLE IF NOT EXISTS stock_takes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    opened_by_manager_id INTEGER,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
    opened_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT,
    notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (opened_by_manager_id) REFERENCES warehouse_managers(id)
);

-- Bin Location Counts table (NEW) - Temporary counts before submission
CREATE TABLE IF NOT EXISTS bin_location_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_take_id INTEGER NOT NULL,
    bin_location_id INTEGER NOT NULL,
    item_code TEXT NOT NULL,
    item_name TEXT,
    quantity INTEGER DEFAULT 0,
    counted_by_manager_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    submitted INTEGER DEFAULT 0 CHECK(submitted IN (0, 1)),
    submitted_at TEXT,
    FOREIGN KEY (stock_take_id) REFERENCES stock_takes(id) ON DELETE CASCADE,
    FOREIGN KEY (bin_location_id) REFERENCES bin_locations(id),
    FOREIGN KEY (counted_by_manager_id) REFERENCES warehouse_managers(id)
);

-- Stock Items table (updated) - Final submitted items
CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_take_id INTEGER,
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
    FOREIGN KEY (stock_take_id) REFERENCES stock_takes(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_stock_takes_company ON stock_takes(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_takes_warehouse ON stock_takes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_takes_status ON stock_takes(status);
CREATE INDEX IF NOT EXISTS idx_bin_location_counts_stock_take ON bin_location_counts(stock_take_id);
CREATE INDEX IF NOT EXISTS idx_bin_location_counts_bin ON bin_location_counts(bin_location_id);
CREATE INDEX IF NOT EXISTS idx_bin_location_counts_submitted ON bin_location_counts(submitted);

