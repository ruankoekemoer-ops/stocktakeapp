# Local Development Setup

## Quick Start

1. **Start the local server:**
   ```bash
   cd stock-take-app
   python3 -m http.server 8000
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

3. **Or use npm script:**
   ```bash
   npm start
   ```

## Development Workflow

- Make changes to HTML/CSS/JS files
- Refresh browser to see changes
- No need to push to GitHub for testing!

## API Configuration

The app will use the Cloudflare Worker API by default. To change it, edit `js/config.js`.

