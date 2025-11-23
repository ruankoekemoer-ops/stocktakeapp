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
    
    // Microsoft Authentication Configuration
    // IMPORTANT: Register your app at https://portal.azure.com
    // See MICROSOFT-AUTH-SETUP.md for detailed instructions
    msal: {
        clientId: 'YOUR_CLIENT_ID_HERE', // Replace with your Azure AD App Registration Client ID
        authority: 'https://login.microsoftonline.com/common', // Use 'common' for multi-tenant, or specific tenant ID
        redirectUri: window.location.origin, // Current app URL
        scopes: ['User.Read', 'email', 'profile'] // Microsoft Graph API permissions
    }
};

// Make available globally
window.CONFIG = CONFIG;

