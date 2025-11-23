-- Check database state for stock takes
-- Run this with: wrangler d1 execute stocktakedata --file=./check-database.sql --remote

-- Check if stock_takes table exists and its structure
SELECT sql FROM sqlite_master WHERE type='table' AND name='stock_takes';

-- Check all open stock takes
SELECT 
    st.id,
    st.company_id,
    st.warehouse_id,
    st.status,
    st.opened_at,
    c.company_name,
    w.warehouse_name,
    m.manager_name as opened_by_name
FROM stock_takes st
LEFT JOIN companies c ON st.company_id = c.id
LEFT JOIN warehouses w ON st.warehouse_id = w.id
LEFT JOIN warehouse_managers m ON st.opened_by_manager_id = m.id
WHERE st.status = 'open'
ORDER BY st.opened_at DESC;

-- Check bin locations and their company/warehouse
SELECT 
    b.id,
    b.bin_code,
    b.warehouse_id,
    w.warehouse_name,
    w.company_id,
    c.company_name
FROM bin_locations b
LEFT JOIN warehouses w ON b.warehouse_id = w.id
LEFT JOIN companies c ON w.company_id = c.id
ORDER BY b.bin_code;

-- Check companies
SELECT id, company_code, company_name FROM companies;

-- Check warehouses
SELECT id, warehouse_code, warehouse_name, company_id FROM warehouses;

