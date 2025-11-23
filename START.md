# 🚀 Quick Start Guide

## Stock Take App - Complete Setup

### Step 1: Start the SQL Server

Open a terminal and run:

```bash
cd sql-server
python3 server.py
```

You should see:
```
Starting SQL Server on http://localhost:5000
API Documentation: http://localhost:5000
```

**Keep this terminal open!** The server needs to keep running.

### Step 2: Open the Web App

#### Option A: Direct File (Simple)
1. Open `stock-take-app/index.html` in your web browser
2. Double-click the file or drag it into your browser

#### Option B: Local Server (Recommended)
Open a **new terminal** and run:

```bash
cd stock-take-app
python3 -m http.server 8000
```

Then open: **http://localhost:8000** in your browser

### Step 3: Use the App

1. **Add Stock Tab:**
   - Enter an item number (e.g., "ITEM001")
   - Enter quantity
   - Optionally add location and notes
   - Click "Add to Database"

2. **View Items Tab:**
   - See all items in the database
   - Use the search box to find items
   - Click "Update" to change quantity
   - Click "Delete" to remove items

## Troubleshooting

### "Failed to fetch" or "Error loading items"
- ✅ Make sure SQL server is running (Step 1)
- ✅ Check server is on `http://localhost:5000`
- ✅ Open browser console (F12) to see detailed errors

### Server won't start
- ✅ Install Flask: `pip3 install flask flask-cors`
- ✅ Check Python version: `python3 --version` (should be 3.6+)

### Items not showing
- ✅ Click "Refresh" button
- ✅ Check database file exists: `sql-server/stocktake.db`
- ✅ Try adding a new item first

## File Structure

```
Sharepoint Test/
├── sql-server/          # Backend API server
│   ├── server.py       # Flask REST API
│   ├── setup.sql       # Database schema
│   └── stocktake.db    # SQLite database (created automatically)
│
└── stock-take-app/      # Frontend web app
    ├── index.html      # Main app page
    ├── css/
    │   └── style.css   # Styling
    └── js/
        ├── config.js   # Configuration
        └── app.js      # App logic
```

## What's Next?

- ✅ Add barcode scanning
- ✅ Export to CSV/Excel
- ✅ Add date filters
- ✅ Connect to SharePoint
- ✅ Add user authentication

Enjoy your stock take app! 📦

