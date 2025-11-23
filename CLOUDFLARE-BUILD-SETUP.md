# 🔧 Cloudflare Build Command Setup

## For Cloudflare Workers (Your Current Setup)

Since you're using **Cloudflare Workers** to serve both frontend and API, you need a build step.

### Option 1: GitHub Actions (Already Updated)

The GitHub Actions workflow now includes the build step automatically:
- ✅ Installs dependencies
- ✅ Runs `npm run build` (embeds static files)
- ✅ Deploys Worker

No additional setup needed if using GitHub Actions!

### Option 2: Cloudflare Dashboard - Connect to Git

If you connected the Worker to GitHub via Cloudflare Dashboard:

1. Go to: **Workers & Pages** > **stock-take-api** > **Settings** > **Builds & deployments**

2. Add build command:
   ```
   npm install && npm run build
   ```

3. Or set in `wrangler.toml`:
   ```toml
   [build]
   command = "npm install && npm run build"
   ```

### Option 3: Manual Deployment

When deploying manually, always run build first:

```bash
cd cloudflare-worker
npm run build
npm run deploy
```

Or use the combined command:
```bash
npm run deploy  # This runs build automatically
```

## For Cloudflare Pages (If Using Separately)

If you're using Cloudflare Pages for the frontend separately:

1. Go to: **Workers & Pages** > **stock-take-app** > **Settings** > **Builds & deployments**

2. Build command: (leave empty - static files, no build needed)

3. Build output directory: `/`

## Current Setup

You're using **Cloudflare Workers** which serves everything from:
- **URL**: `https://stock-take-api.rkoekemoer.workers.dev`
- **Build needed**: Yes (embeds static files into Worker)
- **Build command**: `npm run build` (runs `node build-static-files.js`)

## What the Build Does

The build script (`build-static-files.js`):
1. Reads HTML, CSS, and JS files from `stock-take-app/`
2. Embeds them into `src/static-files.js`
3. Worker serves these embedded files

## Verify Build Works

After deployment, check:
- `https://stock-take-api.rkoekemoer.workers.dev/` - Should show app (not API JSON)
- `https://stock-take-api.rkoekemoer.workers.dev/api` - Should show API info

If you see API JSON at root, the build didn't run - check build logs in Cloudflare dashboard.

