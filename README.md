# Stock Take App

A simple web application for managing stock items with Cloudflare D1 database integration.

## Features

✅ **View Items** - Browse all stock items from the database  
✅ **Add Items** - Create new stock items  
✅ **Update Items** - Edit existing items  
✅ **Search** - Real-time search functionality  
✅ **Cloudflare D1** - Serverless SQLite database  

## Project Structure

```
.
├── stock-take-app/          # Frontend web application
│   ├── index.html          # Main app page
│   ├── css/                # Stylesheets
│   └── js/                 # JavaScript files
│
├── cloudflare-worker/       # Backend API (Cloudflare Worker)
│   ├── src/index.js       # Worker API code
│   ├── schema.sql         # Database schema
│   └── wrangler.toml      # Worker configuration
│
└── sql-server/             # Local SQL server (alternative)
    ├── server.py          # Flask API server
    └── setup.sql          # Database schema
```

## Quick Start

### 1. Set Up Cloudflare D1 Database

```bash
cd cloudflare-worker
npx wrangler d1 execute stocktakedata --file=./schema.sql --remote
```

### 2. Deploy Cloudflare Worker

```bash
cd cloudflare-worker
npm install
npm run deploy
```

### 3. Update Frontend Config

Edit `stock-take-app/js/config.js` and set your Worker URL:

```javascript
apiUrl: 'https://your-worker-url.workers.dev/api',
```

### 4. Open the App

Open `stock-take-app/index.html` in your browser.

## Documentation

- `SETUP.md` - Detailed setup instructions
- `DEPLOY-CLOUDFLARE.md` - Cloudflare deployment guide
- `cloudflare-worker/README.md` - Worker documentation
- `stock-take-app/README.md` - Frontend documentation

## API Endpoints

- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

## Technologies

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Workers

## License

MIT

