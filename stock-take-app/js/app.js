/**
 * Stock Take Management System
 * Complete warehouse inventory management with company, warehouse, bin location, and manager setup
 */

// Global state
let allItems = [];
let filteredItems = [];
let companies = [];
let warehouses = [];
let binLocations = [];
let managers = [];
let currentRole = 'manager'; // 'counter' or 'manager'
// currentStockTake already declared at top of file
let currentBinLocation = null;
let currentBinItems = [];
let qrScanner = null; // QR Code scanner instance

// System Admin password (defined early so it's available everywhere)
const ADMIN_PASSWORD = 'admin123'; // TODO: Change this to a secure password or use environment variable

// Define selectRole function immediately so it's available for onclick handlers
function selectRole(role) {
    try {
        console.log('Selecting role:', role);
        
        // Check if user is authenticated
        if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
            showToast('Please sign in with Microsoft first', 'warning', 3000);
            if (typeof signIn === 'function') {
                signIn();
            }
            return;
        }
        
        if (!role || (role !== 'counter' && role !== 'manager')) {
            console.error('Invalid role:', role);
            return;
        }
        
        localStorage.setItem('stockTakeRole', role);
        
        const roleSelectionScreen = document.getElementById('roleSelectionScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (!roleSelectionScreen || !mainApp) {
            console.error('Required DOM elements not found');
            showToast('Error: Page elements not found. Please refresh the page.', 'error', 5000);
            return;
        }
        
        roleSelectionScreen.style.display = 'none';
        mainApp.style.display = 'block';
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            initializeApp(role);
        }, 50);
    } catch (error) {
        console.error('Error in selectRole:', error);
        showToast('Error selecting role: ' + error.message, 'error', 5000);
    }
}

// Make function available globally immediately
if (typeof window !== 'undefined') {
    window.selectRole = selectRole;
    console.log('selectRole function registered on window');
}

/**
 * Initialize app
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Stock Take Management System initialized');
    console.log('selectRole function available:', typeof window.selectRole);
    console.log('selectRole function available (direct):', typeof selectRole);
    
    // Add event listeners to role buttons using IDs
    const counterBtn = document.getElementById('counterBtn');
    const managerBtn = document.getElementById('managerBtn');
    
    console.log('Counter button found:', !!counterBtn);
    console.log('Manager button found:', !!managerBtn);
    
    if (counterBtn) {
        // Use mousedown as well to catch all interactions
        ['click', 'mousedown', 'touchstart'].forEach(eventType => {
            counterBtn.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Counter button ' + eventType + ' event!');
                try {
                    if (typeof selectRole === 'function') {
                        selectRole('counter');
                    } else if (typeof window.selectRole === 'function') {
                        window.selectRole('counter');
                    } else {
                        throw new Error('selectRole function not found');
                    }
                } catch (error) {
                    console.error('Error in counter button click:', error);
                    showToast(error.message, 'error', 5000);
                }
            }, { passive: false });
        });
        console.log('Counter button event listeners added');
    } else {
        console.error('Counter button not found!');
    }
    
    if (managerBtn) {
        // Use mousedown as well to catch all interactions
        ['click', 'mousedown', 'touchstart'].forEach(eventType => {
            managerBtn.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Manager button ' + eventType + ' event!');
                try {
                    if (typeof selectRole === 'function') {
                        selectRole('manager');
                    } else if (typeof window.selectRole === 'function') {
                        window.selectRole('manager');
                    } else {
                        throw new Error('selectRole function not found');
                    }
                } catch (error) {
                    console.error('Error in manager button click:', error);
                    showToast(error.message, 'error', 5000);
                }
            }, { passive: false });
        });
        console.log('Manager button event listeners added');
    } else {
        console.error('Manager button not found!');
    }
    
    // Don't show role selection until user is authenticated
    // Authentication check will handle showing the appropriate screen
    const roleScreen = document.getElementById('roleSelectionScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (roleScreen) {
        roleScreen.style.display = 'none';
    }
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Clear any saved role to force selection
    localStorage.removeItem('stockTakeRole');
    
    // Wait for auth to initialize, then check authentication
    setTimeout(async () => {
        if (typeof isAuthenticated === 'function') {
            if (!isAuthenticated()) {
                // Auth will show login screen
                if (typeof blockAccessUntilLogin === 'function') {
                    blockAccessUntilLogin();
                }
            } else {
                // User is authenticated, check if they're a manager
                await checkUserManagerStatus();
                
                // Show role selection
                if (roleScreen) {
                    roleScreen.style.display = 'flex';
                }
                
                // Add authenticated class to body for CSS
                document.body.classList.add('authenticated');
            }
        } else {
            // Auth not loaded yet, wait a bit more
            setTimeout(() => {
                if (typeof blockAccessUntilLogin === 'function') {
                    blockAccessUntilLogin();
                }
            }, 500);
        }
    }, 200);
});

function initializeApp(role) {
    try {
        console.log('Initializing app with role:', role);
        currentRole = role;
        
        // Ensure authenticated class is on body
        document.body.classList.add('authenticated');
        
        // Update UI based on role
        setRole(role, false); // Don't save (already saved)
        
        // Load initial data
        loadCompanies().then(() => {
            // After companies load, load other data
            loadWarehouses();
            loadBinLocations();
            loadManagers().then(() => {
                // After managers load, update company/warehouse dropdowns for stock take
                updateCompanyDropdowns();
                updateWarehouseDropdowns();
            });
        }).catch(error => {
            console.error('Error loading initial data:', error);
        });
        
        // Load open stock takes if in counter mode
        if (role === 'counter') {
            loadOpenStockTakes();
        }
        
        // Initialize stock take status
        setTimeout(() => {
            const stocktakeTab = document.getElementById('stocktakeTab');
            if (stocktakeTab && stocktakeTab.classList.contains('active')) {
                updateStockTakeStatus();
            }
        }, 100);
    } catch (error) {
        console.error('Error in initializeApp:', error);
        showToast('Error initializing app. Please refresh the page.', 'error', 5000);
    }
}

// selectRole function is now defined at the top of the file for immediate availability

// Check if current user is a manager
async function checkUserManagerStatus() {
    try {
        // Get current user email
        let userEmail = null;
        if (typeof getCurrentUser === 'function') {
            const user = getCurrentUser();
            if (user && user.email) {
                userEmail = user.email;
            }
        }
        
        // Also check sessionStorage for email auth
        if (!userEmail) {
            userEmail = sessionStorage.getItem('loggedInUserEmail');
        }
        
        if (!userEmail) {
            console.log('No user email found, hiding manager option');
            hideManagerOption();
            return;
        }
        
        // Load all managers
        const managersResponse = await fetch(`${CONFIG.apiUrl}/managers`);
        if (!managersResponse.ok) {
            console.log('Failed to load managers, hiding manager option');
            hideManagerOption();
            return;
        }
        
        const allManagers = await managersResponse.json();
        
        // Find manager with matching email
        const matchingManager = allManagers.find(m => 
            m.email && m.email.toLowerCase() === userEmail.toLowerCase()
        );
        
        if (!matchingManager) {
            console.log('No manager found with email:', userEmail);
            hideManagerOption();
            return;
        }
        
        // Check if this manager has any company access
        const accessResponse = await fetch(`${CONFIG.apiUrl}/manager-company-access?manager_id=${matchingManager.id}`);
        if (!accessResponse.ok) {
            console.log('Failed to check manager access, hiding manager option');
            hideManagerOption();
            return;
        }
        
        const accessList = await accessResponse.json();
        
        if (accessList && accessList.length > 0) {
            console.log('User is a manager, showing manager option');
            showManagerOption();
        } else {
            console.log('Manager has no company access, hiding manager option');
            hideManagerOption();
        }
    } catch (error) {
        console.error('Error checking manager status:', error);
        // On error, hide manager option for security
        hideManagerOption();
    }
}

function hideManagerOption() {
    const managerBtn = document.getElementById('managerBtn');
    if (managerBtn) {
        managerBtn.style.display = 'none';
    }
}

function showManagerOption() {
    const managerBtn = document.getElementById('managerBtn');
    if (managerBtn) {
        managerBtn.style.display = 'flex';
    }
}

function switchRole() {
    // Clear role and show role selection screen
    localStorage.removeItem('stockTakeRole');
    
    const roleScreen = document.getElementById('roleSelectionScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (roleScreen) roleScreen.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
    
    // Re-check manager status when switching roles
    checkUserManagerStatus();
}
window.switchRole = switchRole;

// ========== ROLE MANAGEMENT ==========
function setRole(role, saveToStorage = true) {
    currentRole = role;
    
    if (saveToStorage) {
        localStorage.setItem('stockTakeRole', role);
    }
    
    // Update subtitle
    const subtitle = document.getElementById('roleSubtitle');
    if (subtitle) {
        subtitle.textContent = role === 'counter' 
            ? 'Scan, count, and submit inventory' 
            : 'Manage companies, warehouses, and view reports';
    }
    
    // Update role badge
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        roleBadge.className = 'role-badge ' + role;
    }
    
    // Build navigation items (hides navigation for counter)
    buildNavigation(role);
    
    // Counter mode: Show ONLY the counting interface, hide everything else
    if (role === 'counter') {
        // Hide entire header
        const appHeader = document.getElementById('appHeader');
        if (appHeader) appHeader.style.display = 'none';
        
        // Hide page header in content
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) pageHeader.style.display = 'none';
        
        // Hide ALL other tabs completely
        const openStockTakesTab = document.getElementById('openStockTakesTab');
        const setupTab = document.getElementById('setupTab');
        const viewTab = document.getElementById('viewTab');
        
        if (openStockTakesTab) openStockTakesTab.style.display = 'none';
        if (setupTab) setupTab.style.display = 'none';
        if (viewTab) viewTab.style.display = 'none';
        
        // Hide all sections except counter start
        const counterStartSection = document.getElementById('counterStartSection');
        const managerStockTakeSection = document.getElementById('managerStockTakeSection');
        const binLocationSection = document.getElementById('binLocationSection');
        const itemScanSection = document.getElementById('itemScanSection');
        const binItemsSection = document.getElementById('binItemsSection');
        
        if (counterStartSection) counterStartSection.style.display = 'block';
        if (managerStockTakeSection) managerStockTakeSection.style.display = 'none';
        if (binLocationSection) binLocationSection.style.display = 'none';
        if (itemScanSection) itemScanSection.style.display = 'none';
        if (binItemsSection) binItemsSection.style.display = 'none';
        
        // Show ONLY stocktake tab content
        const stocktakeTab = document.getElementById('stocktakeTab');
        if (stocktakeTab) {
            stocktakeTab.classList.add('active');
            stocktakeTab.style.display = 'block';
        }
        
        // Add a small "Switch Role" button at the bottom for counter
        addCounterSwitchButton();
        
        // Focus on counter bin input
        setTimeout(() => {
            const counterBinInput = document.getElementById('counterBinLocationInput');
            if (counterBinInput) counterBinInput.focus();
        }, 100);
    } else {
        // Manager mode: Show everything
        const appHeader = document.getElementById('appHeader');
        if (appHeader) appHeader.style.display = 'flex';
        
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) pageHeader.style.display = 'block';
        
        // Show all tabs
        const openStockTakesTab = document.getElementById('openStockTakesTab');
        const setupTab = document.getElementById('setupTab');
        const viewTab = document.getElementById('viewTab');
        
        if (openStockTakesTab) openStockTakesTab.style.display = 'block';
        if (setupTab) setupTab.style.display = 'block';
        if (viewTab) viewTab.style.display = 'block';
        
        // Show manager section, hide counter section
        const counterStartSection = document.getElementById('counterStartSection');
        const managerStockTakeSection = document.getElementById('managerStockTakeSection');
        if (counterStartSection) counterStartSection.style.display = 'none';
        if (managerStockTakeSection) managerStockTakeSection.style.display = 'block';
        
        // Also hide the scanning sections for manager mode
        const binLocationSection = document.getElementById('binLocationSection');
        const itemScanSection = document.getElementById('itemScanSection');
        const binItemsSection = document.getElementById('binItemsSection');
        if (binLocationSection) binLocationSection.style.display = 'none';
        if (itemScanSection) itemScanSection.style.display = 'none';
        if (binItemsSection) binItemsSection.style.display = 'none';
        
        // Remove counter switch button if it exists
        const counterSwitchBtn = document.getElementById('counterSwitchRoleBtn');
        if (counterSwitchBtn) counterSwitchBtn.remove();
        
        // Switch to stock take tab by default
        const stocktakeTab = document.getElementById('stocktakeTab');
        if (stocktakeTab && !stocktakeTab.classList.contains('active')) {
            try {
                showTab('stocktake');
            } catch (error) {
                console.error('Error switching to stocktake tab:', error);
            }
        }
    }
}
window.setRole = setRole;

/**
 * Tab switching
 */
// Build navigation menu
function buildNavigation(role) {
    const navItems = [];
    
    // Counter sees NOTHING - no navigation at all
    if (role === 'counter') {
        // Hide sidebar and mobile nav completely
        const sidebar = document.getElementById('sidebar');
        const mobileNav = document.getElementById('mobileNav');
        if (sidebar) sidebar.style.display = 'none';
        if (mobileNav) mobileNav.style.display = 'none';
        
        // Update main content to take full width
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.style.marginLeft = '0';
        
        // System Admin button will be shown in bottom left (handled by CSS)
        return;
    } else {
        // Manager sees all navigation
        navItems.push(
            { id: 'stocktake', label: 'Stock Take', icon: '📦' },
            { id: 'openStockTakes', label: 'Open Stock Takes', icon: '📋' },
            { id: 'setup', label: 'Setup', icon: '⚙️' },
            { id: 'view', label: 'View Items', icon: '📊' }
        );
        
        // Show sidebar and mobile nav for manager
        const sidebar = document.getElementById('sidebar');
        const mobileNav = document.getElementById('mobileNav');
        if (sidebar) {
            sidebar.style.display = 'block';
            sidebar.style.width = ''; // Reset to default
        }
        if (mobileNav) mobileNav.style.display = 'block';
        
        // Restore main content margin
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.style.marginLeft = 'var(--sidebar-width)';
    }
    
    // Update sidebar navigation
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav) {
        sidebarNav.innerHTML = navItems.map(item => `
            <div class="nav-item" onclick="showTab('${item.id}')" data-tab="${item.id}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
            </div>
        `).join('');
    }
    
    // System Admin button visibility is handled by CSS based on .authenticated class
}

function showTab(tabName, clickedElement) {
    // Check if tab is allowed for current role
    if (tabName === 'setup' && currentRole === 'counter') {
        showToast('Setup is only available in Manager mode', 'warning', 3000);
        return;
    }
    if (tabName === 'view' && currentRole === 'counter') {
        showToast('View Items is only available in Manager mode', 'warning', 3000);
        return;
    }
    
    // Hide ALL tabs completely
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // Show ONLY the selected tab
    const tabElement = document.getElementById(tabName + 'Tab');
    if (tabElement) {
        tabElement.classList.add('active');
        tabElement.style.display = 'block';
    }
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });
    
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const titles = {
            'stocktake': 'Stock Take',
            'openStockTakes': 'Open Stock Takes',
            'setup': 'Setup',
            'view': 'View Items',
            'systemAdmin': 'System Admin'
        };
        pageTitle.textContent = titles[tabName] || 'Stock Take';
    } else {
        // Find the tab button by ID
        const tabBtnId = tabName + 'TabBtn';
        const tabBtn = document.getElementById(tabBtnId);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }
    }
    
    // Load data when switching tabs
    if (tabName === 'setup') {
        loadCompanies();
        loadWarehouses();
        // If a company is already selected, load its data
        if (selectedCompanyId) {
            onCompanySelected();
        }
    } else if (tabName === 'stocktake') {
        // Ensure managers are loaded for validation
        if (managers.length === 0) {
            loadManagers();
        }
        // Update dropdowns
        updateCompanyDropdowns();
        updateWarehouseDropdowns();
        // Update stock take status
        updateStockTakeStatus();
    } else if (tabName === 'view') {
        updateViewFilters();
        if (allItems.length === 0) {
            loadItems();
        } else {
            applyViewFilters();
        }
    } else if (tabName === 'openStockTakes') {
        loadOpenStockTakes();
    } else if (tabName === 'systemAdmin') {
        // Update page title
        if (pageTitle) {
            pageTitle.textContent = 'System Admin';
        }
        
        // Check if already authenticated
        if (!isAdminAuthenticated()) {
            showAdminLogin();
            // Focus password input and ensure button works after a short delay
            setTimeout(() => {
                const passwordInput = document.getElementById('adminPassword');
                const accessBtn = document.getElementById('accessAdminBtn');
                
                if (passwordInput) {
                    passwordInput.focus();
                    // Handle Enter key
                    passwordInput.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            checkAdminPassword();
                        }
                    });
                }
                
                // Ensure button click works
                if (accessBtn) {
                    // Remove any existing listeners
                    const newBtn = accessBtn.cloneNode(true);
                    accessBtn.parentNode.replaceChild(newBtn, accessBtn);
                    
                    // Add click handler
                    newBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Button clicked - calling checkAdminPassword');
                        checkAdminPassword();
                    });
                    
                    // Also ensure onclick works
                    newBtn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Button onclick - calling checkAdminPassword');
                        checkAdminPassword();
                    };
                }
            }, 200);
        } else {
            showAdminContent();
        }
    }
}
window.showTab = showTab;

// Show setup page
function showSetupPage(pageName) {
    // Hide ALL setup pages first
    document.querySelectorAll('.setup-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Show ONLY the selected page
    const pageElement = document.getElementById(`setupPage-${pageName}`);
    if (pageElement) {
        pageElement.classList.add('active');
        pageElement.style.display = 'block';
    }
    
    // Update navigation active state
    document.querySelectorAll('.setup-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.setupPage === pageName) {
            item.classList.add('active');
        }
    });
    
    // Load data for the page
    switch(pageName) {
        case 'companies':
            loadCompanies();
            break;
        case 'warehouses':
            loadWarehousesForSetup();
            break;
        case 'binLocations':
            loadBinLocationsForSetup();
            break;
        case 'managers':
            loadManagersForSetup();
            break;
    }
}
window.showSetupPage = showSetupPage;

// Update filter dropdowns for setup pages
function updateSetupFilterDropdowns() {
    // Update company filters
    const companyFilters = ['warehouseCompanyFilter', 'binLocationCompanyFilter', 'managerCompanyFilter'];
    companyFilters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            const currentValue = filter.value;
            filter.innerHTML = '<option value="">All Companies</option>' + 
                companies.map(c => `<option value="${c.id}">${escapeHtml(c.company_name)}</option>`).join('');
            if (currentValue) filter.value = currentValue;
        }
    });
    
    // Update warehouse filters (will be updated when company is selected)
    updateBinLocationWarehouseFilter();
    updateManagerWarehouseFilter();
}
window.updateSetupFilterDropdowns = updateSetupFilterDropdowns;

// ========== COMPANY SELECTION & SETTINGS ==========
let selectedCompanyId = null;

function onCompanySelected() {
    const companyId = document.getElementById('selectedCompany').value;
    selectedCompanyId = companyId ? parseInt(companyId) : null;
    
    const companyDetailsSection = document.getElementById('companyDetailsSection');
    
    if (selectedCompanyId) {
        // Show company details section
        if (companyDetailsSection) {
            companyDetailsSection.style.display = 'block';
        }
        
        // Load all data for this company
        loadWarehousesForCompany();
        loadBinLocationsForCompany();
        loadManagersForCompany();
    } else {
        // Hide company details section
        if (companyDetailsSection) {
            companyDetailsSection.style.display = 'none';
        }
    }
}
window.onCompanySelected = onCompanySelected;

function editSelectedCompany() {
    if (selectedCompanyId) {
        openEditCompanyModal(selectedCompanyId);
    }
}
window.editSelectedCompany = editSelectedCompany;

function selectCompany(companyId) {
    document.getElementById('selectedCompany').value = companyId;
    onCompanySelected();
}
window.selectCompany = selectCompany;

// ========== COMPANIES ==========
async function loadCompanies() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/companies`);
        companies = await response.json();
        
        // Update dropdowns
        updateCompanyDropdowns();
        
        // Update company selector dropdown
        updateCompanyDropdowns();
        
        // Display companies in list (only if no company selected)
        const listEl = document.getElementById('companiesList');
        const noCompaniesEl = document.getElementById('noCompanies');
        if (listEl) {
            if (companies.length === 0) {
                listEl.innerHTML = '';
                if (noCompaniesEl) noCompaniesEl.style.display = 'block';
            } else {
                if (noCompaniesEl) noCompaniesEl.style.display = 'none';
                listEl.innerHTML = companies.map(c => `
                    <div class="item-card" onclick="selectCompany(${c.id})" style="cursor: pointer;">
                        <div class="item-header">
                            <h3>${escapeHtml(c.company_name)}</h3>
                            <span class="item-id">${escapeHtml(c.company_code)}</span>
                        </div>
                        <div class="item-details">
                            <p>Click to configure this company's warehouses, bin locations, and managers</p>
                        </div>
                        <div class="item-actions">
                            <button onclick="event.stopPropagation(); selectCompany(${c.id})" class="btn btn-small">Configure</button>
                            <button onclick="event.stopPropagation(); editCompany(${c.id})" class="btn btn-small">Edit</button>
                            <button onclick="event.stopPropagation(); deleteCompany(${c.id})" class="btn btn-small btn-danger">Delete</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

function updateCompanyDropdowns() {
    const selects = document.querySelectorAll('select[id*="Company"], select[id*="company"]');
    selects.forEach(select => {
        const currentValue = select.value;
        const placeholder = select.id === 'selectedCompany' ? '-- Select a Company --' : 'Select Company';
        select.innerHTML = `<option value="">${placeholder}</option>` + 
            companies.map(c => `<option value="${c.id}">${escapeHtml(c.company_name)}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

function openCompanyModal(id = null) {
    if (id) {
        openEditCompanyModal(id);
    } else {
        openAddCompanyModal();
    }
}
window.openCompanyModal = openCompanyModal;

function openAddCompanyModal() {
    const modal = document.getElementById('companyModal');
    const form = document.getElementById('companyForm');
    const title = document.getElementById('companyModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Add Company';
        form.reset();
        // Remove any hidden ID field if it exists
        const idField = document.getElementById('editCompanyId');
        if (idField) idField.remove();
        modal.style.display = 'flex';
    }
}
window.openAddCompanyModal = openAddCompanyModal;

function closeCompanyModal() {
    const modal = document.getElementById('companyModal');
    if (modal) modal.style.display = 'none';
}
window.closeCompanyModal = closeCompanyModal;
window.closeAddCompanyModal = closeCompanyModal; // Alias for backward compatibility

function openEditCompanyModal(id) {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    
    const modal = document.getElementById('companyModal');
    const form = document.getElementById('companyForm');
    const title = document.getElementById('companyModalTitle');
    const companyName = document.getElementById('companyName');
    
    if (modal && form && title && companyName) {
        title.textContent = 'Edit Company';
        
        // Add hidden ID field if it doesn't exist
        let idField = document.getElementById('editCompanyId');
        if (!idField) {
            idField = document.createElement('input');
            idField.type = 'hidden';
            idField.id = 'editCompanyId';
            form.appendChild(idField);
        }
        idField.value = id;
        
        companyName.value = company.company_name;
        
        // Set company code if field exists
        const companyCode = document.getElementById('companyCode');
        if (companyCode && company.company_code) {
            companyCode.value = company.company_code;
        }
        
        modal.style.display = 'flex';
    }
}
window.openEditCompanyModal = openEditCompanyModal;

async function handleCompanySubmit(event) {
    event.preventDefault();
    const idField = document.getElementById('editCompanyId');
    const isEdit = idField && idField.value;
    
    const companyName = document.getElementById('companyName');
    if (!companyName) {
        showToast('Company name field not found', 'error', 3000);
        return;
    }
    
    const formData = {
        company_name: companyName.value.trim(),
    };
    
    // Add company_code if it exists (for backward compatibility)
    const companyCode = document.getElementById('companyCode');
    if (companyCode) {
        formData.company_code = companyCode.value.trim();
    }
    
    try {
        let response;
        if (isEdit) {
            response = await fetch(`${CONFIG.apiUrl}/companies/${idField.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            response = await fetch(`${CONFIG.apiUrl}/companies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        if (!response.ok) throw new Error(isEdit ? 'Failed to update company' : 'Failed to save company');
        
        const result = await response.json();
        showToast(isEdit ? 'Company updated successfully!' : 'Company created successfully!', 'success', 3000);
        closeCompanyModal();
        await loadCompanies();
        
        if (!isEdit && result.item && result.item.id) {
            // Auto-select the newly created company
            selectCompanyInDropdown(result.item.id);
        } else if (isEdit && selectedCompanyId) {
            // Keep the same company selected if editing
            const companySelect = document.getElementById('selectedCompany');
            if (companySelect) {
                companySelect.value = selectedCompanyId;
            }
            onCompanySelected();
        }
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleCompanySubmit = handleCompanySubmit;

function editCompany(id) {
    openCompanyModal(id);
}
window.editCompany = editCompany;

async function deleteCompany(id) {
    if (!confirm('Are you sure you want to delete this company?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/companies/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete company');
        showToast('Company deleted successfully!', 'success', 3000);
        selectedCompanyId = null;
        const companySelect = document.getElementById('selectedCompany');
        if (companySelect) {
            companySelect.value = '';
        }
        await loadCompanies();
        onCompanySelected(); // This will hide the company details section
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.deleteCompany = deleteCompany;

// ========== WAREHOUSES ==========
async function loadWarehouses() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/warehouses`);
        warehouses = await response.json();
        updateWarehouseDropdowns();
    } catch (error) {
        console.error('Error loading warehouses:', error);
    }
}

async function loadWarehousesForCompany() {
    if (!selectedCompanyId) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/warehouses?company_id=${selectedCompanyId}`);
        const companyWarehouses = await response.json();
        
        const listEl = document.getElementById('warehousesList');
        const noWarehousesEl = document.getElementById('noWarehouses');
        
        if (listEl) {
            if (companyWarehouses.length === 0) {
                listEl.innerHTML = '';
                if (noWarehousesEl) noWarehousesEl.style.display = 'block';
            } else {
                if (noWarehousesEl) noWarehousesEl.style.display = 'none';
                listEl.innerHTML = companyWarehouses.map(w => `
                    <div class="item-card">
                        <div class="item-header">
                            <div>
                                <h3>${escapeHtml(w.warehouse_name)}</h3>
                                <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0 0;">${escapeHtml(w.warehouse_code)}</p>
                                ${w.address ? `<p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0.25rem 0 0 0;">${escapeHtml(w.address)}</p>` : ''}
                            </div>
                            <div class="item-actions">
                                <button onclick="editWarehouse(${w.id})" class="btn btn-small">Edit</button>
                                <button onclick="deleteWarehouse(${w.id})" class="btn btn-small btn-danger">Delete</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Update warehouse filter dropdowns for bin locations and managers
        const binFilter = document.getElementById('binLocationWarehouseFilter');
        const managerFilter = document.getElementById('managerWarehouseFilter');
        
        if (binFilter) {
            const currentValue = binFilter.value;
            binFilter.innerHTML = '<option value="">All Warehouses</option>' + 
                companyWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
            if (currentValue) binFilter.value = currentValue;
        }
        
        if (managerFilter) {
            const currentValue = managerFilter.value;
            managerFilter.innerHTML = '<option value="">All Warehouses</option>' + 
                companyWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
            if (currentValue) managerFilter.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading warehouses for company:', error);
    }
}
window.loadWarehousesForCompany = loadWarehousesForCompany;

// Load warehouses for setup page (with company filter)
async function loadWarehousesForSetup() {
    try {
        const companyFilter = document.getElementById('warehouseCompanyFilter')?.value || '';
        let url = `${CONFIG.apiUrl}/warehouses`;
        if (companyFilter) {
            url += `?company_id=${companyFilter}`;
        }
        
        const response = await fetch(url);
        const warehouseList = await response.json();
        
        const listEl = document.getElementById('warehousesList');
        const noWarehousesEl = document.getElementById('noWarehouses');
        
        if (listEl) {
            if (warehouseList.length === 0) {
                listEl.innerHTML = '';
                if (noWarehousesEl) noWarehousesEl.style.display = 'block';
            } else {
                if (noWarehousesEl) noWarehousesEl.style.display = 'none';
                listEl.innerHTML = warehouseList.map(w => {
                    const company = companies.find(c => c.id === w.company_id);
                    return `
                        <div class="item-card">
                            <div class="item-header">
                                <div>
                                    <h3>${escapeHtml(w.warehouse_name)}</h3>
                                    <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0 0;">${escapeHtml(company ? company.company_name : 'N/A')}</p>
                                </div>
                                <span class="item-id">${escapeHtml(w.warehouse_code)}</span>
                            </div>
                            <div class="item-actions">
                                <button onclick="editWarehouse(${w.id})" class="btn btn-small">Edit</button>
                                <button onclick="deleteWarehouse(${w.id})" class="btn btn-small btn-danger">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading warehouses for setup:', error);
    }
}
window.loadWarehousesForSetup = loadWarehousesForSetup;

function updateWarehouseDropdowns() {
    const selects = document.querySelectorAll('select[id*="Warehouse"], select[id*="warehouse"]');
    selects.forEach(select => {
        // Skip filter dropdowns - they're updated separately
        if (select.id === 'binLocationWarehouseFilter' || select.id === 'managerWarehouseFilter') {
            return;
        }
        
        const currentValue = select.value;
        let filteredWarehouses = warehouses;
        
        // If we have a selected company, filter by it
        if (selectedCompanyId && select.id !== 'warehouseCompanyFilter') {
            filteredWarehouses = warehouses.filter(w => w.company_id === selectedCompanyId);
        }
        
        select.innerHTML = '<option value="">Select Warehouse</option>' + 
            filteredWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

function updateWarehouseFilterDropdowns() {
    // Update filter dropdowns with warehouses for selected company
    const binFilter = document.getElementById('binLocationWarehouseFilter');
    const managerFilter = document.getElementById('managerWarehouseFilter');
    
    const companyWarehouses = warehouses.filter(w => w.company_id === selectedCompanyId);
    
    if (binFilter) {
        const currentValue = binFilter.value;
        binFilter.innerHTML = '<option value="">All Warehouses</option>' + 
            companyWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
        if (currentValue) binFilter.value = currentValue;
    }
    
    if (managerFilter) {
        const currentValue = managerFilter.value;
        managerFilter.innerHTML = '<option value="">All Warehouses</option>' + 
            companyWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
        if (currentValue) managerFilter.value = currentValue;
    }
}

function openWarehouseModal(id = null) {
    if (id) {
        openEditWarehouseModal(id);
    } else {
        openAddWarehouseModal();
    }
}
window.openWarehouseModal = openWarehouseModal;

function openAddWarehouseModal() {
    const modal = document.getElementById('warehouseModal');
    const form = document.getElementById('warehouseForm');
    const title = document.getElementById('warehouseModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Add Warehouse';
        form.reset();
        // Remove any hidden ID field if it exists
        const idField = document.getElementById('editWarehouseId');
        if (idField) idField.remove();
        
        // Pre-select the current company if one is selected (if there's a company field)
        if (selectedCompanyId) {
            const companyField = document.getElementById('warehouseCompany');
            if (companyField) {
                companyField.value = selectedCompanyId;
            }
        }
        
        modal.style.display = 'flex';
    }
}
window.openAddWarehouseModal = openAddWarehouseModal;

function closeWarehouseModal() {
    const modal = document.getElementById('warehouseModal');
    if (modal) modal.style.display = 'none';
}
window.closeWarehouseModal = closeWarehouseModal;
window.closeAddWarehouseModal = closeAddWarehouseModal;

function openEditWarehouseModal(id) {
    const warehouse = warehouses.find(w => w.id === id);
    if (!warehouse) return;
    
    const companySelect = document.getElementById('editWarehouseCompany');
    companySelect.innerHTML = '<option value="">Select Company</option>' + 
        companies.map(c => `<option value="${c.id}">${escapeHtml(c.company_name)}</option>`).join('');
    
    document.getElementById('editWarehouseId').value = id;
    document.getElementById('editWarehouseCode').value = warehouse.warehouse_code;
    document.getElementById('editWarehouseName').value = warehouse.warehouse_name;
    document.getElementById('editWarehouseCompany').value = warehouse.company_id;
    document.getElementById('editWarehouseAddress').value = warehouse.address || '';
    document.getElementById('editWarehouseModal').style.display = 'flex';
}
window.openEditWarehouseModal = openEditWarehouseModal;


async function handleAddWarehouse(event) {
    event.preventDefault();
    const formData = {
        warehouse_code: document.getElementById('addWarehouseCode').value.trim(),
        warehouse_name: document.getElementById('addWarehouseName').value.trim(),
        company_id: parseInt(document.getElementById('addWarehouseCompany').value),
        address: document.getElementById('addWarehouseAddress').value.trim() || null,
    };
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/warehouses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to save warehouse');
        
        showToast('Warehouse created successfully!', 'success', 3000);
        closeWarehouseModal();
        await loadWarehouses();
        loadWarehousesForCompany();
        loadBinLocationsForCompany();
        loadManagersForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleAddWarehouse = handleAddWarehouse;

async function handleEditWarehouse(event) {
    event.preventDefault();
    const id = document.getElementById('editWarehouseId').value;
    const formData = {
        warehouse_code: document.getElementById('editWarehouseCode').value.trim(),
        warehouse_name: document.getElementById('editWarehouseName').value.trim(),
        company_id: parseInt(document.getElementById('editWarehouseCompany').value),
        address: document.getElementById('editWarehouseAddress').value.trim() || null,
    };
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/warehouses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update warehouse');
        
        showToast('Warehouse updated successfully!', 'success', 3000);
        closeWarehouseModal();
        await loadWarehouses();
        loadWarehousesForCompany();
        loadBinLocationsForCompany();
        loadManagersForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleEditWarehouse = handleEditWarehouse;

function editWarehouse(id) {
    openWarehouseModal(id);
}
window.editWarehouse = editWarehouse;

async function deleteWarehouse(id) {
    if (!confirm('Are you sure you want to delete this warehouse? This will also delete associated bin locations and managers.')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/warehouses/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete warehouse');
        showToast('Warehouse deleted successfully!', 'success', 3000);
        await loadWarehouses();
        loadWarehousesForCompany();
        loadBinLocationsForCompany();
        loadManagersForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.deleteWarehouse = deleteWarehouse;

// ========== BIN LOCATIONS ==========
async function loadBinLocations() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-locations`);
        binLocations = await response.json();
        updateBinLocationDropdowns();
    } catch (error) {
        console.error('Error loading bin locations:', error);
    }
}

async function loadBinLocationsForCompany() {
    if (!selectedCompanyId) return;
    
    try {
        const warehouseFilter = document.getElementById('binLocationWarehouseFilter')?.value || '';
        let url = `${CONFIG.apiUrl}/bin-locations`;
        
        // If warehouse filter is set, use it; otherwise get all bins for company's warehouses
        if (warehouseFilter) {
            url += `?warehouse_id=${warehouseFilter}`;
        } else {
            // Get all warehouses for this company first
            const companyWarehouses = warehouses.filter(w => w.company_id === selectedCompanyId);
            if (companyWarehouses.length > 0) {
                // Fetch bins for all company warehouses
                const allBins = [];
                for (const wh of companyWarehouses) {
                    const response = await fetch(`${CONFIG.apiUrl}/bin-locations?warehouse_id=${wh.id}`);
                    const bins = await response.json();
                    allBins.push(...bins);
                }
                binLocations = allBins;
            } else {
                binLocations = [];
            }
        }
        
        if (warehouseFilter) {
            const response = await fetch(url);
            binLocations = await response.json();
        }
        
        updateBinLocationDropdowns();
        
        const listEl = document.getElementById('binLocationsList');
        const noBinLocationsEl = document.getElementById('noBinLocations');
        
        if (listEl) {
            if (binLocations.length === 0) {
                listEl.innerHTML = '';
                if (noBinLocationsEl) noBinLocationsEl.style.display = 'block';
            } else {
                if (noBinLocationsEl) noBinLocationsEl.style.display = 'none';
                listEl.innerHTML = binLocations.map(b => {
                    const warehouse = warehouses.find(w => w.id === b.warehouse_id);
                    return `
                        <div class="item-card">
                            <div class="item-header">
                                <div>
                                    <h3>${escapeHtml(b.bin_code)}</h3>
                                    <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0 0;">${escapeHtml(warehouse ? warehouse.warehouse_name : 'N/A')}</p>
                                    ${b.aisle ? `<p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0.25rem 0 0 0;">Aisle: ${escapeHtml(b.aisle)}</p>` : ''}
                                </div>
                                <div class="item-actions">
                                    <button onclick="editBinLocation(${b.id})" class="btn btn-small">Edit</button>
                                    <button onclick="deleteBinLocation(${b.id})" class="btn btn-small btn-danger">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading bin locations for company:', error);
    }
}
window.loadBinLocationsForCompany = loadBinLocationsForCompany;

function updateBinLocationDropdowns() {
    const selects = document.querySelectorAll('select[id*="Bin"], select[id*="bin"]');
    selects.forEach(select => {
        // Skip filter dropdown
        if (select.id === 'binLocationWarehouseFilter') return;
        
        const currentValue = select.value;
        let filteredBins = binLocations;
        
        // If we have a selected company, filter bins by company's warehouses
        if (selectedCompanyId) {
            const companyWarehouseIds = warehouses.filter(w => w.company_id === selectedCompanyId).map(w => w.id);
            filteredBins = binLocations.filter(b => companyWarehouseIds.includes(b.warehouse_id));
        }
        
        select.innerHTML = '<option value="">Select Bin Location</option>' + 
            filteredBins.map(b => `<option value="${b.id}">${escapeHtml(b.bin_code)}${b.bin_name ? ' - ' + escapeHtml(b.bin_name) : ''}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

function openBinLocationModal(id = null) {
    if (id) {
        openEditBinLocationModal(id);
    } else {
        openAddBinLocationModal();
    }
}
window.openBinLocationModal = openBinLocationModal;

function openAddBinLocationModal() {
    const modal = document.getElementById('binLocationModal');
    const form = document.getElementById('binLocationForm');
    const title = document.getElementById('binLocationModalTitle');
    const warehouseSelect = document.getElementById('binWarehouse');
    
    if (modal && form && title && warehouseSelect) {
        title.textContent = 'Add Bin Location';
        form.reset();
        // Remove any hidden ID field if it exists
        const idField = document.getElementById('editBinLocationId');
        if (idField) idField.remove();
        
        // Filter warehouses by selected company
        let filteredWarehouses = warehouses;
        if (selectedCompanyId) {
            filteredWarehouses = warehouses.filter(w => w.company_id === selectedCompanyId);
        }
        
        warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
            filteredWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
        
        modal.style.display = 'flex';
    }
}
window.openAddBinLocationModal = openAddBinLocationModal;

function closeBinLocationModal() {
    const modal = document.getElementById('binLocationModal');
    if (modal) modal.style.display = 'none';
}
window.closeBinLocationModal = closeBinLocationModal;

function openEditBinLocationModal(id) {
    const bin = binLocations.find(b => b.id === id);
    if (!bin) return;
    
    const warehouseSelect = document.getElementById('editBinLocationWarehouse');
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
        warehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
    
    document.getElementById('editBinLocationId').value = id;
    document.getElementById('editBinLocationCode').value = bin.bin_code;
    document.getElementById('editBinLocationName').value = bin.bin_name || '';
    document.getElementById('editBinLocationWarehouse').value = bin.warehouse_id;
    document.getElementById('editBinLocationAisle').value = bin.aisle || '';
    document.getElementById('editBinLocationShelf').value = bin.shelf || '';
    document.getElementById('editBinLocationLevel').value = bin.level || '';
    document.getElementById('editBinLocationModal').style.display = 'flex';
}
window.openEditBinLocationModal = openEditBinLocationModal;


async function handleAddBinLocation(event) {
    event.preventDefault();
    const formData = {
        bin_code: document.getElementById('addBinLocationCode').value.trim(),
        bin_name: document.getElementById('addBinLocationName').value.trim() || null,
        warehouse_id: parseInt(document.getElementById('addBinLocationWarehouse').value),
        aisle: document.getElementById('addBinLocationAisle').value.trim() || null,
        shelf: document.getElementById('addBinLocationShelf').value.trim() || null,
        level: document.getElementById('addBinLocationLevel').value.trim() || null,
    };
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to save bin location');
        
        showToast('Bin location created successfully!', 'success', 3000);
        closeBinLocationModal();
        await loadBinLocations();
        loadBinLocationsForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleAddBinLocation = handleAddBinLocation;

async function handleEditBinLocation(event) {
    event.preventDefault();
    const id = document.getElementById('editBinLocationId').value;
    const formData = {
        bin_code: document.getElementById('editBinLocationCode').value.trim(),
        bin_name: document.getElementById('editBinLocationName').value.trim() || null,
        warehouse_id: parseInt(document.getElementById('editBinLocationWarehouse').value),
        aisle: document.getElementById('editBinLocationAisle').value.trim() || null,
        shelf: document.getElementById('editBinLocationShelf').value.trim() || null,
        level: document.getElementById('editBinLocationLevel').value.trim() || null,
    };
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-locations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update bin location');
        
        showToast('Bin location updated successfully!', 'success', 3000);
        closeBinLocationModal();
        await loadBinLocations();
        loadBinLocationsForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleEditBinLocation = handleEditBinLocation;

function editBinLocation(id) {
    openBinLocationModal(id);
}
window.editBinLocation = editBinLocation;

async function deleteBinLocation(id) {
    if (!confirm('Are you sure you want to delete this bin location?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-locations/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete bin location');
        showToast('Bin location deleted successfully!', 'success', 3000);
        await loadBinLocations();
        loadBinLocationsForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.deleteBinLocation = deleteBinLocation;

// ========== MANAGERS ==========
async function loadManagers() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/managers`);
        managers = await response.json();
        updateManagerDropdowns();
    } catch (error) {
        console.error('Error loading managers:', error);
    }
}

async function loadManagersForCompany() {
    if (!selectedCompanyId) return;
    
    try {
        const warehouseFilter = document.getElementById('managerWarehouseFilter')?.value || '';
        let url = `${CONFIG.apiUrl}/managers`;
        
        if (warehouseFilter) {
            url += `?warehouse_id=${warehouseFilter}`;
        } else {
            // Get all managers for company's warehouses
            const companyWarehouses = warehouses.filter(w => w.company_id === selectedCompanyId);
            if (companyWarehouses.length > 0) {
                const allManagers = [];
                for (const wh of companyWarehouses) {
                    const response = await fetch(`${CONFIG.apiUrl}/managers?warehouse_id=${wh.id}`);
                    const mgrs = await response.json();
                    allManagers.push(...mgrs);
                }
                managers = allManagers;
            } else {
                managers = [];
            }
        }
        
        if (warehouseFilter) {
            const response = await fetch(url);
            managers = await response.json();
        }
        
        updateManagerDropdowns();
        
        const listEl = document.getElementById('managersList');
        const noManagersEl = document.getElementById('noManagers');
        
        if (listEl) {
            if (managers.length === 0) {
                listEl.innerHTML = '';
                if (noManagersEl) noManagersEl.style.display = 'block';
            } else {
                if (noManagersEl) noManagersEl.style.display = 'none';
                listEl.innerHTML = managers.map(m => `
                    <div class="item-card">
                        <div class="item-header">
                            <div>
                                <h3>${escapeHtml(m.manager_name)}</h3>
                                <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0 0;">${escapeHtml(m.warehouse_name || 'N/A')}</p>
                                ${m.email ? `<p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0.25rem 0 0 0;">${escapeHtml(m.email)}</p>` : ''}
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <span class="${m.is_active ? 'status-active' : 'status-inactive'}" style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px;">${m.is_active ? 'Active' : 'Inactive'}</span>
                                <div class="item-actions">
                                    <button onclick="editManager(${m.id})" class="btn btn-small">Edit</button>
                                    <button onclick="deleteManager(${m.id})" class="btn btn-small btn-danger">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading managers for company:', error);
    }
}
window.loadManagersForCompany = loadManagersForCompany;

// Load managers for setup page (with filters)
async function loadManagersForSetup() {
    try {
        const companyFilter = document.getElementById('managerCompanyFilter')?.value || '';
        const warehouseFilter = document.getElementById('managerWarehouseFilter')?.value || '';
        
        let url = `${CONFIG.apiUrl}/managers`;
        const params = [];
        if (companyFilter) params.push(`company_id=${companyFilter}`);
        if (warehouseFilter) params.push(`warehouse_id=${warehouseFilter}`);
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        const response = await fetch(url);
        const managerList = await response.json();
        
        const listEl = document.getElementById('managersList');
        const noManagersEl = document.getElementById('noManagers');
        
        if (listEl) {
            if (managerList.length === 0) {
                listEl.innerHTML = '';
                if (noManagersEl) noManagersEl.style.display = 'block';
            } else {
                if (noManagersEl) noManagersEl.style.display = 'none';
                listEl.innerHTML = managerList.map(m => {
                    const company = companies.find(c => c.id === m.company_id);
                    const warehouse = warehouses.find(w => w.id === m.warehouse_id);
                    return `
                        <div class="item-card">
                            <div class="item-header">
                                <h3>${escapeHtml(m.manager_name)}</h3>
                                ${m.email ? `<span class="item-id">${escapeHtml(m.email)}</span>` : ''}
                            </div>
                            <div class="item-details">
                                <div class="detail-item"><strong>Company:</strong> ${escapeHtml(company ? company.company_name : 'N/A')}</div>
                                <div class="detail-item"><strong>Warehouse:</strong> ${escapeHtml(warehouse ? warehouse.warehouse_name : 'N/A')}</div>
                                ${m.phone ? `<div class="detail-item"><strong>Phone:</strong> ${escapeHtml(m.phone)}</div>` : ''}
                                <div class="detail-item"><strong>Status:</strong> <span class="${m.is_active ? 'status-active' : 'status-inactive'}">${m.is_active ? 'Active' : 'Inactive'}</span></div>
                            </div>
                            <div class="item-actions">
                                <button onclick="editManager(${m.id})" class="btn btn-small">Edit</button>
                                <button onclick="deleteManager(${m.id})" class="btn btn-small btn-danger">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading managers for setup:', error);
    }
}
window.loadManagersForSetup = loadManagersForSetup;

// Update warehouse filter when company filter changes
function updateManagerWarehouseFilter() {
    const companyFilter = document.getElementById('managerCompanyFilter')?.value || '';
    const warehouseFilter = document.getElementById('managerWarehouseFilter');
    
    if (warehouseFilter) {
        const currentValue = warehouseFilter.value;
        let filteredWarehouses = warehouses;
        
        if (companyFilter) {
            filteredWarehouses = warehouses.filter(w => w.company_id == companyFilter);
        }
        
        warehouseFilter.innerHTML = '<option value="">All Warehouses</option>' + 
            filteredWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
        if (currentValue) warehouseFilter.value = currentValue;
        
        loadManagersForSetup();
    }
}
window.updateManagerWarehouseFilter = updateManagerWarehouseFilter;

function updateManagerDropdowns() {
    const selects = document.querySelectorAll('select[id*="Manager"], select[id*="manager"]');
    selects.forEach(select => {
        // Skip filter dropdown
        if (select.id === 'managerWarehouseFilter') return;
        
        const currentValue = select.value;
        let filteredManagers = managers;
        
        // If we have a selected company, filter managers by company's warehouses
        if (selectedCompanyId) {
            const companyWarehouseIds = warehouses.filter(w => w.company_id === selectedCompanyId).map(w => w.id);
            filteredManagers = managers.filter(m => companyWarehouseIds.includes(m.warehouse_id));
        }
        
        select.innerHTML = '<option value="">Select Manager</option>' + 
            filteredManagers.map(m => `<option value="${m.id}">${escapeHtml(m.manager_name)} - ${escapeHtml(m.warehouse_name || 'N/A')}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

function openManagerModal(id = null) {
    if (id) {
        openEditManagerModal(id);
    } else {
        openAddManagerModal();
    }
}
window.openManagerModal = openManagerModal;

function openAddManagerModal() {
    const modal = document.getElementById('managerModal');
    const form = document.getElementById('managerForm');
    const title = document.getElementById('managerModalTitle');
    const warehouseSelect = document.getElementById('managerWarehouse');
    
    if (modal && form && title && warehouseSelect) {
        title.textContent = 'Add Manager';
        form.reset();
        // Remove any hidden ID field if it exists
        const idField = document.getElementById('editManagerId');
        if (idField) idField.remove();
        
        // Filter warehouses by selected company
        let filteredWarehouses = warehouses;
        if (selectedCompanyId) {
            filteredWarehouses = warehouses.filter(w => w.company_id === selectedCompanyId);
        }
        
        warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
            filteredWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
        
        modal.style.display = 'flex';
    }
}
window.openAddManagerModal = openAddManagerModal;

function closeManagerModal() {
    const modal = document.getElementById('managerModal');
    if (modal) modal.style.display = 'none';
}
window.closeManagerModal = closeManagerModal;

function openEditManagerModal(id) {
    const manager = managers.find(m => m.id === id);
    if (!manager) return;
    
    const warehouseSelect = document.getElementById('editManagerWarehouse');
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
        warehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
    
    document.getElementById('editManagerId').value = id;
    document.getElementById('editManagerName').value = manager.manager_name;
    document.getElementById('editManagerWarehouse').value = manager.warehouse_id;
    document.getElementById('editManagerEmail').value = manager.email || '';
    document.getElementById('editManagerPhone').value = manager.phone || '';
    document.getElementById('editManagerModal').style.display = 'flex';
}
window.openEditManagerModal = openEditManagerModal;


async function handleAddManager(event) {
    event.preventDefault();
    const formData = {
        manager_name: document.getElementById('addManagerName').value.trim(),
        warehouse_id: parseInt(document.getElementById('addManagerWarehouse').value),
        email: document.getElementById('addManagerEmail').value.trim() || null,
        phone: document.getElementById('addManagerPhone').value.trim() || null,
    };
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/managers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to save manager');
        
        showToast('Manager created successfully!', 'success', 3000);
        closeManagerModal();
        await loadManagers();
        loadManagersForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleAddManager = handleAddManager;

async function handleEditManager(event) {
    event.preventDefault();
    const id = document.getElementById('editManagerId').value;
    const formData = {
        manager_name: document.getElementById('editManagerName').value.trim(),
        warehouse_id: parseInt(document.getElementById('editManagerWarehouse').value),
        email: document.getElementById('editManagerEmail').value.trim() || null,
        phone: document.getElementById('editManagerPhone').value.trim() || null,
    };
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/managers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update manager');
        
        showToast('Manager updated successfully!', 'success', 3000);
        closeManagerModal();
        await loadManagers();
        loadManagersForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleEditManager = handleEditManager;

function editManager(id) {
    openManagerModal(id);
}
window.editManager = editManager;

async function deleteManager(id) {
    if (!confirm('Are you sure you want to deactivate this manager?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/managers/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to deactivate manager');
        showToast('Manager deactivated successfully!', 'success', 3000);
        await loadManagers();
        loadManagersForCompany();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.deleteManager = deleteManager;

// ========== STOCK TAKE ==========
function updateWarehousesForStock() {
    const companyId = document.getElementById('stockCompany').value;
    const warehouseSelect = document.getElementById('stockWarehouse');
    
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>';
    if (companyId) {
        const companyWarehouses = warehouses.filter(w => w.company_id == companyId);
        companyWarehouses.forEach(w => {
            warehouseSelect.innerHTML += `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`;
        });
    }
    
    // Clear dependent fields
    document.getElementById('stockWarehouse').value = '';
    updateManagersAndBins();
}
window.updateWarehousesForStock = updateWarehousesForStock;

function updateManagersAndBins() {
    const warehouseId = document.getElementById('stockWarehouse').value;
    const managerSelect = document.getElementById('stockManager');
    const binSelect = document.getElementById('stockBinLocation');
    
    // Update managers (only for selected warehouse)
    managerSelect.innerHTML = '<option value="">Select Manager</option>';
    if (warehouseId) {
        const warehouseManagers = managers.filter(m => m.warehouse_id == warehouseId);
        warehouseManagers.forEach(m => {
            managerSelect.innerHTML += `<option value="${m.id}">${escapeHtml(m.manager_name)}</option>`;
        });
    }
    
    // Update bin locations (only for selected warehouse)
    binSelect.innerHTML = '<option value="">Select Bin Location</option>';
    if (warehouseId) {
        const warehouseBins = binLocations.filter(b => b.warehouse_id == warehouseId);
        warehouseBins.forEach(b => {
            binSelect.innerHTML += `<option value="${b.id}">${escapeHtml(b.bin_code)}${b.bin_name ? ' - ' + escapeHtml(b.bin_name) : ''}</option>`;
        });
    }
}
window.updateManagersAndBins = updateManagersAndBins;

async function handleStockTake(event) {
    event.preventDefault();
    
    const btn = document.getElementById('stockTakeBtn');
    const text = document.getElementById('stockTakeText');
    const spinner = document.getElementById('stockTakeSpinner');
    const result = document.getElementById('stockTakeResult');
    
    const formData = {
        item_name: document.getElementById('stockItemName').value.trim(),
        item_code: document.getElementById('stockItemCode').value.trim() || null,
        quantity: parseInt(document.getElementById('stockQuantity').value) || 0,
        company_id: parseInt(document.getElementById('stockCompany').value),
        warehouse_id: parseInt(document.getElementById('stockWarehouse').value),
        counted_by_manager_id: parseInt(document.getElementById('stockManager').value),
        bin_location_id: document.getElementById('stockBinLocation').value ? parseInt(document.getElementById('stockBinLocation').value) : null,
        date: document.getElementById('stockDate').value || null,
        notes: document.getElementById('stockNotes').value.trim() || null,
    };
    
    btn.disabled = true;
    text.style.display = 'none';
    spinner.style.display = 'inline';
    result.style.display = 'none';
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add item');
        }
        
        result.style.display = 'block';
        result.className = 'result-message success';
        result.textContent = `✅ Successfully added item "${formData.item_name}"!`;
        
        document.getElementById('stockTakeForm').reset();
        document.getElementById('stockDate').value = new Date().toISOString().split('T')[0];
        
    } catch (error) {
        result.style.display = 'block';
        result.className = 'result-message error';
        result.textContent = `❌ Error: ${error.message}`;
    } finally {
        btn.disabled = false;
        text.style.display = 'inline';
        spinner.style.display = 'none';
    }
}
window.handleStockTake = handleStockTake;

// ========== VIEW ITEMS ==========
async function loadItems() {
    const loadingEl = document.getElementById('viewItemsLoading');
    const itemsListEl = document.getElementById('viewItemsList');
    const noItemsEl = document.getElementById('viewItemsEmpty');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (noItemsEl) noItemsEl.style.display = 'none';
    if (itemsListEl) itemsListEl.innerHTML = '';
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        
        allItems = await response.json();
        
        // Apply filters
        applyViewFilters();
        
    } catch (error) {
        console.error('Error loading items:', error);
        showToast('Error loading items: ' + error.message, 'error', 5000);
        if (itemsListEl) itemsListEl.innerHTML = '<div class="error-message">Failed to load items. Please try again.</div>';
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}
window.loadItems = loadItems;

function applyViewFilters() {
    const companyFilter = document.getElementById('viewCompanyFilter')?.value || '';
    const warehouseFilter = document.getElementById('viewWarehouseFilter')?.value || '';
    const searchTerm = document.getElementById('viewItemsSearch')?.value.toLowerCase().trim() || '';
    
    let filtered = [...allItems];
    
    // Filter by company
    if (companyFilter) {
        filtered = filtered.filter(item => item.company_id == companyFilter);
    }
    
    // Filter by warehouse
    if (warehouseFilter) {
        filtered = filtered.filter(item => item.warehouse_id == warehouseFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(item => 
            (item.item_code && item.item_code.toLowerCase().includes(searchTerm)) ||
            (item.item_name && item.item_name.toLowerCase().includes(searchTerm))
        );
    }
    
    displayViewItems(filtered);
}
window.applyViewFilters = applyViewFilters;

function displayViewItems(items) {
    const itemsListEl = document.getElementById('viewItemsList');
    const noItemsEl = document.getElementById('viewItemsEmpty');
    
    if (!itemsListEl) return;
    
    if (items.length === 0) {
        itemsListEl.innerHTML = '';
        if (noItemsEl) noItemsEl.style.display = 'block';
        return;
    }
    
    if (noItemsEl) noItemsEl.style.display = 'none';
    
    // Get company and warehouse names for display
    const getCompanyName = (id) => {
        const company = companies.find(c => c.id == id);
        return company ? company.company_name : `Company ${id}`;
    };
    
    const getWarehouseName = (id) => {
        const warehouse = warehouses.find(w => w.id == id);
        return warehouse ? warehouse.warehouse_name : `Warehouse ${id}`;
    };
    
    const getBinLocationCode = (id) => {
        if (!id) return 'N/A';
        const bin = binLocations.find(b => b.id == id);
        return bin ? bin.bin_code : `Bin ${id}`;
    };
    
    // Create table header
    const tableHTML = `
        <table class="view-items-table">
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Item Code</th>
                    <th>Quantity</th>
                    <th>Company</th>
                    <th>Warehouse</th>
                    <th>Bin Location</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr class="view-item-row">
                        <td class="view-item-name-cell">
                            <div class="item-name-text">${escapeHtml(item.item_name || 'Unnamed Item')}</div>
                            ${item.notes ? `<div class="item-notes-text">${escapeHtml(item.notes)}</div>` : ''}
                        </td>
                        <td class="view-item-code-cell">${item.item_code ? escapeHtml(item.item_code) : '—'}</td>
                        <td class="view-item-quantity-cell">
                            <span class="quantity-badge">${item.quantity || 0}</span>
                        </td>
                        <td class="view-item-company-cell">${escapeHtml(getCompanyName(item.company_id))}</td>
                        <td class="view-item-warehouse-cell">${escapeHtml(getWarehouseName(item.warehouse_id))}</td>
                        <td class="view-item-bin-cell">${item.bin_location_id ? escapeHtml(getBinLocationCode(item.bin_location_id)) : '—'}</td>
                        <td class="view-item-date-cell">${item.date ? escapeHtml(item.date) : '—'}</td>
                        <td class="view-item-actions-cell">
                            <button onclick="openEditItemModal(${item.id})" class="btn btn-tiny btn-secondary">Edit</button>
                            <button onclick="deleteItem(${item.id})" class="btn btn-tiny btn-danger">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    itemsListEl.innerHTML = tableHTML;
}

function updateViewFilters() {
    // Update warehouse filter
    const warehouseFilter = document.getElementById('viewWarehouseFilter');
    if (warehouseFilter) {
        const currentValue = warehouseFilter.value;
        warehouseFilter.innerHTML = '<option value="">All Warehouses</option>' + 
            warehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
        if (currentValue) warehouseFilter.value = currentValue;
    }
    
    // Update manager filter
    const managerFilter = document.getElementById('viewManagerFilter');
    if (managerFilter) {
        const currentValue = managerFilter.value;
        managerFilter.innerHTML = '<option value="">All Managers</option>' + 
            managers.map(m => `<option value="${m.id}">${escapeHtml(m.manager_name)}</option>`).join('');
        if (currentValue) managerFilter.value = currentValue;
    }
}

function displayItems(items) {
    const itemsListEl = document.getElementById('stockItemsList');
    const noItemsEl = document.getElementById('noStockItems');
    
    if (!itemsListEl) return;
    
    if (items.length === 0) {
        itemsListEl.innerHTML = '';
        if (noItemsEl) noItemsEl.style.display = 'block';
        return;
    }
    
    if (noItemsEl) noItemsEl.style.display = 'none';
    
    itemsListEl.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-header">
                <h3>${escapeHtml(item.item_name || 'Unnamed Item')}</h3>
                <span class="item-id">ID: ${item.id}</span>
            </div>
            <div class="item-details">
                <div class="detail-item">
                    <strong>Quantity:</strong> <span class="quantity-badge">${item.quantity || 0}</span>
                </div>
                ${item.item_code ? `<div class="detail-item"><strong>Item Code:</strong> ${escapeHtml(item.item_code)}</div>` : ''}
                <div class="detail-item"><strong>Company:</strong> ${escapeHtml(item.company_name || 'N/A')}</div>
                <div class="detail-item"><strong>Warehouse:</strong> ${escapeHtml(item.warehouse_name || 'N/A')}</div>
                ${item.bin_location_code ? `<div class="detail-item"><strong>Bin Location:</strong> ${escapeHtml(item.bin_location_code)}</div>` : ''}
                ${item.counted_by ? `<div class="detail-item"><strong>Counted By:</strong> ${escapeHtml(item.counted_by)}</div>` : ''}
                ${item.date ? `<div class="detail-item"><strong>Date:</strong> ${escapeHtml(item.date)}</div>` : ''}
                ${item.notes ? `<div class="detail-item"><strong>Notes:</strong> ${escapeHtml(item.notes)}</div>` : ''}
                ${item.created_at ? `<div class="detail-item"><strong>Added:</strong> ${formatDate(item.created_at)}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function handleStockSearch() {
    loadItems(); // Reload with search term
}
window.handleStockSearch = handleStockSearch;

function openEditItemModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.item_name || '';
    document.getElementById('editItemCode').value = item.item_code || '';
    document.getElementById('editQuantity').value = item.quantity || 0;
    
    document.getElementById('editItemModal').style.display = 'flex';
}
window.openEditItemModal = openEditItemModal;

function closeEditItemModal() {
    document.getElementById('editItemModal').style.display = 'none';
}
window.closeEditItemModal = closeEditItemModal;

async function handleUpdateItem(event) {
    event.preventDefault();
    
    const itemId = document.getElementById('editItemId').value;
    const formData = {
        item_name: document.getElementById('editItemName').value.trim(),
        item_code: document.getElementById('editItemCode').value.trim() || null,
        quantity: parseInt(document.getElementById('editQuantity').value) || 0,
    };
    
    // Get existing item to preserve other fields
    const existing = allItems.find(i => i.id == itemId);
    if (existing) {
        formData.company_id = existing.company_id;
        formData.warehouse_id = existing.warehouse_id;
        formData.bin_location_id = existing.bin_location_id;
        formData.counted_by_manager_id = existing.counted_by_manager_id;
        formData.date = existing.date;
        formData.notes = existing.notes;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update item');
        
        showToast('Item updated successfully!', 'success', 3000);
        closeEditItemModal();
        loadItems();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
const editItemForm = document.getElementById('editItemForm');
if (editItemForm) {
    editItemForm.onsubmit = handleUpdateItem;
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items/${itemId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete item');
        showToast('Item deleted successfully!', 'success', 3000);
        loadItems();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.deleteItem = deleteItem;

// ========== NEW STOCK TAKE WORKFLOW ==========
// Note: currentStockTake, currentBinLocation, and currentBinItems are already declared at the top of the file

async function checkActiveStockTake() {
    // This will be called when stock take tab is opened
    // Ensure variables are initialized
    if (typeof currentStockTake === 'undefined') {
        currentStockTake = null;
    }
    // Status will be updated by updateStockTakeStatus() when tab is shown
}

function updateWarehousesForOpenStockTake() {
    const companyId = document.getElementById('openStockTakeCompany').value;
    const warehouseSelect = document.getElementById('openStockTakeWarehouse');
    
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>';
    if (companyId) {
        const companyWarehouses = warehouses.filter(w => w.company_id == companyId);
        companyWarehouses.forEach(w => {
            warehouseSelect.innerHTML += `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`;
        });
    }
    
    // Clear validation message
    const validationMsg = document.getElementById('managerValidationMessage');
    if (validationMsg) {
        validationMsg.style.display = 'none';
    }
}
window.updateWarehousesForOpenStockTake = updateWarehousesForOpenStockTake;

function validateManagerForWarehouse() {
    const warehouseId = document.getElementById('openStockTakeWarehouse').value;
    const validationMsg = document.getElementById('managerValidationMessage');
    
    if (!validationMsg) return;
    
    if (!warehouseId) {
        validationMsg.style.display = 'none';
        return;
    }
    
    // Check if there are any managers for this warehouse
    const warehouseManagers = managers.filter(m => m.warehouse_id == warehouseId && m.is_active !== 0);
    
    if (warehouseManagers.length === 0) {
        validationMsg.style.display = 'block';
        validationMsg.className = 'validation-message error';
        validationMsg.innerHTML = '⚠️ No active managers found for this warehouse. Please add a manager in Setup before opening a stock take.';
    } else {
        validationMsg.style.display = 'block';
        validationMsg.className = 'validation-message success';
        validationMsg.innerHTML = `✅ ${warehouseManagers.length} manager(s) available for this warehouse: ${warehouseManagers.map(m => escapeHtml(m.manager_name)).join(', ')}`;
    }
}
window.validateManagerForWarehouse = validateManagerForWarehouse;

async function openStockTake() {
    const companyId = document.getElementById('openStockTakeCompany').value;
    const warehouseId = document.getElementById('openStockTakeWarehouse').value;
    
    if (!companyId || !warehouseId) {
        showToast('Please select Company and Warehouse', 'warning', 3000);
        return;
    }
    
    // Validate that at least one manager exists for this warehouse
    const warehouseManagers = managers.filter(m => m.warehouse_id == warehouseId && m.is_active !== 0);
    
    if (warehouseManagers.length === 0) {
        showToast('Cannot open stock take: No active managers found for this warehouse. Please add a manager in Setup first.', 'error', 6000);
        return;
    }
    
    // Use the first active manager (or you could let the user choose later)
    const managerId = warehouseManagers[0].id;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/stock-takes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company_id: parseInt(companyId),
                warehouse_id: parseInt(warehouseId),
                opened_by_manager_id: managerId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to open stock take');
        }
        
        const data = await response.json();
        currentStockTake = data.stockTake;
        
        updateStockTakeStatus();
        
        // Notify user and refresh open stock takes list if visible
        alert(`✅ Stock take opened successfully!\n\nManager: ${warehouseManagers[0].manager_name}\n\nStock Take ID: ${currentStockTake.id}`);
        
        // If on open stock takes tab, refresh the list
        if (document.getElementById('openStockTakesTab')?.classList.contains('active')) {
            loadOpenStockTakes();
        }
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.openStockTake = openStockTake;

async function closeStockTake() {
    if (!currentStockTake || !confirm('Are you sure you want to close this stock take?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/stock-takes/${currentStockTake.id}/close`, {
            method: 'PUT'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to close stock take');
        }
        
        currentStockTake = null;
        currentBinLocation = null;
        currentBinItems = [];
        
        updateStockTakeStatus();
        clearBinLocation();
        alert('✅ Stock take closed successfully!');
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.closeStockTake = closeStockTake;

function updateStockTakeStatus() {
    // Ensure currentStockTake is defined (should always be, but check for safety)
    if (typeof currentStockTake === 'undefined') {
        currentStockTake = null;
    }
    
    const statusBox = document.getElementById('stockTakeStatus');
    const openBtn = document.getElementById('openStockTakeBtn');
    const closeBtn = document.getElementById('closeStockTakeBtn');
    const binSection = document.getElementById('binLocationSection');
    const itemSection = document.getElementById('itemScanSection');
    const binItemsSection = document.getElementById('binItemsSection');
    
    // Only update manager section if it exists (manager mode)
    if (statusBox && openBtn && closeBtn) {
        if (currentStockTake) {
            statusBox.innerHTML = `
                <p><strong>✅ Stock Take Open</strong></p>
                <p>Company: ${escapeHtml(currentStockTake.company_name)}</p>
                <p>Warehouse: ${escapeHtml(currentStockTake.warehouse_name)}</p>
                <p>Opened: ${formatDate(currentStockTake.opened_at)}</p>
            `;
            statusBox.className = 'status-box success';
            openBtn.style.display = 'none';
            closeBtn.style.display = 'inline-block';
        } else {
            statusBox.innerHTML = '<p>No stock take open</p>';
            statusBox.className = 'status-box';
            openBtn.style.display = 'inline-block';
            closeBtn.style.display = 'none';
        }
    }
    
    // Handle scanning sections visibility
    if (currentStockTake) {
        // Show scanning sections - ALWAYS show bin location section when stock take is open
        if (binSection) {
            binSection.style.display = 'block';
            binSection.style.visibility = 'visible';
        }
        
        // Scroll to bin location section to make it visible (manager mode)
        if (currentRole === 'manager') {
            setTimeout(() => {
                if (binSection) {
                    binSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                // Focus on bin location input for immediate scanning
                const binInput = document.getElementById('binLocationInput');
                if (binInput) {
                    binInput.focus();
                    binInput.select();
                }
            }, 100);
        }
    } else {
        // Hide scanning sections when no stock take
        if (binSection) binSection.style.display = 'none';
        if (itemSection) itemSection.style.display = 'none';
        if (binItemsSection) binItemsSection.style.display = 'none';
    }
}

// Counter mode: Scan bin location to start counting (requires open stock take)
async function handleCounterBinLocationScan() {
    const binCode = document.getElementById('counterBinLocationInput').value.trim();
    
    if (!binCode) {
        showToast('Please enter or scan a bin location code', 'warning', 3000);
        return;
    }
    
    try {
        // First, lookup the bin location to get company/warehouse
        const lookupResponse = await fetch(`${CONFIG.apiUrl}/bin-locations/lookup?bin_code=${encodeURIComponent(binCode)}`);
        
        if (!lookupResponse.ok) {
            const error = await lookupResponse.json();
            throw new Error(error.error || 'Bin location not found');
        }
        
        const binLocation = await lookupResponse.json();
        
        console.log('Bin location found:', binLocation);
        console.log('Bin location company_id:', binLocation.company_id, 'type:', typeof binLocation.company_id);
        console.log('Bin location warehouse_id:', binLocation.warehouse_id, 'type:', typeof binLocation.warehouse_id);
        
        // Check if there's an open stock take for this warehouse/company
        // Stock takes are opened at Company + Warehouse level, not bin location level
        let stockTake = null;
        try {
        // Ensure we're using the correct IDs from the bin location
        // Convert to integers to ensure proper comparison
        const companyId = parseInt(binLocation.company_id);
        const warehouseId = parseInt(binLocation.warehouse_id);
        
        console.log('Bin location data:', binLocation);
        console.log('Checking for open stock take with company_id:', companyId, '(type:', typeof companyId, ')', 'warehouse_id:', warehouseId, '(type:', typeof warehouseId, ')');
            
            const stockTakeResponse = await fetch(`${CONFIG.apiUrl}/stock-takes/active?company_id=${companyId}&warehouse_id=${warehouseId}`);
            
            console.log('Stock take response status:', stockTakeResponse.status);
            
            if (stockTakeResponse.ok) {
                const responseData = await stockTakeResponse.json();
                console.log('Stock take response:', responseData);
                
                // Check if response has debug info (when no stock take found)
                if (responseData.debug) {
                    console.log('Debug info from server:', responseData.debug);
                    stockTake = null;
                    console.log('No matching stock take found. All open stock takes:', responseData.debug.all_open_stock_takes);
                } else if (responseData.result === null) {
                    stockTake = null;
                    console.log('No stock take found (explicit null result)');
                } else if (!responseData || responseData === null || (typeof responseData === 'object' && Object.keys(responseData).length === 0)) {
                    stockTake = null;
                    console.log('No stock take found (null or empty response)');
                } else {
                    // Use result if available, otherwise use responseData directly
                    stockTake = responseData.result || responseData;
                    console.log('Found stock take:', stockTake);
                    console.log('Stock take company_id:', stockTake.company_id, 'type:', typeof stockTake.company_id);
                    console.log('Stock take warehouse_id:', stockTake.warehouse_id, 'type:', typeof stockTake.warehouse_id);
                }
            } else if (stockTakeResponse.status === 404) {
                // 404 means no stock take found - this is expected, not an error
                stockTake = null;
                console.log('No stock take found (404 response)');
            } else {
                // Other HTTP error - try to get error message
                let errorMessage = 'Failed to check for open stock take';
                try {
                    const errorData = await stockTakeResponse.json();
                    errorMessage = errorData.error || errorMessage;
                    console.error('Error response:', errorData);
                } catch (e) {
                    errorMessage = `Server error (${stockTakeResponse.status}): ${stockTakeResponse.statusText}`;
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            // If it's already our custom error, re-throw it
            if (error.message.includes('Failed to check') || error.message.includes('Server error')) {
                throw error;
            }
            // Network or other errors - show helpful message
            console.error('Error checking for open stock take:', error);
            throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        }
        
        // Counter can ONLY count against existing open stock takes
        if (!stockTake) {
            // Get debug info if available
            let debugInfo = '';
            try {
                const debugResponse = await fetch(`${CONFIG.apiUrl}/stock-takes/active?company_id=${companyId}&warehouse_id=${warehouseId}`);
                if (debugResponse.ok) {
                    const debugData = await debugResponse.json();
                    if (debugData.debug && debugData.debug.all_open_stock_takes) {
                        debugInfo = `\n\nDebug: Found ${debugData.debug.all_open_stock_takes.length} open stock take(s) in database:\n`;
                        debugData.debug.all_open_stock_takes.forEach((st, idx) => {
                            debugInfo += `${idx + 1}. ID: ${st.id}, Company ID: ${st.company_id}, Warehouse ID: ${st.warehouse_id}, Company: ${st.company_name || 'N/A'}, Warehouse: ${st.warehouse_name || 'N/A'}\n`;
                        });
                        debugInfo += `\nRequested: Company ID: ${companyId}, Warehouse ID: ${warehouseId}`;
                    }
                }
            } catch (e) {
                console.error('Error getting debug info:', e);
            }
            
            throw new Error(`No open stock take found for this bin location.\n\nBin: ${binLocation.bin_code}\nWarehouse: ${binLocation.warehouse_name} (ID: ${warehouseId})\nCompany: ${binLocation.company_name} (ID: ${companyId})\n\nPlease ask a manager to open a stock take for this Company and Warehouse combination first.${debugInfo}`);
        }
        
        // Verify bin location belongs to the stock take's warehouse/company
        // Use loose comparison to handle string/number mismatches
        const binCompanyId = parseInt(binLocation.company_id);
        const binWarehouseId = parseInt(binLocation.warehouse_id);
        const stockTakeCompanyId = parseInt(stockTake.company_id);
        const stockTakeWarehouseId = parseInt(stockTake.warehouse_id);
        
        console.log('Comparing IDs - Bin:', binCompanyId, binWarehouseId, 'Stock Take:', stockTakeCompanyId, stockTakeWarehouseId);
        
        if (binCompanyId !== stockTakeCompanyId || binWarehouseId !== stockTakeWarehouseId) {
            throw new Error(`Bin location does not match the open stock take.\n\nBin: ${binLocation.bin_code}\nBin Company ID: ${binCompanyId}, Warehouse ID: ${binWarehouseId}\nStock Take Company ID: ${stockTakeCompanyId}, Warehouse ID: ${stockTakeWarehouseId}\n\nPlease scan a bin from the correct warehouse.`);
        }
        
        // Set current stock take and bin location
        currentStockTake = stockTake;
        currentBinLocation = binLocation;
        
        // Update UI
        updateStockTakeStatus();
        
        // Show bin location info
        document.getElementById('currentBinCode').textContent = binLocation.bin_code;
        document.getElementById('currentBinInfo').textContent = `${binLocation.warehouse_name} - ${binLocation.company_name}`;
        document.getElementById('currentBinLocation').style.display = 'block';
        document.getElementById('clearBinBtn').style.display = 'inline-block';
        
        // Hide counter start section, show scanning sections
        document.getElementById('counterStartSection').style.display = 'none';
        document.getElementById('binLocationSection').style.display = 'block';
        
        // Show item scan section and bin items section
        const itemSection = document.getElementById('itemScanSection');
        const binItemsSection = document.getElementById('binItemsSection');
        if (itemSection) itemSection.style.display = 'block';
        if (binItemsSection) binItemsSection.style.display = 'block';
        
        // Scroll to item scan section
        setTimeout(() => {
            if (itemSection) {
                itemSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Focus on item code input
                const itemCodeInput = document.getElementById('itemCodeInput');
                if (itemCodeInput) itemCodeInput.focus();
            }
        }, 300);
        
        // Load items for this bin
        loadBinItems();
        
        // Clear counter bin location input
        document.getElementById('counterBinLocationInput').value = '';
        
        // Show success toast
        showToast(`Started counting bin location: ${binLocation.bin_code}`, 'success', 3000);
    } catch (error) {
        showToast(error.message, 'error', 6000);
        // Keep focus on input for retry
        setTimeout(() => {
            const counterBinInput = document.getElementById('counterBinLocationInput');
            if (counterBinInput) counterBinInput.focus();
        }, 100);
    }
}
window.handleCounterBinLocationScan = handleCounterBinLocationScan;

// Manager mode: Scan bin location (requires stock take to be open first)
async function handleBinLocationScan() {
    const binCode = document.getElementById('binLocationInput').value.trim();
    
    if (!binCode) {
        showToast('Please enter or scan a bin location code', 'warning', 3000);
        return;
    }
    
    if (!currentStockTake) {
        showToast('Please open a stock take first', 'warning', 3000);
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-locations/lookup?bin_code=${encodeURIComponent(binCode)}&stock_take_id=${currentStockTake.id}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Bin location not found or invalid');
        }
        
        const binLocation = await response.json();
        currentBinLocation = binLocation;
        
        // Show bin location info
        document.getElementById('currentBinCode').textContent = binLocation.bin_code;
        document.getElementById('currentBinInfo').textContent = `${binLocation.warehouse_name} - ${binLocation.company_name}`;
        document.getElementById('currentBinLocation').style.display = 'block';
        document.getElementById('clearBinBtn').style.display = 'inline-block';
        
        // Show item scan section and bin items section
        const itemSection = document.getElementById('itemScanSection');
        const binItemsSection = document.getElementById('binItemsSection');
        if (itemSection) itemSection.style.display = 'block';
        if (binItemsSection) binItemsSection.style.display = 'block';
        
        // Scroll to item scan section
        setTimeout(() => {
            if (itemSection) {
                itemSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Focus on item code input
                const itemCodeInput = document.getElementById('itemCodeInput');
                if (itemCodeInput) itemCodeInput.focus();
            }
        }, 300);
        
        // Load items for this bin
        loadBinItems();
        
        // Clear bin location input
        document.getElementById('binLocationInput').value = '';
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleBinLocationScan = handleBinLocationScan;

function clearBinLocation() {
    if (confirm('Clear current bin location? All unsaved items will be lost.')) {
        currentBinLocation = null;
        currentBinItems = [];
        
        document.getElementById('currentBinLocation').style.display = 'none';
        document.getElementById('clearBinBtn').style.display = 'none';
        document.getElementById('itemScanSection').style.display = 'none';
        document.getElementById('binItemsSection').style.display = 'none';
        document.getElementById('binItemsList').innerHTML = '';
        document.getElementById('itemCodeInput').value = '';
        document.getElementById('itemNameInput').value = '';
        document.getElementById('itemQuantityInput').value = '0';
    }
}
window.clearBinLocation = clearBinLocation;

async function handleItemCodeScan() {
    const itemCode = document.getElementById('itemCodeInput').value.trim();
    
    if (!itemCode) {
        showToast('Please enter or scan an item code', 'warning', 3000);
        return;
    }
    
    // Lookup item in catalog
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items-catalog?stock_code=${encodeURIComponent(itemCode)}`);
        
        if (response.ok) {
            const item = await response.json();
            // Auto-populate item name
            const itemNameInput = document.getElementById('itemNameInput');
            if (itemNameInput && item.item_name) {
                itemNameInput.value = item.item_name;
            }
            
            // Show serial number requirement if needed
            if (item.requires_serial_number) {
                showToast('⚠️ This item requires a serial number', 'warning', 4000);
            }
        } else if (response.status === 404) {
            // Item not found in catalog - allow manual entry
            console.log('Item not found in catalog, allowing manual entry');
            const itemNameInput = document.getElementById('itemNameInput');
            if (itemNameInput) {
                itemNameInput.focus();
            }
        } else {
            throw new Error('Failed to lookup item');
        }
    } catch (error) {
        console.error('Error looking up item:', error);
        // Continue anyway - allow manual entry
    }
    
    // Auto-focus on quantity input and open number pad
    setTimeout(() => {
        const quantityInput = document.getElementById('itemQuantityInput');
        if (quantityInput) {
            quantityInput.focus();
            quantityInput.select();
            // Trigger click to open number pad on mobile
            quantityInput.click();
        }
    }, 100);
}
window.handleItemCodeScan = handleItemCodeScan;

// Allow Enter key on item code to trigger lookup and move to quantity
document.getElementById('itemCodeInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleItemCodeScan();
    }
});

// Clear item name when item code input changes
document.getElementById('itemCodeInput')?.addEventListener('input', function(e) {
    const itemNameInput = document.getElementById('itemNameInput');
    if (itemNameInput && !itemNameInput.value) {
        // Only clear if it's empty (don't clear if user manually entered something)
        itemNameInput.value = '';
    }
});

async function addItemToBin() {
    if (!currentStockTake || !currentBinLocation) {
        showToast('Please scan a bin location first', 'warning', 3000);
        return;
    }
    
    const itemCode = document.getElementById('itemCodeInput').value.trim();
    const itemName = document.getElementById('itemNameInput').value.trim();
    const quantity = parseInt(document.getElementById('itemQuantityInput').value) || 0;
    
    if (!itemCode) {
        showToast('Please enter or scan an item code', 'warning', 3000);
        return;
    }
    
    if (quantity < 0) {
        showToast('Quantity must be 0 or greater', 'warning', 3000);
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-location-counts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stock_take_id: currentStockTake.id,
                bin_location_id: currentBinLocation.id,
                item_code: itemCode,
                item_name: itemName || null,
                quantity: quantity,
                counted_by_manager_id: currentStockTake.opened_by_manager_id
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add item');
        }
        
        // Clear inputs
        document.getElementById('itemCodeInput').value = '';
        document.getElementById('itemNameInput').value = '';
        document.getElementById('itemQuantityInput').value = '1';
        
        // Reload bin items
        loadBinItems();
        
        // Automatically launch QR scanner for next item
        setTimeout(() => {
            const itemCodeInput = document.getElementById('itemCodeInput');
            if (itemCodeInput) {
                startQRScan('itemCodeInput', handleItemCodeScan);
            }
        }, 300);
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.addItemToBin = addItemToBin;

async function loadBinItems() {
    if (!currentStockTake || !currentBinLocation) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-location-counts?stock_take_id=${currentStockTake.id}&bin_location_id=${currentBinLocation.id}&submitted=0`);
        
        if (!response.ok) throw new Error('Failed to load bin items');
        
        currentBinItems = await response.json();
        
        const listEl = document.getElementById('binItemsList');
        const noItemsEl = document.getElementById('noBinItems');
        
        if (currentBinItems.length === 0) {
            listEl.innerHTML = '';
            noItemsEl.style.display = 'block';
        } else {
            noItemsEl.style.display = 'none';
            listEl.innerHTML = currentBinItems.map(item => `
                <div class="item-card">
                    <div class="item-header">
                        <h3>${escapeHtml(item.item_code)}</h3>
                        <span class="quantity-badge">Qty: ${item.quantity}</span>
                    </div>
                    ${item.item_name ? `<div class="item-details"><div class="detail-item"><strong>Name:</strong> ${escapeHtml(item.item_name)}</div></div>` : ''}
                    <div class="item-actions">
                        <button onclick="removeBinItem(${item.id})" class="btn btn-small btn-danger">Remove</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading bin items:', error);
    }
}
window.loadBinItems = loadBinItems;

async function removeBinItem(itemId) {
    if (!confirm('Remove this item from the bin?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-location-counts/${itemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to remove item');
        
        loadBinItems();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.removeBinItem = removeBinItem;

function clearBinItems() {
    if (!confirm('Clear all items from current bin? This cannot be undone.')) return;
    
    // Delete all unsubmitted items for this bin
    Promise.all(currentBinItems.map(item => 
        fetch(`${CONFIG.apiUrl}/bin-location-counts/${item.id}`, { method: 'DELETE' })
    )).then(() => {
        loadBinItems();
    }).catch(error => {
        showToast('Error clearing items: ' + error.message, 'error', 5000);
    });
}
window.clearBinItems = clearBinItems;

async function submitBinLocation() {
    if (!currentStockTake || !currentBinLocation) {
        showToast('Please scan a bin location first', 'warning', 3000);
        return;
    }
    
    if (currentBinItems.length === 0) {
        showToast('Please add at least one item before submitting', 'warning', 3000);
        return;
    }
    
    if (!confirm(`Submit ${currentBinItems.length} item(s) for bin location ${currentBinLocation.bin_code}?`)) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/bin-location-counts/${currentBinLocation.id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stock_take_id: currentStockTake.id,
                counted_by_manager_id: currentStockTake.opened_by_manager_id
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit bin location');
        }
        
        const data = await response.json();
        showToast(`Successfully submitted ${data.items_submitted} item(s) for bin location ${currentBinLocation.bin_code}!`, 'success', 4000);
        
        // Clear bin location and items
        clearBinLocation();
        
        // Reload items in view tab
        if (document.getElementById('viewTab').classList.contains('active')) {
            loadItems();
        }
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.submitBinLocation = submitBinLocation;

// Check for active stock take when switching to stock take tab
const originalShowTab = showTab;
showTab = function(tabName, clickedElement) {
    originalShowTab(tabName, clickedElement);
    
    if (tabName === 'stocktake') {
        // Ensure variables are initialized
        if (typeof currentStockTake === 'undefined') {
            currentStockTake = null;
        }
        
        // Update status display
        updateStockTakeStatus();
        
        // Try to load active stock take if we have company/warehouse selected
        const companyId = document.getElementById('openStockTakeCompany')?.value;
        const warehouseId = document.getElementById('openStockTakeWarehouse')?.value;
        
        if (companyId && warehouseId) {
            loadActiveStockTake(companyId, warehouseId);
        }
    }
};

async function loadActiveStockTake(companyId, warehouseId) {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/stock-takes/active?company_id=${companyId}&warehouse_id=${warehouseId}`);
        
        if (response.ok) {
            const stockTake = await response.json();
            if (stockTake) {
                currentStockTake = stockTake;
                updateStockTakeStatus();
            }
        }
    } catch (error) {
        console.error('Error loading active stock take:', error);
    }
}

// ========== SYSTEM ADMIN ==========
// ADMIN_PASSWORD is defined at the top of the file

function isAdminAuthenticated() {
    return sessionStorage.getItem('adminAuthenticated') === 'true';
}

function checkAdminPassword() {
    console.log('=== checkAdminPassword called ===');
    
    const passwordInput = document.getElementById('adminPassword');
    const errorDiv = document.getElementById('adminPasswordError');
    
    if (!passwordInput) {
        console.error('adminPassword input not found');
        alert('Password input not found. Please refresh the page.');
        return false;
    }
    
    const password = passwordInput.value.trim();
    console.log('Password entered:', password);
    console.log('Password length:', password.length);
    console.log('Expected password:', ADMIN_PASSWORD);
    console.log('Expected length:', ADMIN_PASSWORD.length);
    console.log('Passwords match:', password === ADMIN_PASSWORD);
    
    if (password === ADMIN_PASSWORD) {
        console.log('✓ Password correct, granting access');
        sessionStorage.setItem('adminAuthenticated', 'true');
        
        // Hide login form and show admin content
        const loginDiv = document.getElementById('systemAdminLogin');
        const contentDiv = document.getElementById('systemAdminContent');
        
        console.log('Login div found:', !!loginDiv);
        console.log('Content div found:', !!contentDiv);
        
        if (loginDiv) {
            loginDiv.style.display = 'none';
            console.log('Login div hidden');
        }
        if (contentDiv) {
            contentDiv.style.display = 'block';
            console.log('Content div shown');
        }
        
        if (errorDiv) errorDiv.style.display = 'none';
        passwordInput.value = '';
        
        // Load admin data
        showAdminContent();
        
        showToast('Admin access granted', 'success', 2000);
        return true;
    } else {
        console.log('✗ Password incorrect');
        console.log('Entered:', JSON.stringify(password));
        console.log('Expected:', JSON.stringify(ADMIN_PASSWORD));
        if (errorDiv) {
            errorDiv.textContent = 'Incorrect password. Please try again.';
            errorDiv.style.display = 'block';
        }
        passwordInput.value = '';
        setTimeout(() => {
            if (passwordInput) passwordInput.focus();
        }, 100);
        showToast('Incorrect password', 'error', 3000);
        return false;
    }
}
window.checkAdminPassword = checkAdminPassword;

function showAdminLogin() {
    const loginDiv = document.getElementById('systemAdminLogin');
    const contentDiv = document.getElementById('systemAdminContent');
    
    if (loginDiv) loginDiv.style.display = 'block';
    if (contentDiv) contentDiv.style.display = 'none';
}

function showAdminContent() {
    const loginDiv = document.getElementById('systemAdminLogin');
    const contentDiv = document.getElementById('systemAdminContent');
    
    if (loginDiv) loginDiv.style.display = 'none';
    if (contentDiv) contentDiv.style.display = 'block';
    
    // Load data
    loadManagerCompanyAccess();
    loadCounterCompanyAccess();
    if (managers.length === 0) loadManagers();
    if (companies.length === 0) loadCompanies();
}

// Manager-Company Access Management
async function loadManagerCompanyAccess() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/manager-company-access`);
        
        let accessList = [];
        if (response.ok) {
            accessList = await response.json();
        } else if (response.status === 404) {
            accessList = [];
        } else {
            throw new Error('Failed to load manager-company access');
        }
        
        const managerFilter = document.getElementById('adminManagerFilter');
        if (managerFilter && managers.length > 0) {
            const currentValue = managerFilter.value;
            managerFilter.innerHTML = '<option value="">All Managers</option>' + 
                managers.map(m => `<option value="${m.id}">${escapeHtml(m.manager_name)}</option>`).join('');
            if (currentValue) managerFilter.value = currentValue;
        }
        
        const filterValue = managerFilter?.value || '';
        let filteredList = accessList;
        if (filterValue) {
            filteredList = accessList.filter(a => a.manager_id === parseInt(filterValue));
        }
        
        const listEl = document.getElementById('managerCompanyAccessList');
        const noItemsEl = document.getElementById('noManagerAccess');
        
        if (listEl) {
            if (filteredList.length === 0) {
                listEl.innerHTML = '';
                if (noItemsEl) noItemsEl.style.display = 'block';
            } else {
                if (noItemsEl) noItemsEl.style.display = 'none';
                listEl.innerHTML = filteredList.map(access => {
                    const manager = managers.find(m => m.id === access.manager_id);
                    const company = companies.find(c => c.id === access.company_id);
                    return `
                        <div class="item-card">
                            <div class="item-header">
                                <div>
                                    <h3>${escapeHtml(manager ? manager.manager_name : 'Unknown Manager')}</h3>
                                    <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0 0;">${escapeHtml(company ? company.company_name : 'Unknown Company')}</p>
                                </div>
                                <div class="item-actions">
                                    <button onclick="deleteManagerCompanyAccess(${access.id})" class="btn btn-small btn-danger">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading manager-company access:', error);
        const listEl = document.getElementById('managerCompanyAccessList');
        const noItemsEl = document.getElementById('noManagerAccess');
        if (listEl) listEl.innerHTML = '';
        if (noItemsEl) noItemsEl.style.display = 'block';
    }
}
window.loadManagerCompanyAccess = loadManagerCompanyAccess;

async function loadCounterCompanyAccess() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/counter-company-access`);
        
        let accessList = [];
        if (response.ok) {
            accessList = await response.json();
        } else if (response.status === 404) {
            accessList = [];
        } else {
            throw new Error('Failed to load counter-company access');
        }
        
        const counterFilter = document.getElementById('adminCounterFilter');
        const uniqueEmails = [...new Set(accessList.map(a => a.counter_email))];
        if (counterFilter) {
            const currentValue = counterFilter.value;
            counterFilter.innerHTML = '<option value="">All Counters</option>' + 
                uniqueEmails.map(email => `<option value="${email}">${escapeHtml(email)}</option>`).join('');
            if (currentValue) counterFilter.value = currentValue;
        }
        
        const filterValue = counterFilter?.value || '';
        let filteredList = accessList;
        if (filterValue) {
            filteredList = accessList.filter(a => a.counter_email === filterValue);
        }
        
        const listEl = document.getElementById('counterCompanyAccessList');
        const noItemsEl = document.getElementById('noCounterAccess');
        
        if (listEl) {
            if (filteredList.length === 0) {
                listEl.innerHTML = '';
                if (noItemsEl) noItemsEl.style.display = 'block';
            } else {
                if (noItemsEl) noItemsEl.style.display = 'none';
                listEl.innerHTML = filteredList.map(access => {
                    const company = companies.find(c => c.id === access.company_id);
                    return `
                        <div class="item-card">
                            <div class="item-header">
                                <div>
                                    <h3>${escapeHtml(access.counter_email)}</h3>
                                    <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0 0;">${escapeHtml(company ? company.company_name : 'Unknown Company')}</p>
                                </div>
                                <div class="item-actions">
                                    <button onclick="deleteCounterCompanyAccess(${access.id})" class="btn btn-small btn-danger">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading counter-company access:', error);
        const listEl = document.getElementById('counterCompanyAccessList');
        const noItemsEl = document.getElementById('noCounterAccess');
        if (listEl) listEl.innerHTML = '';
        if (noItemsEl) noItemsEl.style.display = 'block';
    }
}
window.loadCounterCompanyAccess = loadCounterCompanyAccess;

function openAddManagerCompanyAccessModal() {
    if (!isAdminAuthenticated()) {
        showToast('Admin access required', 'error', 3000);
        return;
    }
    
    const modal = document.getElementById('managerCompanyAccessModal');
    const form = document.getElementById('managerCompanyAccessForm');
    const title = document.getElementById('managerCompanyAccessModalTitle');
    const managerSelect = document.getElementById('accessManager');
    const companySelect = document.getElementById('accessCompany');
    
    if (modal && form && title && managerSelect && companySelect) {
        title.textContent = 'Add Manager-Company Access';
        form.reset();
        
        const idField = document.getElementById('editManagerCompanyAccessId');
        if (idField) idField.remove();
        
        managerSelect.innerHTML = '<option value="">Select Manager</option>' + 
            managers.map(m => `<option value="${m.id}">${escapeHtml(m.manager_name)}</option>`).join('');
        
        companySelect.innerHTML = '<option value="">Select Company</option>' + 
            companies.map(c => `<option value="${c.id}">${escapeHtml(c.company_name)}</option>`).join('');
        
        modal.style.display = 'flex';
    }
}
window.openAddManagerCompanyAccessModal = openAddManagerCompanyAccessModal;

function closeManagerCompanyAccessModal() {
    const modal = document.getElementById('managerCompanyAccessModal');
    if (modal) modal.style.display = 'none';
}
window.closeManagerCompanyAccessModal = closeManagerCompanyAccessModal;

async function handleManagerCompanyAccessSubmit(event) {
    event.preventDefault();
    if (!isAdminAuthenticated()) {
        showToast('Admin access required', 'error', 3000);
        return;
    }
    
    const managerId = document.getElementById('accessManager')?.value;
    const companyId = document.getElementById('accessCompany')?.value;
    
    if (!managerId || !companyId) {
        showToast('Please select both manager and company', 'error', 3000);
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/manager-company-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                manager_id: parseInt(managerId),
                company_id: parseInt(companyId)
            })
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('This access already exists');
            }
            throw new Error('Failed to save access');
        }
        
        showToast('Access granted successfully!', 'success', 3000);
        closeManagerCompanyAccessModal();
        await loadManagerCompanyAccess();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleManagerCompanyAccessSubmit = handleManagerCompanyAccessSubmit;

async function deleteManagerCompanyAccess(id) {
    if (!isAdminAuthenticated()) {
        showToast('Admin access required', 'error', 3000);
        return;
    }
    
    if (!confirm('Are you sure you want to remove this access?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/manager-company-access/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete access');
        
        showToast('Access removed successfully!', 'success', 3000);
        await loadManagerCompanyAccess();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.deleteManagerCompanyAccess = deleteManagerCompanyAccess;

function openAddCounterCompanyAccessModal() {
    if (!isAdminAuthenticated()) {
        showToast('Admin access required', 'error', 3000);
        return;
    }
    
    const modal = document.getElementById('counterCompanyAccessModal');
    const form = document.getElementById('counterCompanyAccessForm');
    const title = document.getElementById('counterCompanyAccessModalTitle');
    const companySelect = document.getElementById('accessCounterCompany');
    
    if (modal && form && title && companySelect) {
        title.textContent = 'Add Counter-Company Access';
        form.reset();
        
        const idField = document.getElementById('editCounterCompanyAccessId');
        if (idField) idField.remove();
        
        companySelect.innerHTML = '<option value="">Select Company</option>' + 
            companies.map(c => `<option value="${c.id}">${escapeHtml(c.company_name)}</option>`).join('');
        
        modal.style.display = 'flex';
    }
}
window.openAddCounterCompanyAccessModal = openAddCounterCompanyAccessModal;

function closeCounterCompanyAccessModal() {
    const modal = document.getElementById('counterCompanyAccessModal');
    if (modal) modal.style.display = 'none';
}
window.closeCounterCompanyAccessModal = closeCounterCompanyAccessModal;

async function handleCounterCompanyAccessSubmit(event) {
    event.preventDefault();
    if (!isAdminAuthenticated()) {
        showToast('Admin access required', 'error', 3000);
        return;
    }
    
    const counterEmail = document.getElementById('accessCounterEmail')?.value.trim();
    const companyId = document.getElementById('accessCounterCompany')?.value;
    
    if (!counterEmail || !companyId) {
        showToast('Please enter counter email and select company', 'error', 3000);
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/counter-company-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                counter_email: counterEmail,
                company_id: parseInt(companyId)
            })
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('This access already exists');
            }
            throw new Error('Failed to save access');
        }
        
        showToast('Access granted successfully!', 'success', 3000);
        closeCounterCompanyAccessModal();
        await loadCounterCompanyAccess();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.handleCounterCompanyAccessSubmit = handleCounterCompanyAccessSubmit;

async function deleteCounterCompanyAccess(id) {
    if (!isAdminAuthenticated()) {
        showToast('Admin access required', 'error', 3000);
        return;
    }
    
    if (!confirm('Are you sure you want to remove this access?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/counter-company-access/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete access');
        
        showToast('Access removed successfully!', 'success', 3000);
        await loadCounterCompanyAccess();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.deleteCounterCompanyAccess = deleteCounterCompanyAccess;

// ========== OPEN STOCK TAKES LIST ==========
async function loadOpenStockTakes() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/stock-takes?status=open`);
        
        if (!response.ok) throw new Error('Failed to load open stock takes');
        
        const openStockTakes = await response.json();
        
        const listEl = document.getElementById('openStockTakesList');
        const noItemsEl = document.getElementById('noOpenStockTakes');
        
        if (listEl) {
            if (openStockTakes.length === 0) {
                listEl.innerHTML = '';
                if (noItemsEl) noItemsEl.style.display = 'block';
            } else {
                if (noItemsEl) noItemsEl.style.display = 'none';
                listEl.innerHTML = openStockTakes.map(st => `
                    <div class="item-card">
                        <div class="item-header">
                            <h3>${escapeHtml(st.company_name)} - ${escapeHtml(st.warehouse_name)}</h3>
                            <span class="item-id">ID: ${st.id}</span>
                        </div>
                        <div class="item-details">
                            <div class="detail-item"><strong>Company:</strong> ${escapeHtml(st.company_name)}</div>
                            <div class="detail-item"><strong>Warehouse:</strong> ${escapeHtml(st.warehouse_name)}</div>
                            ${st.opened_by_name ? `<div class="detail-item"><strong>Opened By:</strong> ${escapeHtml(st.opened_by_name)}</div>` : ''}
                            <div class="detail-item"><strong>Opened:</strong> ${formatDate(st.opened_at)}</div>
                            ${st.notes ? `<div class="detail-item"><strong>Notes:</strong> ${escapeHtml(st.notes)}</div>` : ''}
                        </div>
                        <div class="item-actions">
                            <button onclick="openExistingStockTake(${st.id})" class="btn btn-small">Open</button>
                            <button onclick="closeStockTakeById(${st.id})" class="btn btn-small btn-danger">Close</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading open stock takes:', error);
        showToast('Error loading open stock takes: ' + error.message, 'error', 5000);
    }
}
window.loadOpenStockTakes = loadOpenStockTakes;

async function openExistingStockTake(stockTakeId) {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/stock-takes/${stockTakeId}`);
        
        if (!response.ok) throw new Error('Failed to load stock take');
        
        const stockTake = await response.json();
        currentStockTake = stockTake;
        
        // Set company and warehouse dropdowns
        document.getElementById('openStockTakeCompany').value = stockTake.company_id;
        document.getElementById('openStockTakeWarehouse').value = stockTake.warehouse_id;
        updateWarehousesForOpenStockTake();
        
        updateStockTakeStatus();
        showTab('stocktake');
        
        showToast('Stock take loaded successfully!', 'success', 3000);
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.openExistingStockTake = openExistingStockTake;

async function closeStockTakeById(stockTakeId) {
    if (!confirm('Are you sure you want to close this stock take?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/stock-takes/${stockTakeId}/close`, {
            method: 'PUT'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to close stock take');
        }
        
        // If this was the current stock take, clear it
        if (currentStockTake && currentStockTake.id === stockTakeId) {
            currentStockTake = null;
            currentBinLocation = null;
            currentBinItems = [];
            updateStockTakeStatus();
            clearBinLocation();
        }
        
        alert('✅ Stock take closed successfully!');
        loadOpenStockTakes();
    } catch (error) {
        showToast(error.message, 'error', 6000);
    }
}
window.closeStockTakeById = closeStockTakeById;

// ========== UTILITY FUNCTIONS ==========
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${titles[type] || 'Info'}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }
}
window.showToast = showToast;

// Replace alert with toast (optional - can keep some alerts for critical confirmations)
function showAlert(message, type = 'info') {
    showToast(message, type, 4000);
}

// ========== QR CODE SCANNING ==========
async function startQRScan(inputId) {
    // Stop any existing scanner
    if (qrScanner) {
        try {
            await qrScanner.clear();
        } catch (e) {
            console.log('Clearing previous scanner');
        }
        qrScanner = null;
    }

    // Check if Html5Qrcode is available
    if (typeof Html5Qrcode === 'undefined') {
        showToast('QR Code scanner library not loaded. Please refresh the page.', 'error', 5000);
        return;
    }

    // Create modal for camera view
    const modal = document.createElement('div');
    modal.id = 'qrScannerModal';
    modal.className = 'qr-scanner-modal';
    modal.innerHTML = `
        <div class="qr-scanner-content">
            <div class="qr-scanner-header">
                <h3>Scan QR Code</h3>
                <button onclick="stopQRScan()" class="btn btn-secondary">✕ Close</button>
            </div>
            <div id="qr-reader" style="width: 100%;"></div>
            <p class="qr-hint">Point your camera at the QR code</p>
        </div>
    `;
    document.body.appendChild(modal);

    // Initialize scanner
    qrScanner = new Html5Qrcode("qr-reader");
    
    try {
        await qrScanner.start(
            { facingMode: "environment" }, // Use back camera on mobile
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            (decodedText, decodedResult) => {
                // Successfully scanned
                document.getElementById(inputId).value = decodedText;
                stopQRScan();
                
                // Trigger the appropriate handler
                if (inputId === 'counterBinLocationInput') {
                    handleCounterBinLocationScan();
                } else if (inputId === 'binLocationInput') {
                    handleBinLocationScan();
                } else if (inputId === 'itemCodeInput') {
                    handleItemCodeScan();
                }
            },
            (errorMessage) => {
                // Ignore scanning errors (just keep trying)
            }
        );
    } catch (err) {
        console.error('Error starting QR scanner:', err);
        showToast('Failed to start camera. Please check permissions and try again.', 'error', 5000);
        stopQRScan();
    }
}
window.startQRScan = startQRScan;

async function stopQRScan() {
    if (qrScanner) {
        try {
            await qrScanner.stop();
            await qrScanner.clear();
        } catch (e) {
            console.log('Stopping scanner');
        }
        qrScanner = null;
    }
    
    const modal = document.getElementById('qrScannerModal');
    if (modal) {
        modal.remove();
    }
}
window.stopQRScan = stopQRScan;

// Add switch role button for counter mode
function addCounterSwitchButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('counterSwitchRoleBtn');
    if (existingBtn) existingBtn.remove();
    
    // Create switch role button
    const switchBtn = document.createElement('button');
    switchBtn.id = 'counterSwitchRoleBtn';
    switchBtn.className = 'btn btn-secondary btn-small';
    switchBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 999;';
    switchBtn.textContent = 'Switch Role';
    switchBtn.onclick = switchRole;
    
    document.body.appendChild(switchBtn);
}
