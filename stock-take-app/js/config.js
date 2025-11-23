/**
 * Configuration
 * 
 * IMPORTANT: Update the apiUrl below with your Cloudflare Worker URL
 * After deploying the Worker, you'll get a URL like:
 * https://stock-take-api.your-subdomain.workers.dev
 * 
 * Then set apiUrl to: 'https://stock-take-api.your-subdomain.workers.dev/api'
 */

const CONFIG = {
    // API server URL - Connected to Cloudflare Worker
    apiUrl: 'https://stock-take-api.rkoekemoer.workers.dev/api',
};

// Make available globally
window.CONFIG = CONFIG;

