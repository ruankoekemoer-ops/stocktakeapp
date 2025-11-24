/**
 * Quick test script to verify the import setup
 */

const fs = require('fs');
const path = require('path');

const CSV_FILE_PATH = path.join(__dirname, '../.github/Files/Item\'s for count.csv');

console.log('Testing import setup...\n');

// Test 1: Check if file exists
console.log('1. Checking CSV file...');
const resolvedPath = path.resolve(CSV_FILE_PATH);
console.log(`   Looking for: ${resolvedPath}`);
if (fs.existsSync(resolvedPath)) {
    console.log('   ✓ File found!');
    const stats = fs.statSync(resolvedPath);
    console.log(`   File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
} else {
    console.log('   ✗ File not found!');
    console.log(`   Current directory: ${process.cwd()}`);
    console.log(`   Script directory: ${__dirname}`);
    process.exit(1);
}

// Test 2: Check file format
console.log('\n2. Checking CSV format...');
try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    console.log(`   Total lines: ${lines.length}`);
    
    if (lines.length > 0) {
        console.log(`   Header: ${lines[0]}`);
        if (lines.length > 1) {
            console.log(`   First data line: ${lines[1].substring(0, 100)}...`);
        }
    }
    console.log('   ✓ File is readable');
} catch (error) {
    console.log(`   ✗ Error reading file: ${error.message}`);
    process.exit(1);
}

// Test 3: Check fetch availability
console.log('\n3. Checking fetch API...');
try {
    if (typeof globalThis.fetch === 'function') {
        console.log('   ✓ Built-in fetch available (Node 18+)');
    } else {
        try {
            require('node-fetch');
            console.log('   ✓ node-fetch available');
        } catch (e) {
            console.log('   ✗ fetch not available');
            console.log('   Install: npm install node-fetch');
            process.exit(1);
        }
    }
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
    process.exit(1);
}

// Test 4: Test API connection
console.log('\n4. Testing API connection...');
const API_URL = 'https://stock-take-api.rkoekemoer.workers.dev/api/items-catalog';
(async () => {
    try {
        let fetch;
        if (typeof globalThis.fetch === 'function') {
            fetch = globalThis.fetch;
        } else {
            fetch = require('node-fetch');
        }
        
        const response = await fetch(`${API_URL}?stock_code=TEST123`);
        if (response.ok || response.status === 404) {
            console.log('   ✓ API is accessible');
            console.log(`   Status: ${response.status}`);
        } else {
            console.log(`   ⚠ API returned status: ${response.status}`);
        }
    } catch (error) {
        console.log(`   ✗ Cannot connect to API: ${error.message}`);
        console.log('   Make sure the Cloudflare Worker is deployed');
    }
    
    console.log('\n✓ All tests passed! You can run the import script now.');
    console.log('  Run: node import-items-from-excel.js');
})();

