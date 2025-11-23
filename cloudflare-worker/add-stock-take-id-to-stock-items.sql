-- Add stock_take_id column to stock_items table if it doesn't exist
-- Run this with: wrangler d1 execute stocktakedata --file=./add-stock-take-id-to-stock-items.sql --remote

-- Check if column exists and add it if not
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN, so we'll just add it
-- If it already exists, this will fail but that's OK - we can ignore the error

ALTER TABLE stock_items ADD COLUMN stock_take_id INTEGER;

-- Add foreign key constraint
-- Note: SQLite doesn't support adding foreign keys after table creation easily
-- But we can add the index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_items_stock_take ON stock_items(stock_take_id);

