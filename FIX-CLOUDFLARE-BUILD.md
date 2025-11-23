# 🔧 Fix Cloudflare Build Error

The build failed because Cloudflare is running the deploy command from the wrong directory.

## The Problem

Cloudflare is running `npx wrangler deploy` from the repository root, but `wrangler.toml` is in the `cloudflare-worker/` directory.

## Solution: Update Build Command in Cloudflare Dashboard

### Step 1: Go to Cloudflare Dashboard

1. Visit: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** > **stock-take-api** > **Settings** > **Builds & deployments**

### Step 2: Update Build Command

Change the build command to:

```bash
cd cloudflare-worker && npm install && npm run build && npx wrangler deploy
```

Or if you have a separate build command field:

**Build command:**
```bash
cd cloudflare-worker && npm install && npm run build
```

**Deploy command:**
```bash
cd cloudflare-worker && npx wrangler deploy
```

### Step 3: Update Root Directory (if available)

If there's a "Root directory" setting:
- Set it to: `cloudflare-worker`

## Alternative: Use GitHub Actions

The GitHub Actions workflow is already configured correctly and will work automatically. You can disable Cloudflare's automatic builds and rely on GitHub Actions instead.

## Verify Configuration

After updating, the build should:
1. ✅ Change to `cloudflare-worker` directory
2. ✅ Install dependencies (`npm install`)
3. ✅ Build static files (`npm run build`)
4. ✅ Deploy Worker (`npx wrangler deploy`)

## Quick Fix Command

If you can set a custom deploy command in Cloudflare Dashboard, use:

```bash
cd cloudflare-worker && npm install && npm run build && npx wrangler deploy
```

This ensures everything runs from the correct directory.

