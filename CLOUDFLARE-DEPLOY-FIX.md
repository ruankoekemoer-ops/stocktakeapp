# Fix Cloudflare Deploy Error

## Problem
Cloudflare is running the build command which includes `npx wrangler deploy`, and then trying to run a separate deploy command from the root directory, which fails.

## Solution

### Option 1: Update Build Command in Cloudflare Dashboard (Recommended)

1. Go to: **Workers & Pages** > **stock-take-api** > **Settings** > **Builds & deployments**

2. Update the build command to:
   ```bash
   cd cloudflare-worker && npm install && npm run build && npx wrangler deploy
   ```

3. **Remove or leave empty** the deploy command field (since deployment is already in the build command)

4. Save and redeploy

### Option 2: Separate Build and Deploy Commands

If you want to keep them separate:

**Build command:**
```bash
cd cloudflare-worker && npm install && npm run build
```

**Deploy command:**
```bash
cd cloudflare-worker && npx wrangler deploy
```

### Option 3: Update package.json Scripts

The current `package.json` has:
- `build`: `node build-static-files.js`
- `deploy`: `npm run build && wrangler deploy`

The build command in Cloudflare should be:
```bash
cd cloudflare-worker && npm install && npm run deploy
```

This will run both build and deploy in one command.

## Current Status

The first deployment in the build command is working fine. The error is from the second deploy command running from the wrong directory.

## Recommended Fix

Use **Option 1** - Update the Cloudflare Dashboard to only have the build command that includes deployment, and remove/empty the deploy command field.

