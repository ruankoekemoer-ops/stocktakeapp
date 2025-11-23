# Stock Take App

A simple web application to enter stock items and view database contents.

## Features

✅ **Add Stock Items** - Enter item number and quantity  
✅ **View All Items** - Browse items in the database  
✅ **Search Items** - Real-time search functionality  
✅ **Update Items** - Modify quantities  
✅ **Delete Items** - Remove items from database  

## Quick Start

### Step 1: Start the SQL Server

In the `sql-server` folder:
```bash
cd sql-server
python3 server.py
```

The server should start on `http://localhost:5000`

### Step 2: Open the App

1. Open `index.html` in your web browser
2. Or use a local server:
   ```bash
   # Python
   python3 -m http.server 8000
   
   # Then open: http://localhost:8000
   ```

### Step 3: Use the App

1. **Add Stock Tab:**
   - Enter item number
   - Enter quantity
   - Optionally add location and notes
   - Click "Add to Database"

2. **View Items Tab:**
   - See all items in the database
   - Search for specific items
   - Update or delete items

## How It Works

1. **Frontend:** HTML/CSS/JavaScript web app
2. **Backend:** Python Flask REST API server
3. **Database:** SQLite (file-based)

## API Connection

The app connects to: `http://localhost:5000/api`

Make sure the SQL server is running before using the app!

## File Structure

```
stock-take-app/
├── index.html      # Main app page
├── css/
│   └── style.css  # Styling
├── js/
│   ├── config.js  # Configuration
│   └── app.js     # Application logic
└── README.md      # This file
```

## Troubleshooting

### "Failed to fetch" error
- Make sure SQL server is running: `python3 server.py`
- Check server is on port 5000
- Check browser console (F12) for errors

### "Server error"
- Verify SQL server is running
- Check `sql-server/server.py` is started
- Try accessing `http://localhost:5000` directly

### Items not showing
- Check database has data
- Click "Refresh" button
- Check browser console for errors

## Next Steps

- Add barcode scanning
- Export to CSV/Excel
- Add filters (by date, location)
- Add charts/statistics
- Connect to SharePoint

