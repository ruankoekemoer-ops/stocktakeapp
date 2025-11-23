# 🌐 Host Frontend at Worker URL

Your app will be hosted at: **https://stock-take-api.rkoekemoer.workers.dev**

The Worker now serves both:
- **Frontend** (HTML/CSS/JS) at `/`
- **API** at `/api/*`

## Quick Deploy

```bash
cd cloudflare-worker
npm run deploy
```

This will:
1. Embed static files into the Worker
2. Deploy to `https://stock-take-api.rkoekemoer.workers.dev`

## How It Works

1. **Static Files**: HTML, CSS, and JS are embedded in the Worker code
2. **Same Domain**: Frontend and API use the same domain (no CORS issues!)
3. **Auto Config**: `config.js` automatically uses the same domain for API calls

## Routes

- `https://stock-take-api.rkoekemoer.workers.dev/` - Frontend app
- `https://stock-take-api.rkoekemoer.workers.dev/api/items` - API endpoints
- `https://stock-take-api.rkoekemoer.workers.dev/css/style.css` - Styles
- `https://stock-take-api.rkoekemoer.workers.dev/js/app.js` - App logic

## Update Files

If you change frontend files:
1. Edit files in `stock-take-app/`
2. Run `npm run build` (or `npm run deploy` which includes build)
3. Files are automatically embedded

## Benefits

✅ **No CORS issues** - Same domain for frontend and API  
✅ **Single deployment** - One Worker serves everything  
✅ **Fast** - No external requests needed  
✅ **Simple** - One URL for everything  

## Test

After deployment:
1. Visit: `https://stock-take-api.rkoekemoer.workers.dev`
2. You should see the Stock Take app
3. API calls will work automatically (same domain)

