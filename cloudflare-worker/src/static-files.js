/**
 * Static file content for the frontend
 * These will be served by the Worker at https://stock-take-api.rkoekemoer.workers.dev
 */

// Read the actual files and embed them here
import indexHtmlContent from '../../stock-take-app/index.html?raw';
import appJsContent from '../../stock-take-app/js/app.js?raw';
import styleCssContent from '../../stock-take-app/css/style.css?raw';

// Config.js - uses same domain for API (no CORS issues)
export const configJs = `/**
 * Configuration
 * Uses same domain as frontend - no CORS issues!
 */

const CONFIG = {
    // API server URL - Same domain as frontend
    apiUrl: window.location.origin + '/api',
};

// Make available globally
window.CONFIG = CONFIG;`;

// For now, we'll need to read files differently or embed them
// Let me create a script to generate this file with embedded content
