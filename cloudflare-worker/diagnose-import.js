/**
 * Diagnostic script to identify import issues
 */

const fs = require('fs');
const path = require('path');

console.log('=== Import Diagnostic Tool ===\n');

// Check 1: File path
console.log('1. Checking CSV file path...');
const CSV_FILE_PATH = path.join(__dirname, '../.github/Files/Item\'s for count.csv');
const resolvedPath = path.resolve(CSV_FILE_PATH);
console.log(`   Expected path: ${resolvedPath}`);
console.log(`   File exists: ${fs.existsSync(resolvedPath) ? '✓ YES' : '✗ NO'}`);

if (fs.existsSync(resolvedPath)) {
    const stats = fs.statSync(resolvedPath);
    console.log(`   File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Readable: ${fs.accessSync ? '✓' : '?'}`);
}

// Check 2: CSV format
console.log('\n2. Checking CSV format...');
if (fs.existsSync(resolvedPath)) {
    try {
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        console.log(`   Total lines: ${lines.length}`);
        if (lines.length > 0) {
            console.log(`   Header: ${lines[0]}`);
            if (lines.length > 1) {
                const firstLine = lines[1];
                const columns = firstLine.split(',');
                console.log(`   First line columns: ${columns.length}`);
                console.log(`   First line preview: ${firstLine.substring(0, 80)}...`);
            }
        }
    } catch (error) {
        console.log(`   ✗ Error reading file: ${error.message}`);
    }
} else {
    console.log('   ⚠ Skipping (file not found)');
}

// Check 3: Fetch availability
console.log('\n3. Checking fetch API...');
try {
    if (typeof globalThis.fetch === 'function') {
        console.log('   ✓ Built-in fetch available (Node.js 18+)');
        console.log(`   Node version: ${process.version}`);
    } else {
        try {
            require('node-fetch');
            console.log('   ✓ node-fetch package available');
        } catch (e) {
            console.log('   ✗ fetch not available');
            console.log('   Solution: npm install node-fetch');
        }
    }
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
}

// Check 4: Database table (via API)
console.log('\n4. Checking API and database...');
const API_URL = 'https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog';

(async () => {
    try {
        let fetch;
        if (typeof globalThis.fetch === 'function') {
            fetch = globalThis.fetch;
        } else {
            try {
                fetch = require('node-fetch');
            } catch (e) {
                console.log('   ✗ Cannot test API (fetch not available)');
                console.log('\n=== Summary ===');
                console.log('Please install node-fetch: npm install node-fetch');
                return;
            }
        }
        
        // Test GET (should work even if table is empty)
        const response = await fetch(API_URL);
        console.log(`   API Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✓ API is working`);
            console.log(`   Current items in catalog: ${Array.isArray(data) ? data.length : 'unknown'}`);
        } else if (response.status === 404) {
            console.log('   ⚠ API returned 404 - endpoint might not exist');
            console.log('   Make sure the Worker is deployed with latest code');
        } else {
            const text = await response.text();
            console.log(`   ⚠ API returned: ${response.status}`);
            console.log(`   Response: ${text.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ✗ Cannot connect to API: ${error.message}`);
        console.log('   Make sure:');
        console.log('   1. Cloudflare Worker is deployed');
        console.log('   2. Internet connection is working');
        console.log('   3. API URL is correct');
    }
    
    // Final summary
    console.log('\n=== Diagnostic Summary ===');
    console.log('\nCommon issues and solutions:');
    console.log('\n1. "File not found"');
    console.log('   → Make sure CSV file is at: .github/Files/Item\'s for count.csv');
    console.log('   → Run from cloudflare-worker directory');
    
    console.log('\n2. "fetch is not available"');
    console.log('   → Run: npm install node-fetch');
    console.log('   → Or use Node.js 18+');
    
    console.log('\n3. "Table not found" or "404"');
    console.log('   → Create table: npx wrangler d1 execute stocktakedata --file=./add-items-catalog.sql --remote');
    
    console.log('\n4. "Cannot connect to API"');
    console.log('   → Deploy worker: npm run deploy');
    console.log('   → Check internet connection');
    
    console.log('\n5. Import script errors');
    console.log('   → Check the exact error message above');
    console.log('   → Make sure database table exists');
    console.log('   → Verify CSV format matches expected columns');
})();

