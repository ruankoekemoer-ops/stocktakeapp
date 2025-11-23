# Simple Local SQL Server

A lightweight SQL server using SQLite with a REST API interface.

## Features

✅ **SQLite Database** - File-based, no installation needed  
✅ **REST API** - Easy to use HTTP endpoints  
✅ **CORS Enabled** - Works with web apps  
✅ **Simple Setup** - Just run one command  

## Quick Start

### Step 1: Install Dependencies

```bash
cd sql-server
pip3 install -r requirements.txt
```

### Step 2: Run the Server

```bash
python3 server.py
```

The server will start on: `http://localhost:5000`

### Step 3: Test the API

Open your browser and go to: `http://localhost:5000`

Or use curl:
```bash
curl http://localhost:5000/api/items
```

## API Endpoints

### Items

- `GET /api/items` - Get all items
  - Query params: `?search=term&location=warehouse&limit=10`
- `GET /api/items/<id>` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/<id>` - Update item
- `DELETE /api/items/<id>` - Delete item

### Reference Data

- `GET /api/companies` - Get all companies
- `GET /api/warehouses` - Get all warehouses

## Example Usage

### Get all items:
```bash
curl http://localhost:5000/api/items
```

### Search items:
```bash
curl "http://localhost:5000/api/items?search=widget"
```

### Create item:
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "New Item",
    "quantity": 10,
    "location": "Warehouse A",
    "date": "2024-01-15",
    "notes": "Test item"
  }'
```

### Update item:
```bash
curl -X PUT http://localhost:5000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 20
  }'
```

### Delete item:
```bash
curl -X DELETE http://localhost:5000/api/items/1
```

## Database Schema

### stock_items
- `id` - Primary key
- `item_name` - Item name
- `quantity` - Stock quantity
- `location` - Storage location
- `date` - Date
- `notes` - Additional notes
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### companies
- `id` - Primary key
- `company_code` - Unique company code
- `company_name` - Company name

### warehouses
- `id` - Primary key
- `warehouse_number` - Unique warehouse number
- `warehouse_name` - Warehouse name
- `company_id` - Foreign key to companies

### bin_locations
- `id` - Primary key
- `bin_location` - Bin location code
- `warehouse_id` - Foreign key to warehouses

## Database File

The database is stored in: `stocktake.db`

This is a SQLite file - you can:
- View it with any SQLite browser
- Backup by copying the file
- Delete to reset the database

## Using with Web Apps

The server has CORS enabled, so you can use it from any web app:

```javascript
// Fetch items
fetch('http://localhost:5000/api/items')
  .then(res => res.json())
  .then(data => console.log(data));

// Create item
fetch('http://localhost:5000/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    item_name: 'New Item',
    quantity: 10
  })
});
```

## Customization

### Change Port

Edit `server.py`:
```python
app.run(debug=True, host='0.0.0.0', port=8080)  # Change 5000 to 8080
```

### Add More Tables

1. Add SQL to `setup.sql`
2. Add API endpoints to `server.py`
3. Restart server

### Change Database Location

Edit `server.py`:
```python
DB_FILE = '/path/to/your/database.db'
```

## Alternative: Full SQL Server

If you need MySQL or PostgreSQL instead:

### MySQL:
```bash
brew install mysql
mysql.server start
mysql -u root -e "CREATE DATABASE stocktake;"
```

### PostgreSQL:
```bash
brew install postgresql
brew services start postgresql
createdb stocktake
```

Then modify `server.py` to use the appropriate database connector.

## Troubleshooting

### Port already in use
- Change port in `server.py`
- Or kill the process using port 5000

### Database locked
- Close any SQLite browsers
- Restart the server

### Import errors
- Make sure you installed requirements: `pip3 install -r requirements.txt`

## Next Steps

- Connect your web app to this API
- Add authentication
- Add more endpoints
- Export data to CSV/Excel

