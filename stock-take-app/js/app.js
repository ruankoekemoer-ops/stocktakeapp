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

/**
 * Initialize app
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Stock Take Management System initialized');
    
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
    });
    
    // Load items if on view tab
    if (document.getElementById('viewTab')?.classList.contains('active')) {
        loadItems();
    }
    
    // Initialize stock take status (but don't call checkActiveStockTake here as it may cause initialization errors)
    // Status will be updated when switching to stock take tab
    setTimeout(() => {
        if (document.getElementById('stocktakeTab')?.classList.contains('active')) {
            updateStockTakeStatus();
        }
    }, 100);
});

/**
 * Tab switching
 */
function showTab(tabName, clickedElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName)) {
                btn.classList.add('active');
            }
        });
    }
    
    // Load data when switching tabs
    if (tabName === 'setup') {
        loadCompanies();
        // Don't auto-load other data - wait for company selection
    } else if (tabName === 'stocktake') {
        // Ensure managers are loaded for validation
        if (managers.length === 0) {
            loadManagers();
        }
        // Update dropdowns
        updateCompanyDropdowns();
        updateWarehouseDropdowns();
    } else if (tabName === 'view') {
        loadItems();
    }
}
window.showTab = showTab;

// ========== COMPANY SELECTION & SETTINGS ==========
let selectedCompanyId = null;

function onCompanySelected() {
    const companyId = document.getElementById('selectedCompany').value;
    selectedCompanyId = companyId ? parseInt(companyId) : null;
    
    if (selectedCompanyId) {
        // Show company details section
        document.getElementById('companyDetailsSection').style.display = 'block';
        document.getElementById('allCompaniesSection').style.display = 'none';
        
        // Update company name in header
        const company = companies.find(c => c.id === selectedCompanyId);
        if (company) {
            document.getElementById('selectedCompanyName').textContent = company.company_name + ' - Setup';
        }
        
        // Load all data for this company
        loadWarehousesForCompany();
        loadBinLocationsForCompany();
        loadManagersForCompany();
    } else {
        // Show all companies list
        document.getElementById('companyDetailsSection').style.display = 'none';
        document.getElementById('allCompaniesSection').style.display = 'block';
        loadCompanies();
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
    document.getElementById('addCompanyModal').style.display = 'flex';
    document.getElementById('addCompanyCode').value = '';
    document.getElementById('addCompanyName').value = '';
}
window.openAddCompanyModal = openAddCompanyModal;

function closeAddCompanyModal() {
    document.getElementById('addCompanyModal').style.display = 'none';
}
window.closeAddCompanyModal = closeAddCompanyModal;

function openEditCompanyModal(id) {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    
    document.getElementById('editCompanyId').value = id;
    document.getElementById('editCompanyCode').value = company.company_code;
    document.getElementById('editCompanyName').value = company.company_name;
    document.getElementById('editCompanyModal').style.display = 'flex';
}
window.openEditCompanyModal = openEditCompanyModal;

function closeEditCompanyModal() {
    document.getElementById('editCompanyModal').style.display = 'none';
}
window.closeEditCompanyModal = closeEditCompanyModal;

async function handleAddCompany(event) {
    event.preventDefault();
    const formData = {
        company_code: document.getElementById('addCompanyCode').value.trim(),
        company_name: document.getElementById('addCompanyName').value.trim(),
    };
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/companies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to save company');
        
        const result = await response.json();
        alert('✅ Company created successfully!');
        closeAddCompanyModal();
        await loadCompanies();
        // Auto-select the newly created company
        if (result.item && result.item.id) {
            selectCompany(result.item.id);
        }
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
window.handleAddCompany = handleAddCompany;

async function handleEditCompany(event) {
    event.preventDefault();
    const id = document.getElementById('editCompanyId').value;
    const formData = {
        company_code: document.getElementById('editCompanyCode').value.trim(),
        company_name: document.getElementById('editCompanyName').value.trim(),
    };
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/companies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update company');
        
        alert('✅ Company updated successfully!');
        closeEditCompanyModal();
        await loadCompanies();
        // Keep the same company selected if it still exists
        if (selectedCompanyId) {
            document.getElementById('selectedCompany').value = selectedCompanyId;
            onCompanySelected();
        }
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
window.handleEditCompany = handleEditCompany;

function editCompany(id) {
    openCompanyModal(id);
}
window.editCompany = editCompany;

async function deleteCompany(id) {
    if (!confirm('Are you sure you want to delete this company?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/companies/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete company');
        alert('✅ Company deleted successfully!');
        selectedCompanyId = null;
        document.getElementById('selectedCompany').value = '';
        await loadCompanies();
        onCompanySelected(); // This will show the all companies list
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
                            <h3>${escapeHtml(w.warehouse_name)}</h3>
                            <span class="item-id">${escapeHtml(w.warehouse_code)}</span>
                        </div>
                        <div class="item-details">
                            ${w.address ? `<div class="detail-item"><strong>Address:</strong> ${escapeHtml(w.address)}</div>` : ''}
                        </div>
                        <div class="item-actions">
                            <button onclick="editWarehouse(${w.id})" class="btn btn-small">Edit</button>
                            <button onclick="deleteWarehouse(${w.id})" class="btn btn-small btn-danger">Delete</button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Update warehouse filter dropdowns
        updateWarehouseFilterDropdowns();
    } catch (error) {
        console.error('Error loading warehouses for company:', error);
    }
}
window.loadWarehousesForCompany = loadWarehousesForCompany;

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
    const companySelect = document.getElementById('addWarehouseCompany');
    companySelect.innerHTML = '<option value="">Select Company</option>' + 
        companies.map(c => `<option value="${c.id}">${escapeHtml(c.company_name)}</option>`).join('');
    
    // Pre-select the current company if one is selected
    if (selectedCompanyId) {
        companySelect.value = selectedCompanyId;
    }
    
    document.getElementById('addWarehouseCode').value = '';
    document.getElementById('addWarehouseName').value = '';
    document.getElementById('addWarehouseAddress').value = '';
    document.getElementById('addWarehouseModal').style.display = 'flex';
}
window.openAddWarehouseModal = openAddWarehouseModal;

function closeAddWarehouseModal() {
    document.getElementById('addWarehouseModal').style.display = 'none';
}
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

function closeEditWarehouseModal() {
    document.getElementById('editWarehouseModal').style.display = 'none';
}
window.closeEditWarehouseModal = closeEditWarehouseModal;

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
        
        alert('✅ Warehouse created successfully!');
        closeAddWarehouseModal();
        await loadWarehouses();
        loadWarehousesForCompany();
        loadBinLocationsForCompany();
        loadManagersForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
        
        alert('✅ Warehouse updated successfully!');
        closeEditWarehouseModal();
        await loadWarehouses();
        loadWarehousesForCompany();
        loadBinLocationsForCompany();
        loadManagersForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
        alert('✅ Warehouse deleted successfully!');
        await loadWarehouses();
        loadWarehousesForCompany();
        loadBinLocationsForCompany();
        loadManagersForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
                listEl.innerHTML = binLocations.map(b => `
                    <div class="item-card">
                        <div class="item-header">
                            <h3>${escapeHtml(b.bin_code)}</h3>
                            ${b.bin_name ? `<span class="item-id">${escapeHtml(b.bin_name)}</span>` : ''}
                        </div>
                        <div class="item-details">
                            <div class="detail-item"><strong>Warehouse:</strong> ${escapeHtml(b.warehouse_name || 'N/A')}</div>
                            ${b.aisle ? `<div class="detail-item"><strong>Aisle:</strong> ${escapeHtml(b.aisle)}</div>` : ''}
                            ${b.shelf ? `<div class="detail-item"><strong>Shelf:</strong> ${escapeHtml(b.shelf)}</div>` : ''}
                            ${b.level ? `<div class="detail-item"><strong>Level:</strong> ${escapeHtml(b.level)}</div>` : ''}
                        </div>
                        <div class="item-actions">
                            <button onclick="editBinLocation(${b.id})" class="btn btn-small">Edit</button>
                            <button onclick="deleteBinLocation(${b.id})" class="btn btn-small btn-danger">Delete</button>
                        </div>
                    </div>
                `).join('');
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
    const warehouseSelect = document.getElementById('addBinLocationWarehouse');
    
    // Filter warehouses by selected company
    let filteredWarehouses = warehouses;
    if (selectedCompanyId) {
        filteredWarehouses = warehouses.filter(w => w.company_id === selectedCompanyId);
    }
    
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
        filteredWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
    
    document.getElementById('addBinLocationCode').value = '';
    document.getElementById('addBinLocationName').value = '';
    document.getElementById('addBinLocationAisle').value = '';
    document.getElementById('addBinLocationShelf').value = '';
    document.getElementById('addBinLocationLevel').value = '';
    document.getElementById('addBinLocationModal').style.display = 'flex';
}
window.openAddBinLocationModal = openAddBinLocationModal;

function closeAddBinLocationModal() {
    document.getElementById('addBinLocationModal').style.display = 'none';
}
window.closeAddBinLocationModal = closeAddBinLocationModal;

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

function closeEditBinLocationModal() {
    document.getElementById('editBinLocationModal').style.display = 'none';
}
window.closeEditBinLocationModal = closeEditBinLocationModal;

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
        
        alert('✅ Bin location created successfully!');
        closeAddBinLocationModal();
        await loadBinLocations();
        loadBinLocationsForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
        
        alert('✅ Bin location updated successfully!');
        closeEditBinLocationModal();
        await loadBinLocations();
        loadBinLocationsForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
        alert('✅ Bin location deleted successfully!');
        await loadBinLocations();
        loadBinLocationsForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
                            <h3>${escapeHtml(m.manager_name)}</h3>
                            <span class="item-id">${escapeHtml(m.warehouse_name || 'N/A')}</span>
                        </div>
                        <div class="item-details">
                            <div class="detail-item"><strong>Warehouse:</strong> ${escapeHtml(m.warehouse_name || 'N/A')}</div>
                            ${m.email ? `<div class="detail-item"><strong>Email:</strong> ${escapeHtml(m.email)}</div>` : ''}
                            ${m.phone ? `<div class="detail-item"><strong>Phone:</strong> ${escapeHtml(m.phone)}</div>` : ''}
                        </div>
                        <div class="item-actions">
                            <button onclick="editManager(${m.id})" class="btn btn-small">Edit</button>
                            <button onclick="deleteManager(${m.id})" class="btn btn-small btn-danger">Delete</button>
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
    const warehouseSelect = document.getElementById('addManagerWarehouse');
    
    // Filter warehouses by selected company
    let filteredWarehouses = warehouses;
    if (selectedCompanyId) {
        filteredWarehouses = warehouses.filter(w => w.company_id === selectedCompanyId);
    }
    
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
        filteredWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
    
    document.getElementById('addManagerName').value = '';
    document.getElementById('addManagerEmail').value = '';
    document.getElementById('addManagerPhone').value = '';
    document.getElementById('addManagerModal').style.display = 'flex';
}
window.openAddManagerModal = openAddManagerModal;

function closeAddManagerModal() {
    document.getElementById('addManagerModal').style.display = 'none';
}
window.closeAddManagerModal = closeAddManagerModal;

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

function closeEditManagerModal() {
    document.getElementById('editManagerModal').style.display = 'none';
}
window.closeEditManagerModal = closeEditManagerModal;

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
        
        alert('✅ Manager created successfully!');
        closeAddManagerModal();
        await loadManagers();
        loadManagersForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
        
        alert('✅ Manager updated successfully!');
        closeEditManagerModal();
        await loadManagers();
        loadManagersForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
        alert('✅ Manager deactivated successfully!');
        await loadManagers();
        loadManagersForCompany();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
    const loadingEl = document.getElementById('loadingStock');
    const errorEl = document.getElementById('errorStock');
    const itemsListEl = document.getElementById('stockItemsList');
    const noItemsEl = document.getElementById('noStockItems');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';
    if (itemsListEl) itemsListEl.innerHTML = '';
    
    try {
        const searchTerm = document.getElementById('searchStockInput')?.value || '';
        
        let url = `${CONFIG.apiUrl}/items`;
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        
        allItems = await response.json();
        filteredItems = [...allItems];
        
        displayItems(filteredItems);
        
    } catch (error) {
        console.error('Error loading items:', error);
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.textContent = `Error loading items: ${error.message}`;
        }
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}
window.loadItems = loadItems;

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
        
        alert('✅ Item updated successfully!');
        closeEditItemModal();
        loadItems();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
document.getElementById('editItemForm').onsubmit = handleUpdateItem;

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items/${itemId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete item');
        alert('✅ Item deleted successfully!');
        loadItems();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
window.deleteItem = deleteItem;

// ========== NEW STOCK TAKE WORKFLOW ==========
// Initialize these at the top level to avoid initialization errors
let currentStockTake = null;
let currentBinLocation = null;
let currentBinItems = [];

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
        alert('Please select Company and Warehouse');
        return;
    }
    
    // Validate that at least one manager exists for this warehouse
    const warehouseManagers = managers.filter(m => m.warehouse_id == warehouseId && m.is_active !== 0);
    
    if (warehouseManagers.length === 0) {
        alert('❌ Cannot open stock take: No active managers found for this warehouse.\n\nPlease add a manager in Setup before opening a stock take.');
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
        alert(`✅ Stock take opened successfully!\n\nManager: ${warehouseManagers[0].manager_name}`);
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
        alert(`❌ Error: ${error.message}`);
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
    
    if (!statusBox) return; // Exit if elements don't exist yet
    
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
        
        // Show scanning sections
        if (binSection) binSection.style.display = 'block';
        
        // Focus on bin location input for immediate scanning
        setTimeout(() => {
            const binInput = document.getElementById('binLocationInput');
            if (binInput) binInput.focus();
        }, 100);
    } else {
        statusBox.innerHTML = '<p>No stock take open</p>';
        statusBox.className = 'status-box';
        openBtn.style.display = 'inline-block';
        closeBtn.style.display = 'none';
        binSection.style.display = 'none';
        itemSection.style.display = 'none';
        binItemsSection.style.display = 'none';
    }
}

async function handleBinLocationScan() {
    const binCode = document.getElementById('binLocationInput').value.trim();
    
    if (!binCode) {
        alert('Please enter or scan a bin location code');
        return;
    }
    
    if (!currentStockTake) {
        alert('Please open a stock take first');
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
        alert(`❌ Error: ${error.message}`);
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
        alert('Please enter or scan an item code');
        return;
    }
    
    // Auto-focus on quantity input
    document.getElementById('itemQuantityInput').focus();
    document.getElementById('itemQuantityInput').select();
}
window.handleItemCodeScan = handleItemCodeScan;

// Allow Enter key on item code to move to quantity
document.getElementById('itemCodeInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleItemCodeScan();
    }
});

async function addItemToBin() {
    if (!currentStockTake || !currentBinLocation) {
        alert('Please scan a bin location first');
        return;
    }
    
    const itemCode = document.getElementById('itemCodeInput').value.trim();
    const itemName = document.getElementById('itemNameInput').value.trim();
    const quantity = parseInt(document.getElementById('itemQuantityInput').value) || 0;
    
    if (!itemCode) {
        alert('Please enter or scan an item code');
        return;
    }
    
    if (quantity < 0) {
        alert('Quantity must be 0 or greater');
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
        document.getElementById('itemQuantityInput').value = '0';
        
        // Focus back on item code for next scan
        document.getElementById('itemCodeInput').focus();
        
        // Reload bin items
        loadBinItems();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
        alert(`❌ Error: ${error.message}`);
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
        alert(`❌ Error clearing items: ${error.message}`);
    });
}
window.clearBinItems = clearBinItems;

async function submitBinLocation() {
    if (!currentStockTake || !currentBinLocation) {
        alert('Please scan a bin location first');
        return;
    }
    
    if (currentBinItems.length === 0) {
        alert('Please add at least one item before submitting');
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
        alert(`✅ Successfully submitted ${data.items_submitted} item(s) for bin location ${currentBinLocation.bin_code}!`);
        
        // Clear bin location and items
        clearBinLocation();
        
        // Reload items in view tab
        if (document.getElementById('viewTab').classList.contains('active')) {
            loadItems();
        }
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
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
