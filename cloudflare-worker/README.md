# Cloudflare Worker API for Stock Take App

This Cloudflare Worker provides a REST API that connects to your Cloudflare D1 database.

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
# or
npm install wrangler --save-dev
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Initialize Database Schema

Make sure your D1 database is set up with the schema:

```bash
wrangler d1 execute stock-take-db --file=./schema.sql
```

Or if your database has a different name, use:

```bash
wrangler d1 execute <your-database-name> --file=./schema.sql
```

### 4. Deploy the Worker

```bash
npm install
npm run deploy
```

After deployment, you'll get a URL like: `https://stock-take-api.your-subdomain.workers.dev`

### 5. Update Frontend Config

Update `stock-take-app/js/config.js` with your Worker URL:

```javascript
const CONFIG = {
    apiUrl: 'https://stock-take-api.your-subdomain.workers.dev/api',
    // ...
};
```

## Development

### Run locally

```bash
npm run dev
```

This will start a local development server. You'll need to bind your D1 database:

```bash
wrangler dev --remote
```

Or use a local D1 database:

```bash
wrangler d1 create stock-take-db --local
wrangler dev
```

### Test the API

```bash
# Get all items
curl https://your-worker-url.workers.dev/api/items

# Create item
curl -X POST https://your-worker-url.workers.dev/api/items \
  -H "Content-Type: application/json" \
  -d '{"item_name": "Test Item", "quantity": 10}'
```

## API Endpoints

- `GET /api/items` - Get all items (supports `?search=term&location=warehouse`)
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

## Database Configuration

The database ID is configured in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "stock-take-db"
database_id = "7b0985e4-b27d-4c39-9438-0b638ae8b469"
```

Make sure this matches your Cloudflare D1 database ID.

## Troubleshooting

### Database not found
- Check the `database_id` in `wrangler.toml` matches your D1 database
- Verify the database exists in your Cloudflare dashboard

### CORS errors
- The Worker already includes CORS headers
- Make sure you're using the correct Worker URL in the frontend

### Schema errors
- Run the schema.sql file to create tables
- Check that the table structure matches what the Worker expects

