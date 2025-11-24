/**
 * Authentication System
 * Currently using simple email-based login (temporary until Entra ID is set up)
 * Can be switched back to Microsoft MSAL.js authentication later
 */

let msalInstance = null;
let currentUser = null;

// Simple email-based authentication (temporary)
const USE_EMAIL_AUTH = true; // Set to false to use Microsoft authentication

// Helper function for toast notifications (if not available)
function showToast(message, type = 'info', duration = 5000) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type, duration);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    }
}

// Helper function for escaping HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize MSAL
async function initMSAL() {
    try {
        // Wait for MSAL library to load (with timeout)
        let retries = 0;
        while (typeof msal === 'undefined' && retries < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        // Check if MSAL is available (loaded from CDN)
        if (typeof msal === 'undefined') {
            console.warn('MSAL library not loaded. Authentication will not work.');
            showToast('Microsoft authentication library failed to load. Please refresh the page.', 'error', 5000);
            blockAccessUntilLogin();
            return null;
        }
        
        // Check if client ID is configured
        if (!CONFIG || !CONFIG.msal || !CONFIG.msal.clientId || CONFIG.msal.clientId === 'YOUR_CLIENT_ID_HERE') {
            console.warn('MSAL client ID not configured');
            showToast('Microsoft authentication not configured. Please set your Client ID in config.js', 'warning', 5000);
            blockAccessUntilLogin();
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
            // User is authenticated, allow access
            allowAccess();
            return msalInstance;
        } else {
            // No user logged in, block access
            blockAccessUntilLogin();
        }
        
        return msalInstance;
    } catch (error) {
        console.error('Error initializing MSAL:', error);
        showToast('Error initializing authentication: ' + error.message, 'error', 5000);
        // Block access if auth fails
        blockAccessUntilLogin();
        return null;
    }
}

// Sign in with Microsoft (for when Entra ID is set up)
async function signIn() {
    if (USE_EMAIL_AUTH) {
        // Redirect to email login screen
        blockAccessUntilLogin();
        return;
    }
    
    try {
        console.log('Sign in clicked');
        
        if (!msalInstance) {
            console.log('Initializing MSAL...');
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
        
        console.log('Calling loginPopup...');
        const response = await msalInstance.loginPopup(loginRequest);
        console.log('Login response:', response);
        
        currentUser = response.account;
        updateUIForUser(currentUser);
        
        // Allow access after successful login
        allowAccess();
        
        showToast(`Welcome, ${currentUser.name || currentUser.username}!`, 'success', 3000);
        
        return response;
    } catch (error) {
        console.error('Sign in error:', error);
        if (error.errorCode === 'user_cancelled' || error.errorMessage?.includes('User cancelled') || error.message?.includes('cancelled')) {
            showToast('Sign in cancelled', 'info', 3000);
        } else {
            showToast('Sign in failed: ' + (error.message || error.errorMessage || 'Unknown error'), 'error', 5000);
        }
        throw error;
    }
}

// Sign out
async function signOut() {
    try {
        if (USE_EMAIL_AUTH) {
            // Email-based sign out
            sessionStorage.removeItem('loggedInUserEmail');
            sessionStorage.removeItem('adminAuthenticated'); // Also clear admin auth
            sessionStorage.removeItem('adminAuthToken');
            sessionStorage.removeItem('adminAuthExpiry');
            currentUser = null;
            updateUIForUser(null);
            
            // Block access after logout
            blockAccessUntilLogin();
            
            showToast('Signed out successfully', 'success', 3000);
        } else {
            // Microsoft MSAL sign out
            if (!msalInstance) {
                return;
            }
            
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                await msalInstance.logoutPopup({
                    account: accounts[0]
                });
            }
            
            sessionStorage.removeItem('adminAuthenticated');
            sessionStorage.removeItem('adminAuthToken');
            sessionStorage.removeItem('adminAuthExpiry');
            currentUser = null;
            updateUIForUser(null);
            
            // Block access after logout
            blockAccessUntilLogin();
            
            showToast('Signed out successfully', 'success', 3000);
        }
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
        
        // Show logout button in header
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.style.display = 'inline-block';
        }
        
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-display">
                    <span class="user-name">${escapeHtml(user.name || user.username)}</span>
                    <span class="user-email">${escapeHtml(user.email || user.username)}</span>
                </div>
            `;
            userInfo.style.display = 'block';
        }
    } else {
        // User is signed out
        if (authButton) {
            if (USE_EMAIL_AUTH) {
                authButton.textContent = 'Sign In';
            } else {
                authButton.textContent = 'Sign in with Microsoft';
            }
            authButton.onclick = signIn;
            authButton.className = 'btn btn-primary btn-small';
        }
        
        // Hide logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.style.display = 'none';
        }
        
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }
}

// Simple email-based sign in
async function signInWithEmail(email) {
    try {
        if (!email || !email.trim()) {
            showToast('Please enter your email address', 'error', 3000);
            return false;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            showToast('Please enter a valid email address', 'error', 3000);
            return false;
        }
        
        // Store user info
        currentUser = {
            username: email.trim(),
            name: email.trim().split('@')[0], // Use part before @ as name
            email: email.trim()
        };
        
        // Save to sessionStorage
        sessionStorage.setItem('loggedInUserEmail', email.trim());
        
        updateUIForUser(currentUser);
        allowAccess();
        
        showToast(`Welcome, ${currentUser.name}!`, 'success', 3000);
        return true;
    } catch (error) {
        console.error('Email sign in error:', error);
        showToast('Sign in failed: ' + error.message, 'error', 5000);
        return false;
    }
}

// Block access until user logs in
function blockAccessUntilLogin() {
    const roleSelectionScreen = document.getElementById('roleSelectionScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (roleSelectionScreen) {
        roleSelectionScreen.style.display = 'none';
    }
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    if (typeof updateGlobalHomeButtonVisibility === 'function') {
        updateGlobalHomeButtonVisibility(false);
    }
    
    // Show login required screen
    let loginScreen = document.getElementById('loginRequiredScreen');
    if (!loginScreen) {
        loginScreen = document.createElement('div');
        loginScreen.id = 'loginRequiredScreen';
        loginScreen.className = 'role-selection-screen';
        
        if (USE_EMAIL_AUTH) {
            // Email-based login form
            loginScreen.innerHTML = `
                <div class="role-selection-card">
                    <h1>Stock Take Management System</h1>
                    <p class="subtitle">Enter your email address to continue</p>
                    <form id="emailLoginForm" style="margin-top: 2rem; width: 100%; max-width: 400px;">
                        <input 
                            type="email" 
                            id="emailInput" 
                            placeholder="your.email@example.com" 
                            required
                            autocomplete="email"
                            style="width: 100%; padding: 1rem; font-size: 1rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-secondary); color: var(--text-primary); margin-bottom: 1rem;"
                        />
                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%; padding: 1rem 2rem; font-size: 1.1rem;">
                            Continue
                        </button>
                    </form>
                    <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        You must be authenticated to access this application
                    </p>
                </div>
            `;
        } else {
            // Microsoft authentication button
            loginScreen.innerHTML = `
                <div class="role-selection-card">
                    <h1>Stock Take Management System</h1>
                    <p class="subtitle">Please sign in with Microsoft to continue</p>
                    <button id="loginRequiredButton" class="btn btn-primary btn-large" style="margin-top: 2rem; padding: 1rem 2rem; font-size: 1.1rem;">
                        Sign in with Microsoft
                    </button>
                    <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        You must be authenticated to access this application
                    </p>
                </div>
            `;
        }
        
        document.body.appendChild(loginScreen);
        
        if (USE_EMAIL_AUTH) {
            // Handle email form submission
            const emailForm = document.getElementById('emailLoginForm');
            const emailInput = document.getElementById('emailInput');
            
            if (emailForm) {
                emailForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const email = emailInput.value.trim();
                    await signInWithEmail(email);
                });
            }
            
            // Focus email input
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 100);
            }
        } else {
            // Handle Microsoft sign-in button
            const loginBtn = document.getElementById('loginRequiredButton');
            if (loginBtn) {
                loginBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Login required button clicked');
                    signIn();
                });
            }
        }
    }
    loginScreen.style.display = 'flex';
}

// Allow access after login
function allowAccess() {
    const loginScreen = document.getElementById('loginRequiredScreen');
    if (loginScreen) {
        loginScreen.style.display = 'none';
    }
    
    // Show role selection screen
    const roleSelectionScreen = document.getElementById('roleSelectionScreen');
    if (roleSelectionScreen) {
        roleSelectionScreen.style.display = 'flex';
    }
    
    if (typeof updateGlobalHomeButtonVisibility === 'function') {
        updateGlobalHomeButtonVisibility(true);
    }
}

// Make functions available globally immediately
window.signIn = signIn;
window.signOut = signOut;
window.getAccessToken = getAccessToken;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.blockAccessUntilLogin = blockAccessUntilLogin;
window.allowAccess = allowAccess;

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (USE_EMAIL_AUTH) {
        // Check if user is already logged in via email
        const savedEmail = sessionStorage.getItem('loggedInUserEmail');
        if (savedEmail) {
            currentUser = {
                username: savedEmail,
                name: savedEmail.split('@')[0],
                email: savedEmail
            };
            updateUIForUser(currentUser);
            // Don't block access, allow role selection
            allowAccess();
        } else {
            // No saved email, block access
            blockAccessUntilLogin();
        }
    } else {
        // Microsoft authentication
        // Always require authentication
        // Check if MSAL is configured
        if (CONFIG && CONFIG.msal && CONFIG.msal.clientId && CONFIG.msal.clientId !== 'YOUR_CLIENT_ID_HERE') {
            await initMSAL();
        } else {
            console.log('Microsoft authentication not configured. Set CLIENT_ID in config.js');
            // Still block access even if not configured
            blockAccessUntilLogin();
            const loginBtn = document.getElementById('loginRequiredButton');
            if (loginBtn) {
                loginBtn.onclick = () => {
                    showToast('Please configure Microsoft authentication first. See MICROSOFT-AUTH-SETUP.md', 'error', 6000);
                };
            }
        }
    }
});
