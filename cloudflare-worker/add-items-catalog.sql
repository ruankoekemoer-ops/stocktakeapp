-- Items Catalog table
-- Stores item master data: stock codes, names, and serial number requirements
-- Run with: wrangler d1 execute stocktakedata --file=./add-items-catalog.sql --remote

CREATE TABLE IF NOT EXISTS items_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_code TEXT UNIQUE NOT NULL,
    item_name TEXT NOT NULL,
    requires_serial_number INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for fast lookups by stock code
CREATE INDEX IF NOT EXISTS idx_items_catalog_stock_code ON items_catalog(stock_code);

