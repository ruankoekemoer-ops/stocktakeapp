-- Cloudflare D1 Database Schema for Stock Take App
-- Run this with: wrangler d1 execute stock-take-db --file=./schema.sql

-- Create Stock Take Items table
CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    location TEXT,
    date DATE,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_items_date ON stock_items(date);
CREATE INDEX IF NOT EXISTS idx_stock_items_location ON stock_items(location);
CREATE INDEX IF NOT EXISTS idx_stock_items_item_name ON stock_items(item_name);
CREATE INDEX IF NOT EXISTS idx_stock_items_created_at ON stock_items(created_at);

