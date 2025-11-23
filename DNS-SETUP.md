# 🌐 DNS Setup for Cloudflare Pages

This guide will help you set up a custom domain for your Stock Take App.

## Quick Setup via Cloudflare Dashboard

### Step 1: Add Custom Domain to Pages

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Navigate to: **Workers & Pages** > **stock-take-app** > **Custom domains**

2. **Add Domain**
   - Click "Set up a custom domain"
   - Enter your domain (e.g., `stocktake.yourdomain.com` or `yourdomain.com`)
   - Click "Continue"

3. **DNS Configuration**
   - Cloudflare will automatically configure DNS
   - If using Cloudflare DNS, it's automatic
   - If using external DNS, follow instructions below

### Step 2: Verify DNS Records

Cloudflare will show you the DNS records needed. Typically:

**For subdomain (e.g., stocktake.yourdomain.com):**
```
Type: CNAME
Name: stocktake
Target: stock-take-app.pages.dev
Proxy: Enabled (orange cloud)
```

**For root domain (e.g., yourdomain.com):**
```
Type: CNAME
Name: @
Target: stock-take-app.pages.dev
Proxy: Enabled (orange cloud)
```

## Manual DNS Setup (External DNS Provider)

If your domain is not managed by Cloudflare:

### Option 1: CNAME Record (Recommended)

1. **Go to your DNS provider** (GoDaddy, Namecheap, etc.)
2. **Add CNAME record:**
   - **Type**: CNAME
   - **Name**: `stocktake` (or `@` for root domain)
   - **Value**: `stock-take-app.pages.dev`
   - **TTL**: 3600 (or Auto)

3. **Wait for propagation** (5-60 minutes)

### Option 2: A Record (If CNAME not supported for root)

For root domains that don't support CNAME:

1. **Get Cloudflare Pages IP addresses** (contact Cloudflare support or use Pages IPs)
2. **Add A records:**
   ```
   Type: A
   Name: @
   Value: [Cloudflare Pages IP]
   TTL: 3600
   ```

## Troubleshooting Launch Errors

### Error: "Domain not verified"

**Solution:**
1. Check DNS records are correct
2. Wait for DNS propagation (can take up to 48 hours)
3. Verify in Cloudflare dashboard that domain shows as "Active"

### Error: "SSL certificate pending"

**Solution:**
1. Cloudflare automatically provisions SSL certificates
2. Wait 5-15 minutes after adding domain
3. Check SSL/TLS settings in Cloudflare dashboard

### Error: "CORS error" or "Failed to fetch"

**Solution:**
1. Update `stock-take-app/js/config.js` with correct API URL
2. Ensure Worker URL is correct
3. Check CORS headers in Worker (already configured)

### Error: "404 Not Found"

**Solution:**
1. Ensure `_redirects` file is in `stock-take-app/` directory
2. Check build output directory is correct
3. Verify file paths are correct

## Update Frontend Config

After DNS is set up, update your config if needed:

```javascript
// stock-take-app/js/config.js
const CONFIG = {
    // Use your Worker URL (should already be set)
    apiUrl: 'https://stock-take-api.rkoekemoer.workers.dev/api',
};
```

## Verify Setup

1. **Check DNS propagation:**
   ```bash
   dig stocktake.yourdomain.com
   # or
   nslookup stocktake.yourdomain.com
   ```

2. **Test HTTPS:**
   - Visit: `https://stocktake.yourdomain.com`
   - Should show SSL certificate

3. **Test API connection:**
   - Open browser console
   - Check for CORS errors
   - Verify API calls work

## Common Issues

### "This site can't be reached"

- DNS not propagated yet (wait 5-60 minutes)
- Incorrect DNS records
- Domain not added to Cloudflare Pages

### "SSL Certificate Error"

- Wait for Cloudflare to provision certificate (5-15 minutes)
- Check SSL/TLS mode in Cloudflare (should be "Full" or "Full (strict)")

### "Mixed Content Warning"

- Ensure all resources use HTTPS
- Check API URL uses HTTPS

## Quick Fix Script

If you're getting launch errors, check:

```bash
# 1. Verify DNS
dig stocktake.yourdomain.com

# 2. Check SSL
curl -I https://stocktake.yourdomain.com

# 3. Test API
curl https://stock-take-api.rkoekemoer.workers.dev/api/items
```

## Need Help?

1. Check Cloudflare dashboard for error messages
2. Review DNS records
3. Check SSL/TLS settings
4. Verify Worker is deployed and accessible

