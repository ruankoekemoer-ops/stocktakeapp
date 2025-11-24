/**
 * Script to import items from Excel file into items_catalog table
 * 
 * Usage:
 * 1. Convert Excel file to CSV first (or use a library like xlsx)
 * 2. Update the CSV_FILE_PATH below
 * 3. Run: node import-items-from-excel.js
 * 
 * Or use the API directly:
 * POST /api/items-catalog with body: { stock_code, item_name, requires_serial_number }
 */

const fs = require('fs');
const path = require('path');

// Use node-fetch for Node.js (fetch is not available in older Node versions)
let fetch;
try {
    // Try to use built-in fetch (Node 18+)
    if (typeof globalThis.fetch === 'function') {
        fetch = globalThis.fetch;
    } else if (typeof fetch === 'function') {
        fetch = fetch;
    } else {
        // Fall back to node-fetch if available
        try {
            fetch = require('node-fetch');
        } catch (e) {
            // If node-fetch is not installed, try to use https module
            console.error('Error: fetch is not available.');
            console.error('Please install node-fetch: npm install node-fetch');
            console.error('Or use Node.js 18+ which has built-in fetch');
            process.exit(1);
        }
    }
} catch (e) {
    console.error('Error: fetch is not available. Please install node-fetch:');
    console.error('  npm install node-fetch');
    process.exit(1);
}

// Configuration
const CSV_FILE_PATH = path.join(__dirname, '../.github/Files/Item\'s for count.csv');
const API_URL = 'https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog';

// Expected CSV format:
// Alternative New Code, D365 Name, Serial Required
// Example:
// 1050003160, "NOZZLE, CUTTING, 0F HARRIS", Yes
// 1050003260, 1F Cutting Nozzle, no

async function importItems() {
    try {
        // Read CSV file
        const resolvedPath = path.resolve(CSV_FILE_PATH);
        console.log(`Looking for CSV file at: ${resolvedPath}`);
        
        if (!fs.existsSync(resolvedPath)) {
            console.error(`CSV file not found: ${resolvedPath}`);
            console.log(`Current working directory: ${process.cwd()}`);
            console.log(`Script directory: ${__dirname}`);
            console.log('Please check the file path.');
            return;
        }

        console.log(`Reading CSV file: ${resolvedPath}`);
        const csvContent = fs.readFileSync(resolvedPath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        // Skip header row (Alternative New Code, D365 Name, Serial Required)
        const dataLines = lines.slice(1);
        
        console.log(`Found ${dataLines.length} items to import...`);
        console.log('Starting import (this may take a while for large files)...\n');
        
        let successCount = 0;
        let errorCount = 0;
        let skipCount = 0;
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i].trim();
            if (!line) continue;
            
            // Parse CSV line (handles quoted values)
            const columns = parseCSVLine(line);
            
            if (columns.length < 2) {
                console.warn(`Skipping line ${i + 2}: insufficient columns (found ${columns.length})`);
                skipCount++;
                continue;
            }
            
            const stockCode = columns[0].trim();
            const itemName = columns[1].trim();
            // Handle "Yes", "yes", "Y", "1" as true, everything else as false
            const serialValue = columns.length > 2 ? columns[2].trim() : '';
            const requiresSerial = serialValue && (
                serialValue.toUpperCase() === 'Y' || 
                serialValue === '1' || 
                serialValue.toLowerCase() === 'yes'
            );
            
            if (!stockCode || !itemName) {
                console.warn(`Skipping line ${i + 2}: missing stock code or item name`);
                skipCount++;
                continue;
            }
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        stock_code: stockCode,
                        item_name: itemName,
                        requires_serial_number: requiresSerial
                    })
                });
                
                if (response.ok) {
                    if ((i + 1) % 100 === 0) {
                        console.log(`Progress: ${i + 1}/${dataLines.length} items processed...`);
                    }
                    successCount++;
                } else {
                    const errorData = await response.json().catch(() => ({ error: response.statusText }));
                    if (response.status === 409) {
                        // Already exists - not an error
                        skipCount++;
                    } else {
                        console.error(`✗ Failed to import ${stockCode}: ${errorData.error || response.statusText} (Status: ${response.status})`);
                        errorCount++;
                    }
                }
            } catch (error) {
                console.error(`✗ Error importing ${stockCode}:`, error.message);
                errorCount++;
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log('\n=== Import Summary ===');
        console.log(`Successfully imported: ${successCount}`);
        console.log(`Skipped (duplicates/empty): ${skipCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Total processed: ${dataLines.length}`);
        
    } catch (error) {
        console.error('Import failed:', error);
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Run import
if (require.main === module) {
    importItems().catch(console.error);
}

module.exports = { importItems, parseCSVLine };

