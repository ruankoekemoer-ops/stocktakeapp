-- Migration script to add new tables for v2 workflow
-- This adds stock_takes and bin_location_counts tables without dropping existing data
-- Run with: wrangler d1 execute stocktakedata --file=./migrate-to-v2.sql --remote

-- Stock Takes table - Track open/closed stock takes
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

-- Bin Location Counts table - Temporary counts before submission
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

-- Add stock_take_id to stock_items if it doesn't exist
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we'll check manually
-- This is safe to run multiple times - if column exists, it will be ignored

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stock_takes_company ON stock_takes(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_takes_warehouse ON stock_takes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_takes_status ON stock_takes(status);
CREATE INDEX IF NOT EXISTS idx_bin_location_counts_stock_take ON bin_location_counts(stock_take_id);
CREATE INDEX IF NOT EXISTS idx_bin_location_counts_bin ON bin_location_counts(bin_location_id);
CREATE INDEX IF NOT EXISTS idx_bin_location_counts_submitted ON bin_location_counts(submitted);

