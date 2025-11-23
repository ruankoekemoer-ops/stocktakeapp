# Cloudflare Pages Deployment

This directory contains configuration for deploying the frontend to Cloudflare Pages.

## Quick Setup via Dashboard

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** > **Create** > **Pages** > **Connect to Git**
3. Select repository: `ruankoekemoer-ops/stocktakeapp`
4. Configure:
   - **Project name**: `stock-take-app`
   - **Production branch**: `main`
   - **Root directory**: `stock-take-app`
   - **Build command**: (leave empty)
   - **Build output directory**: `/`

## Manual Deployment

```bash
cd stock-take-app
npx wrangler pages deploy . --project-name=stock-take-app
```

## Environment Variables

Set in Cloudflare Dashboard under Pages > Settings > Environment Variables:
- `API_URL` - Your Worker API URL (optional, can be hardcoded in config.js)

