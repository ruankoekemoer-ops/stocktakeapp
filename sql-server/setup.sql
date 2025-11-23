-- Simple SQL Server Setup Script
-- Creates a stock take database with sample tables

-- Create database (SQLite creates this automatically)
-- For MySQL/PostgreSQL, you would use: CREATE DATABASE stocktake;

-- Create Stock Take Items table
CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    location TEXT,
    date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Companies table
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_number TEXT UNIQUE NOT NULL,
    warehouse_name TEXT NOT NULL,
    company_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create Bin Locations table
CREATE TABLE IF NOT EXISTS bin_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bin_location TEXT NOT NULL,
    warehouse_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Insert sample data
INSERT OR IGNORE INTO companies (company_code, company_name) VALUES
    ('COMP001', 'Company 1'),
    ('COMP002', 'Company 2'),
    ('COMP003', 'Company 3');

INSERT OR IGNORE INTO warehouses (warehouse_number, warehouse_name, company_id) VALUES
    ('WH001', 'Warehouse A', 1),
    ('WH002', 'Warehouse B', 1),
    ('WH003', 'Warehouse C', 2);

INSERT OR IGNORE INTO bin_locations (bin_location, warehouse_id) VALUES
    ('A1', 1),
    ('A2', 1),
    ('B1', 2),
    ('B2', 2);

INSERT OR IGNORE INTO stock_items (item_name, quantity, location, date, notes) VALUES
    ('Widget A', 10, 'Warehouse A', '2024-01-15', 'Initial stock'),
    ('Widget B', 5, 'Warehouse B', '2024-01-15', 'Restocked'),
    ('Widget C', 20, 'Warehouse A', '2024-01-16', 'New item');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_items_date ON stock_items(date);
CREATE INDEX IF NOT EXISTS idx_stock_items_location ON stock_items(location);
CREATE INDEX IF NOT EXISTS idx_stock_items_item_name ON stock_items(item_name);

