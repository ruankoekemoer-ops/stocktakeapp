# 🚀 Run These Commands

Copy and paste these commands into your terminal, one at a time:

## Step 1: Navigate to the cloudflare-worker directory

```bash
cd "/Users/ruankoekemoer/Sharepoint Test/cloudflare-worker"
```

## Step 2: Install Wrangler (if not already installed)

```bash
npm install -g wrangler
```

Or install locally:
```bash
npm install
```

## Step 3: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

## Step 4: Find your database name

```bash
npx wrangler d1 list
```

Look for the database with ID `7b0985e4-b27d-4c39-9438-0b638ae8b469` and note its **name** (first column).

## Step 5: Set up the database schema

Use the database **name** (not ID) as the first argument:

```bash
npx wrangler d1 execute <database-name> --file=./schema.sql
```

Replace `<database-name>` with the name from Step 4.

**Example:**
```bash
npx wrangler d1 execute stock-take-db --file=./schema.sql
```

**OR** try using the database ID directly:
```bash
npx wrangler d1 execute 7b0985e4-b27d-4c39-9438-0b638ae8b469 --file=./schema.sql
```

## Step 5: Install dependencies (if not done already)

```bash
npm install
```

## Step 6: Deploy the Worker

```bash
npm run deploy
```

**IMPORTANT:** After this command, you'll see output like:
```
✨  Deployed stock-take-api
   https://stock-take-api.abc123.workers.dev
```

**Copy that URL!** You'll need it for the next step.

## Step 7: Update the frontend config

1. Open `stock-take-app/js/config.js`
2. Find the line: `apiUrl: 'YOUR_WORKER_URL_HERE/api',`
3. Replace `YOUR_WORKER_URL_HERE` with your actual Worker URL from Step 6
4. Save the file

## Step 8: Open the app

Open `stock-take-app/index.html` in your web browser.

---

## Alternative: Run the setup script

If you prefer, you can run the setup script:

```bash
cd "/Users/ruankoekemoer/Sharepoint Test/cloudflare-worker"
bash setup.sh
```

Or make it executable and run:

```bash
chmod +x setup.sh
./setup.sh
```

---

## Troubleshooting

### "wrangler: command not found"
- Install it: `npm install -g wrangler`
- Or use npx: `npx wrangler login`

### "Database not found"
- Check the database ID in `wrangler.toml` matches your Cloudflare D1 database
- Verify you're logged in: `wrangler whoami`

### "Table doesn't exist"
- Run Step 4 again to create the schema

### Deployment fails
- Make sure you're logged in: `wrangler login`
- Check your Cloudflare account has Workers access

