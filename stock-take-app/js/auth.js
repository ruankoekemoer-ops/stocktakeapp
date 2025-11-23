/**
 * Microsoft Authentication using MSAL.js
 * Handles user login, logout, and token management
 */

let msalInstance = null;
let currentUser = null;

// Initialize MSAL
async function initMSAL() {
    try {
        // Check if MSAL is available (loaded from CDN)
        if (typeof msal === 'undefined') {
            console.warn('MSAL library not loaded. Authentication will not work.');
            return null;
        }
        
        const msalConfig = {
            auth: {
                clientId: CONFIG.msal.clientId,
                authority: CONFIG.msal.authority,
                redirectUri: CONFIG.msal.redirectUri,
            },
            cache: {
                cacheLocation: 'sessionStorage', // Store tokens in session storage
                storeAuthStateInCookie: false, // Set to true for IE11
            }
        };
        
        msalInstance = new msal.PublicClientApplication(msalConfig);
        
        // Initialize MSAL
        await msalInstance.initialize();
        
        // Handle redirect response
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            currentUser = accounts[0];
            updateUIForUser(currentUser);
        }
        
        return msalInstance;
    } catch (error) {
        console.error('Error initializing MSAL:', error);
        // Fallback: if MSAL fails to load, continue without auth
        return null;
    }
}

// Sign in with Microsoft
async function signIn() {
    try {
        if (!msalInstance) {
            await initMSAL();
        }
        
        if (!msalInstance) {
            showToast('Microsoft authentication is not configured. Please set your Client ID in config.js', 'error', 6000);
            return;
        }
        
        const loginRequest = {
            scopes: CONFIG.msal.scopes,
            prompt: 'select_account', // Force account selection
        };
        
        const response = await msalInstance.loginPopup(loginRequest);
        currentUser = response.account;
        updateUIForUser(currentUser);
        
        showToast(`Welcome, ${currentUser.name || currentUser.username}!`, 'success', 3000);
        
        return response;
    } catch (error) {
        console.error('Sign in error:', error);
        if (error.errorCode === 'user_cancelled') {
            showToast('Sign in cancelled', 'info', 3000);
        } else {
            showToast('Sign in failed: ' + error.message, 'error', 5000);
        }
        throw error;
    }
}

// Sign out
async function signOut() {
    try {
        if (!msalInstance) {
            return;
        }
        
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            await msalInstance.logoutPopup({
                account: accounts[0]
            });
        }
        
        currentUser = null;
        updateUIForUser(null);
        
        showToast('Signed out successfully', 'success', 3000);
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Sign out failed: ' + error.message, 'error', 5000);
    }
}

// Get access token (for API calls)
async function getAccessToken() {
    try {
        if (!msalInstance) {
            return null;
        }
        
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            return null;
        }
        
        const tokenRequest = {
            scopes: CONFIG.msal.scopes,
            account: accounts[0]
        };
        
        try {
            const response = await msalInstance.acquireTokenSilent(tokenRequest);
            return response.accessToken;
        } catch (silentError) {
            // If silent token acquisition fails, try interactive
            if (silentError.errorCode === 'interaction_required' || silentError.errorCode === 'consent_required') {
                try {
                    const response = await msalInstance.acquireTokenPopup(tokenRequest);
                    return response.accessToken;
                } catch (popupError) {
                    console.error('Popup token acquisition error:', popupError);
                    return null;
                }
            }
            throw silentError;
        }
    } catch (error) {
        console.error('Token acquisition error:', error);
        return null;
    }
}

// Get current user info
function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return currentUser !== null;
}

// Update UI based on authentication state
function updateUIForUser(user) {
    const authButton = document.getElementById('authButton');
    const userInfo = document.getElementById('userInfo');
    
    if (user) {
        // User is signed in
        if (authButton) {
            authButton.textContent = 'Sign Out';
            authButton.onclick = signOut;
            authButton.className = 'btn btn-secondary btn-small';
        }
        
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-display">
                    <span class="user-name">${escapeHtml(user.name || user.username)}</span>
                    <span class="user-email">${escapeHtml(user.username)}</span>
                </div>
            `;
            userInfo.style.display = 'block';
        }
    } else {
        // User is signed out
        if (authButton) {
            authButton.textContent = 'Sign in with Microsoft';
            authButton.onclick = signIn;
            authButton.className = 'btn btn-primary btn-small';
        }
        
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if MSAL is configured
    if (CONFIG.msal && CONFIG.msal.clientId && CONFIG.msal.clientId !== 'YOUR_CLIENT_ID_HERE') {
        await initMSAL();
    } else {
        console.log('Microsoft authentication not configured. Set CLIENT_ID in config.js');
    }
});

// Export functions
window.signIn = signIn;
window.signOut = signOut;
window.getAccessToken = getAccessToken;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;

