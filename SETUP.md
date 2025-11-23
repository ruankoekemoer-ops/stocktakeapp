# 🚀 Setup Guide - Simple Read-Only Stock Take App

This app reads data from your Cloudflare D1 database. Follow these steps:

## Step 1: Deploy the Cloudflare Worker

The Worker connects your app to the D1 database.

### 1.1 Install Wrangler CLI

```bash
npm install -g wrangler
```

### 1.2 Login to Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate.

### 1.3 Set Up Database Schema

Create the table in your D1 database:

```bash
cd cloudflare-worker
wrangler d1 execute 7b0985e4-b27d-4c39-9438-0b638ae8b469 --file=./schema.sql
```

### 1.4 Deploy the Worker

```bash
cd cloudflare-worker
npm install
npm run deploy
```

**IMPORTANT:** After deployment, you'll see a URL like:
```
✨  Deployed stock-take-api
   https://stock-take-api.abc123.workers.dev
```

**Copy this URL!** You'll need it in Step 2.

## Step 2: Update Frontend Configuration

1. Open `stock-take-app/js/config.js`
2. Find this line:
   ```javascript
   apiUrl: 'YOUR_WORKER_URL_HERE/api',
   ```
3. Replace `YOUR_WORKER_URL_HERE` with your Worker URL from Step 1.4
4. It should look like:
   ```javascript
   apiUrl: 'https://stock-take-api.abc123.workers.dev/api',
   ```
   (Use YOUR actual URL, not this example!)

## Step 3: Open the App

1. Open `stock-take-app/index.html` in your web browser
2. The app will automatically load items from your database
3. Use the search box to filter items

## That's It! ✅

Your app is now reading from your Cloudflare D1 database.

## Troubleshooting

### "Error loading items"
- ✅ Check that the Worker URL in `config.js` is correct
- ✅ Make sure you deployed the Worker (Step 1.4)
- ✅ Verify the database schema was created (Step 1.3)

### "Table doesn't exist"
- ✅ Run the schema command again:
  ```bash
  cd cloudflare-worker
  wrangler d1 execute 7b0985e4-b27d-4c39-9438-0b638ae8b469 --file=./schema.sql
  ```

### Worker deployment fails
- ✅ Make sure you're logged in: `wrangler whoami`
- ✅ Check your Cloudflare account has Workers access

## Test the API Directly

You can test if the Worker is working:

```bash
curl https://your-worker-url.workers.dev/api/items
```

Replace `your-worker-url` with your actual Worker URL.

## What the App Does

- ✅ **Reads** items from your Cloudflare D1 database
- ✅ **Displays** all items with details (name, quantity, location, notes)
- ✅ **Searches** items by name, location, or notes
- ✅ **Refreshes** data with the Refresh button
- ❌ **No editing** - This is a read-only app

## Need Help?

- Check the browser console (F12) for error messages
- Verify the Worker URL is correct
- Make sure the database has data (you can add data via the Cloudflare dashboard or API)

