-- Migration script to add System Admin access tables
-- Run this with: wrangler d1 execute stocktakedata --file=./add-access-tables.sql --remote

-- Manager-Company Access table (System Admin)
CREATE TABLE IF NOT EXISTS manager_company_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manager_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (manager_id) REFERENCES warehouse_managers(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE(manager_id, company_id)
);

-- Counter-Company Access table (System Admin)
CREATE TABLE IF NOT EXISTS counter_company_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    counter_email TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE(counter_email, company_id)
);

-- Create indexes for access tables
CREATE INDEX IF NOT EXISTS idx_manager_access_manager ON manager_company_access(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_access_company ON manager_company_access(company_id);
CREATE INDEX IF NOT EXISTS idx_counter_access_email ON counter_company_access(counter_email);
CREATE INDEX IF NOT EXISTS idx_counter_access_company ON counter_company_access(company_id);

