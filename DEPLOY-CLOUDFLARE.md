# 🚀 Deploy to Cloudflare D1 Database

This guide will help you deploy the Stock Take App to use your Cloudflare D1 database.

## Prerequisites

1. **Cloudflare Account** with D1 database created
2. **Database ID**: `7b0985e4-b27d-4c39-9438-0b638ae8b469` (already configured)
3. **Wrangler CLI** installed

## Step 1: Install Wrangler

```bash
npm install -g wrangler
```

Or install locally in the cloudflare-worker directory:

```bash
cd cloudflare-worker
npm install
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

## Step 3: Set Up Database Schema

Initialize your D1 database with the required tables:

```bash
cd cloudflare-worker
wrangler d1 execute 7b0985e4-b27d-4c39-9438-0b638ae8b469 --file=./schema.sql
```

Or if you prefer using the database name:

```bash
# First, find your database name in Cloudflare dashboard
# Then run:
wrangler d1 execute <your-database-name> --file=./schema.sql
```

## Step 4: Deploy the Worker

```bash
cd cloudflare-worker
npm run deploy
```

After deployment, you'll see output like:

```
✨  Deployed stock-take-api
   https://stock-take-api.your-subdomain.workers.dev
```

**Copy this URL!** You'll need it for the next step.

## Step 5: Update Frontend Configuration

1. Open `stock-take-app/js/config.js`
2. Replace the `apiUrl` with your Worker URL:

```javascript
const CONFIG = {
    apiUrl: 'https://stock-take-api.your-subdomain.workers.dev/api',
    // Remove or comment out the localhost line
    defaultDate: new Date().toISOString().split('T')[0]
};
```

## Step 6: Test the Connection

1. Open your `stock-take-app/index.html` in a browser
2. Try adding a stock item
3. Check the "View Items" tab to see if it appears

## Troubleshooting

### "Database not found" error
- Verify the database ID in `wrangler.toml` matches your Cloudflare D1 database
- Check your Cloudflare dashboard: Workers & Pages > D1 > Your Database

### "Table doesn't exist" error
- Run the schema migration: `wrangler d1 execute <db-id> --file=./schema.sql`
- Verify the schema was created: `wrangler d1 execute <db-id> --command="SELECT name FROM sqlite_master WHERE type='table';"`

### CORS errors
- The Worker already includes CORS headers
- Make sure you're using the correct Worker URL (with `/api` at the end)

### Worker deployment fails
- Check you're logged in: `wrangler whoami`
- Verify your account has Workers access
- Check the Worker name doesn't conflict with existing Workers

## Local Development

To test locally before deploying:

```bash
cd cloudflare-worker
npm run dev
```

This will start a local development server. You can test it at `http://localhost:8787`

## Verify Database Connection

Test the API directly:

```bash
# Get all items
curl https://your-worker-url.workers.dev/api/items

# Create an item
curl -X POST https://your-worker-url.workers.dev/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Item",
    "quantity": 10,
    "location": "Warehouse A"
  }'
```

## Next Steps

- ✅ Your app is now using Cloudflare D1!
- ✅ Data persists in the cloud
- ✅ Accessible from anywhere
- ✅ No local server needed

## Rollback to Local Server

If you need to switch back to the local SQL server:

1. Update `stock-take-app/js/config.js`:
   ```javascript
   apiUrl: 'http://localhost:5000/api',
   ```

2. Start the local server:
   ```bash
   cd sql-server
   python3 server.py
   ```

