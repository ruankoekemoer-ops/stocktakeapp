# 🔗 Connect Cloudflare to GitHub Repository

This guide will help you connect your GitHub repository to Cloudflare for automatic deployments.

## Repository
**https://github.com/ruankoekemoer-ops/stocktakeapp**

## Option 1: Cloudflare Dashboard (Recommended - Easiest)

### For Cloudflare Workers:

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Navigate to: **Workers & Pages** > **Create** > **Connect to Git**

2. **Connect GitHub**
   - Click "Connect to Git"
   - Select your repository: `ruankoekemoer-ops/stocktakeapp`
   - Authorize Cloudflare to access your GitHub

3. **Configure Worker Deployment**
   - **Project name**: `stock-take-api`
   - **Production branch**: `main`
   - **Root directory**: `cloudflare-worker`
   - **Build command**: `npm install && npm run build`
   - **Deploy command**: `npx wrangler deploy`
   - **Build output directory**: (leave empty for Workers)

4. **Environment Variables** (if needed)
   - Add any environment variables in the Cloudflare dashboard

5. **Deploy**
   - Click "Save and Deploy"
   - Your Worker will deploy automatically on every push to `main`

### For Cloudflare Pages (Frontend):

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Navigate to: **Workers & Pages** > **Create** > **Pages** > **Connect to Git**

2. **Connect GitHub**
   - Select your repository: `ruankoekemoer-ops/stocktakeapp`
   - Authorize Cloudflare to access your GitHub

3. **Configure Pages Deployment**
   - **Project name**: `stock-take-app`
   - **Production branch**: `main`
   - **Root directory**: `stock-take-app`
   - **Build command**: (leave empty - static files)
   - **Build output directory**: `/` (root of stock-take-app)

4. **Deploy**
   - Click "Save and Deploy"
   - Your app will deploy automatically on every push to `main`

## Option 2: GitHub Actions (Already Configured)

I've created GitHub Actions workflows that will automatically deploy when you push to GitHub.

### Setup Required Secrets:

1. **Get Cloudflare API Token**
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Or create custom token with:
     - **Account**: `Workers Scripts:Edit`
     - **Zone**: `Workers Routes:Edit`
   - Copy the token

2. **Get Cloudflare Account ID**
   - Go to: https://dash.cloudflare.com
   - Right sidebar shows your **Account ID**

3. **Add Secrets to GitHub**
   - Go to: https://github.com/ruankoekemoer-ops/stocktakeapp/settings/secrets/actions
   - Click "New repository secret"
   - Add:
     - **Name**: `CLOUDFLARE_API_TOKEN`
     - **Value**: (your API token)
   - Add another:
     - **Name**: `CLOUDFLARE_ACCOUNT_ID`
     - **Value**: (your Account ID)

4. **Deploy**
   - Push to `main` branch
   - GitHub Actions will automatically deploy

## Option 3: Manual Deployment Script

If you prefer manual control, use the scripts:

```bash
# Deploy Worker
cd cloudflare-worker
npm install
npx wrangler deploy

# Deploy Pages
cd ../stock-take-app
npx wrangler pages deploy . --project-name=stock-take-app
```

## What Gets Deployed

### Cloudflare Worker (Backend API)
- **Location**: `cloudflare-worker/`
- **URL**: `https://stock-take-api.rkoekemoer.workers.dev`
- **Deploys**: When `cloudflare-worker/**` files change

### Cloudflare Pages (Frontend)
- **Location**: `stock-take-app/`
- **URL**: `https://stock-take-app.pages.dev` (or your custom domain)
- **Deploys**: When `stock-take-app/**` files change

## Automatic Deployment

Once set up, every time you:
1. Push to `main` branch
2. Cloudflare automatically:
   - Detects changes
   - Builds (if needed)
   - Deploys to production

## Update Frontend Config

After Pages deployment, update `stock-take-app/js/config.js`:

```javascript
const CONFIG = {
    // Use your deployed Worker URL
    apiUrl: 'https://stock-take-api.rkoekemoer.workers.dev/api',
};
```

## Troubleshooting

### "Authentication failed"
- Check API token permissions
- Verify Account ID is correct
- Ensure secrets are set in GitHub

### "Build failed"
- Check build logs in Cloudflare dashboard
- Verify Node.js version compatibility
- Check for missing dependencies

### "Deployment not triggering"
- Verify GitHub integration is connected
- Check branch name matches (`main`)
- Verify file paths in workflow triggers

## Next Steps

1. ✅ Connect GitHub to Cloudflare (Option 1 - easiest)
2. ✅ Set up secrets (if using GitHub Actions)
3. ✅ Push to `main` branch
4. ✅ Verify deployment in Cloudflare dashboard
5. ✅ Update frontend config with Worker URL
6. ✅ Test the deployed app

Your app will be live at:
- **Frontend**: `https://stock-take-app.pages.dev`
- **API**: `https://stock-take-api.rkoekemoer.workers.dev`

