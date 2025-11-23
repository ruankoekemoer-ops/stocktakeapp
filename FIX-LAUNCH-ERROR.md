# 🔧 Fix Launch Errors - Quick Guide

## Common Launch Errors and Solutions

### 1. "Failed to fetch" or CORS Error

**Problem:** Frontend can't connect to Worker API

**Solution:**
1. Check Worker is deployed:
   ```bash
   curl https://stock-take-api.rkoekemoer.workers.dev/api/items
   ```

2. Update config.js if Worker URL changed:
   ```javascript
   // stock-take-app/js/config.js
   apiUrl: 'https://stock-take-api.rkoekemoer.workers.dev/api'
   ```

3. Verify CORS is enabled in Worker (already configured)

### 2. "404 Not Found" on Pages

**Problem:** Routes not working, files not found

**Solution:**
1. Ensure `_redirects` file exists in `stock-take-app/` directory
2. Check build output directory in Cloudflare Pages settings
3. Verify all files are in the correct location

### 3. "Domain not verified"

**Problem:** Custom domain not set up correctly

**Solution:**
1. Go to Cloudflare Dashboard > Pages > Custom domains
2. Add your domain
3. Wait for DNS propagation (5-60 minutes)
4. Check DNS records are correct

### 4. "SSL Certificate Error"

**Problem:** SSL not provisioned yet

**Solution:**
1. Wait 5-15 minutes after adding domain
2. Cloudflare automatically provisions SSL
3. Check SSL/TLS mode in Cloudflare dashboard

### 5. "Database connection error"

**Problem:** D1 database not accessible

**Solution:**
1. Verify database schema is created:
   ```bash
   npx wrangler d1 execute stocktakedata --file=./schema.sql --remote
   ```

2. Check database ID in `wrangler.toml` is correct:
   ```
   database_id = "7b0985e4-b27d-4c39-9438-0b638ae8b469"
   ```

3. Verify Worker has D1 binding configured

## Quick Diagnostic Steps

### Step 1: Check Worker Status

```bash
# Test Worker API
curl https://stock-take-api.rkoekemoer.workers.dev/api/items
```

Should return JSON (empty array if no items).

### Step 2: Check Pages Status

Visit your Pages URL:
- Default: `https://stock-take-app.pages.dev`
- Custom: `https://yourdomain.com`

### Step 3: Check Browser Console

1. Open your deployed app
2. Press F12 to open DevTools
3. Check Console tab for errors
4. Check Network tab for failed requests

### Step 4: Verify Configuration

1. **Worker URL**: Check `stock-take-app/js/config.js`
2. **Database**: Verify D1 database exists and has schema
3. **DNS**: Check domain points to Pages
4. **SSL**: Verify certificate is active

## DNS Setup (If Needed)

### Add Custom Domain in Cloudflare:

1. Go to: **Workers & Pages** > **stock-take-app** > **Custom domains**
2. Click "Set up a custom domain"
3. Enter your domain
4. Cloudflare will configure DNS automatically

### Manual DNS (External Provider):

Add CNAME record:
```
Type: CNAME
Name: stocktake (or @ for root)
Value: stock-take-app.pages.dev
TTL: 3600
```

## Test Everything Works

1. **Test Worker:**
   ```bash
   curl https://stock-take-api.rkoekemoer.workers.dev/api/items
   ```

2. **Test Pages:**
   - Visit: `https://stock-take-app.pages.dev`
   - Should load the app

3. **Test API from App:**
   - Open browser console
   - Should see API calls succeed
   - No CORS errors

## Still Having Issues?

1. **Check Cloudflare Dashboard:**
   - Look for error messages
   - Check deployment logs
   - Verify all services are active

2. **Check GitHub Actions:**
   - Go to: https://github.com/ruankoekemoer-ops/stocktakeapp/actions
   - Check if deployments succeeded

3. **Review Logs:**
   - Worker logs: Cloudflare Dashboard > Workers > Logs
   - Pages logs: Cloudflare Dashboard > Pages > Deployments > View logs

## Quick Fix Checklist

- [ ] Worker is deployed and accessible
- [ ] Pages is deployed and accessible  
- [ ] Database schema is created
- [ ] Config.js has correct Worker URL
- [ ] DNS is configured (if using custom domain)
- [ ] SSL certificate is active
- [ ] No CORS errors in browser console
- [ ] All files are in correct directories

