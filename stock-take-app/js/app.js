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
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('stockDate').value = today;
    
    // Load initial data
    loadCompanies();
    loadWarehouses();
    loadBinLocations();
    loadManagers();
    
    // Load items if on view tab
    if (document.getElementById('viewTab').classList.contains('active')) {
        loadItems();
    }
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
        loadWarehouses();
        loadBinLocations();
        loadManagers();
    } else if (tabName === 'view') {
        loadItems();
    }
}
window.showTab = showTab;

/**
 * Setup tab switching
 */
function showSetupTab(tabName) {
    document.querySelectorAll('.setup-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.setup-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName + 'Setup').classList.add('active');
    event.target.classList.add('active');
    
    // Load data for the selected setup tab
    if (tabName === 'companies') loadCompanies();
    else if (tabName === 'warehouses') loadWarehouses();
    else if (tabName === 'bin-locations') loadBinLocations();
    else if (tabName === 'managers') loadManagers();
}
window.showSetupTab = showSetupTab;

// ========== COMPANIES ==========
async function loadCompanies() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/companies`);
        companies = await response.json();
        
        // Update dropdowns
        updateCompanyDropdowns();
        
        // Display companies
        const listEl = document.getElementById('companiesList');
        if (listEl) {
            listEl.innerHTML = companies.map(c => `
                <div class="item-card">
                    <div class="item-header">
                        <h3>${escapeHtml(c.company_name)}</h3>
                        <span class="item-id">${escapeHtml(c.company_code)}</span>
                    </div>
                    <div class="item-actions">
                        <button onclick="editCompany(${c.id})" class="btn btn-small">Edit</button>
                        <button onclick="deleteCompany(${c.id})" class="btn btn-small btn-danger">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

function updateCompanyDropdowns() {
    const selects = document.querySelectorAll('select[id*="Company"], select[id*="company"]');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Company</option>' + 
            companies.map(c => `<option value="${c.id}">${escapeHtml(c.company_name)}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

function openCompanyModal(id = null) {
    const modal = document.getElementById('companyModal');
    const form = document.getElementById('companyForm');
    const title = document.getElementById('companyModalTitle');
    
    form.reset();
    document.getElementById('companyId').value = id || '';
    title.textContent = id ? 'Edit Company' : 'Add Company';
    
    if (id) {
        const company = companies.find(c => c.id === id);
        if (company) {
            document.getElementById('companyCode').value = company.company_code;
            document.getElementById('companyName').value = company.company_name;
        }
    }
    
    modal.style.display = 'flex';
}
window.openCompanyModal = openCompanyModal;

function closeCompanyModal() {
    document.getElementById('companyModal').style.display = 'none';
}
window.closeCompanyModal = closeCompanyModal;

async function handleCompanySubmit(event) {
    event.preventDefault();
    const formData = {
        company_code: document.getElementById('companyCode').value.trim(),
        company_name: document.getElementById('companyName').value.trim(),
    };
    const id = document.getElementById('companyId').value;
    
    try {
        const url = id ? `${CONFIG.apiUrl}/companies/${id}` : `${CONFIG.apiUrl}/companies`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to save company');
        
        alert(`✅ Company ${id ? 'updated' : 'created'} successfully!`);
        closeCompanyModal();
        loadCompanies();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
document.getElementById('companyForm').onsubmit = handleCompanySubmit;

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
        loadCompanies();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
window.deleteCompany = deleteCompany;

// ========== WAREHOUSES ==========
async function loadWarehouses() {
    try {
        const companyFilter = document.getElementById('warehouseCompanyFilter')?.value || '';
        const url = companyFilter ? `${CONFIG.apiUrl}/warehouses?company_id=${companyFilter}` : `${CONFIG.apiUrl}/warehouses`;
        const response = await fetch(url);
        warehouses = await response.json();
        
        updateWarehouseDropdowns();
        
        const listEl = document.getElementById('warehousesList');
        if (listEl) {
            listEl.innerHTML = warehouses.map(w => `
                <div class="item-card">
                    <div class="item-header">
                        <h3>${escapeHtml(w.warehouse_name)}</h3>
                        <span class="item-id">${escapeHtml(w.warehouse_code)}</span>
                    </div>
                    <div class="item-details">
                        <div class="detail-item"><strong>Company:</strong> ${escapeHtml(w.company_name || 'N/A')}</div>
                        ${w.address ? `<div class="detail-item"><strong>Address:</strong> ${escapeHtml(w.address)}</div>` : ''}
                    </div>
                    <div class="item-actions">
                        <button onclick="editWarehouse(${w.id})" class="btn btn-small">Edit</button>
                        <button onclick="deleteWarehouse(${w.id})" class="btn btn-small btn-danger">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading warehouses:', error);
    }
}
window.loadWarehouses = loadWarehouses;

function updateWarehouseDropdowns() {
    const selects = document.querySelectorAll('select[id*="Warehouse"], select[id*="warehouse"]');
    selects.forEach(select => {
        const currentValue = select.value;
        const companyFilter = select.dataset.companyFilter;
        let filteredWarehouses = warehouses;
        
        if (companyFilter && select.id !== 'warehouseCompanyFilter') {
            filteredWarehouses = warehouses.filter(w => !companyFilter || w.company_id == companyFilter);
        }
        
        select.innerHTML = '<option value="">Select Warehouse</option>' + 
            filteredWarehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

function openWarehouseModal(id = null) {
    const modal = document.getElementById('warehouseModal');
    const form = document.getElementById('warehouseForm');
    const title = document.getElementById('warehouseModalTitle');
    
    form.reset();
    document.getElementById('warehouseId').value = id || '';
    title.textContent = id ? 'Edit Warehouse' : 'Add Warehouse';
    
    // Populate company dropdown
    const companySelect = document.getElementById('warehouseCompany');
    companySelect.innerHTML = '<option value="">Select Company</option>' + 
        companies.map(c => `<option value="${c.id}">${escapeHtml(c.company_name)}</option>`).join('');
    
    if (id) {
        const warehouse = warehouses.find(w => w.id === id);
        if (warehouse) {
            document.getElementById('warehouseCode').value = warehouse.warehouse_code;
            document.getElementById('warehouseName').value = warehouse.warehouse_name;
            document.getElementById('warehouseCompany').value = warehouse.company_id;
            document.getElementById('warehouseAddress').value = warehouse.address || '';
        }
    }
    
    modal.style.display = 'flex';
}
window.openWarehouseModal = openWarehouseModal;

function closeWarehouseModal() {
    document.getElementById('warehouseModal').style.display = 'none';
}
window.closeWarehouseModal = closeWarehouseModal;

async function handleWarehouseSubmit(event) {
    event.preventDefault();
    const formData = {
        warehouse_code: document.getElementById('warehouseCode').value.trim(),
        warehouse_name: document.getElementById('warehouseName').value.trim(),
        company_id: parseInt(document.getElementById('warehouseCompany').value),
        address: document.getElementById('warehouseAddress').value.trim() || null,
    };
    const id = document.getElementById('warehouseId').value;
    
    try {
        const url = id ? `${CONFIG.apiUrl}/warehouses/${id}` : `${CONFIG.apiUrl}/warehouses`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to save warehouse');
        
        alert(`✅ Warehouse ${id ? 'updated' : 'created'} successfully!`);
        closeWarehouseModal();
        loadWarehouses();
        loadBinLocations();
        loadManagers();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
document.getElementById('warehouseForm').onsubmit = handleWarehouseSubmit;

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
        loadWarehouses();
        loadBinLocations();
        loadManagers();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
window.deleteWarehouse = deleteWarehouse;

// ========== BIN LOCATIONS ==========
async function loadBinLocations() {
    try {
        const warehouseFilter = document.getElementById('binLocationWarehouseFilter')?.value || '';
        const url = warehouseFilter ? `${CONFIG.apiUrl}/bin-locations?warehouse_id=${warehouseFilter}` : `${CONFIG.apiUrl}/bin-locations`;
        const response = await fetch(url);
        binLocations = await response.json();
        
        updateBinLocationDropdowns();
        
        const listEl = document.getElementById('binLocationsList');
        if (listEl) {
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
    } catch (error) {
        console.error('Error loading bin locations:', error);
    }
}
window.loadBinLocations = loadBinLocations;

function updateBinLocationDropdowns() {
    const selects = document.querySelectorAll('select[id*="Bin"], select[id*="bin"]');
    selects.forEach(select => {
        if (select.id === 'binLocationWarehouseFilter') return;
        const currentValue = select.value;
        const warehouseFilter = select.dataset.warehouseFilter;
        let filteredBins = binLocations;
        
        if (warehouseFilter) {
            filteredBins = binLocations.filter(b => b.warehouse_id == warehouseFilter);
        }
        
        select.innerHTML = '<option value="">Select Bin Location</option>' + 
            filteredBins.map(b => `<option value="${b.id}">${escapeHtml(b.bin_code)}${b.bin_name ? ' - ' + escapeHtml(b.bin_name) : ''}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

function openBinLocationModal(id = null) {
    const modal = document.getElementById('binLocationModal');
    const form = document.getElementById('binLocationForm');
    const title = document.getElementById('binLocationModalTitle');
    
    form.reset();
    document.getElementById('binLocationId').value = id || '';
    title.textContent = id ? 'Edit Bin Location' : 'Add Bin Location';
    
    // Populate warehouse dropdown
    const warehouseSelect = document.getElementById('binWarehouse');
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
        warehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
    
    if (id) {
        const bin = binLocations.find(b => b.id === id);
        if (bin) {
            document.getElementById('binCode').value = bin.bin_code;
            document.getElementById('binName').value = bin.bin_name || '';
            document.getElementById('binWarehouse').value = bin.warehouse_id;
            document.getElementById('binAisle').value = bin.aisle || '';
            document.getElementById('binShelf').value = bin.shelf || '';
            document.getElementById('binLevel').value = bin.level || '';
        }
    }
    
    modal.style.display = 'flex';
}
window.openBinLocationModal = openBinLocationModal;

function closeBinLocationModal() {
    document.getElementById('binLocationModal').style.display = 'none';
}
window.closeBinLocationModal = closeBinLocationModal;

async function handleBinLocationSubmit(event) {
    event.preventDefault();
    const formData = {
        bin_code: document.getElementById('binCode').value.trim(),
        bin_name: document.getElementById('binName').value.trim() || null,
        warehouse_id: parseInt(document.getElementById('binWarehouse').value),
        aisle: document.getElementById('binAisle').value.trim() || null,
        shelf: document.getElementById('binShelf').value.trim() || null,
        level: document.getElementById('binLevel').value.trim() || null,
    };
    const id = document.getElementById('binLocationId').value;
    
    try {
        const url = id ? `${CONFIG.apiUrl}/bin-locations/${id}` : `${CONFIG.apiUrl}/bin-locations`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to save bin location');
        
        alert(`✅ Bin location ${id ? 'updated' : 'created'} successfully!`);
        closeBinLocationModal();
        loadBinLocations();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
document.getElementById('binLocationForm').onsubmit = handleBinLocationSubmit;

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
        loadBinLocations();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
window.deleteBinLocation = deleteBinLocation;

// ========== MANAGERS ==========
async function loadManagers() {
    try {
        const warehouseFilter = document.getElementById('managerWarehouseFilter')?.value || '';
        const url = warehouseFilter ? `${CONFIG.apiUrl}/managers?warehouse_id=${warehouseFilter}` : `${CONFIG.apiUrl}/managers`;
        const response = await fetch(url);
        managers = await response.json();
        
        updateManagerDropdowns();
        
        const listEl = document.getElementById('managersList');
        if (listEl) {
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
    } catch (error) {
        console.error('Error loading managers:', error);
    }
}
window.loadManagers = loadManagers;

function updateManagerDropdowns() {
    const selects = document.querySelectorAll('select[id*="Manager"], select[id*="manager"]');
    selects.forEach(select => {
        if (select.id === 'managerWarehouseFilter') return;
        const currentValue = select.value;
        const warehouseFilter = select.dataset.warehouseFilter;
        let filteredManagers = managers;
        
        if (warehouseFilter) {
            filteredManagers = managers.filter(m => m.warehouse_id == warehouseFilter);
        }
        
        select.innerHTML = '<option value="">Select Manager</option>' + 
            filteredManagers.map(m => `<option value="${m.id}">${escapeHtml(m.manager_name)} - ${escapeHtml(m.warehouse_name || 'N/A')}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

function openManagerModal(id = null) {
    const modal = document.getElementById('managerModal');
    const form = document.getElementById('managerForm');
    const title = document.getElementById('managerModalTitle');
    
    form.reset();
    document.getElementById('managerId').value = id || '';
    title.textContent = id ? 'Edit Manager' : 'Add Manager';
    
    // Populate warehouse dropdown
    const warehouseSelect = document.getElementById('managerWarehouse');
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
        warehouses.map(w => `<option value="${w.id}">${escapeHtml(w.warehouse_name)}</option>`).join('');
    
    if (id) {
        const manager = managers.find(m => m.id === id);
        if (manager) {
            document.getElementById('managerName').value = manager.manager_name;
            document.getElementById('managerWarehouse').value = manager.warehouse_id;
            document.getElementById('managerEmail').value = manager.email || '';
            document.getElementById('managerPhone').value = manager.phone || '';
        }
    }
    
    modal.style.display = 'flex';
}
window.openManagerModal = openManagerModal;

function closeManagerModal() {
    document.getElementById('managerModal').style.display = 'none';
}
window.closeManagerModal = closeManagerModal;

async function handleManagerSubmit(event) {
    event.preventDefault();
    const formData = {
        manager_name: document.getElementById('managerName').value.trim(),
        warehouse_id: parseInt(document.getElementById('managerWarehouse').value),
        email: document.getElementById('managerEmail').value.trim() || null,
        phone: document.getElementById('managerPhone').value.trim() || null,
    };
    const id = document.getElementById('managerId').value;
    
    try {
        const url = id ? `${CONFIG.apiUrl}/managers/${id}` : `${CONFIG.apiUrl}/managers`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to save manager');
        
        alert(`✅ Manager ${id ? 'updated' : 'created'} successfully!`);
        closeManagerModal();
        loadManagers();
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
document.getElementById('managerForm').onsubmit = handleManagerSubmit;

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
        loadManagers();
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
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const itemsListEl = document.getElementById('itemsList');
    const noItemsEl = document.getElementById('noItems');
    
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    itemsListEl.innerHTML = '';
    
    try {
        const warehouseFilter = document.getElementById('viewWarehouseFilter')?.value || '';
        const managerFilter = document.getElementById('viewManagerFilter')?.value || '';
        
        let url = `${CONFIG.apiUrl}/items`;
        const params = [];
        if (warehouseFilter) params.push(`warehouse_id=${warehouseFilter}`);
        if (managerFilter) params.push(`manager_id=${managerFilter}`);
        if (params.length) url += '?' + params.join('&');
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        
        allItems = await response.json();
        filteredItems = [...allItems];
        
        displayItems(filteredItems);
        
        // Update filter dropdowns
        updateViewFilters();
        
    } catch (error) {
        console.error('Error loading items:', error);
        errorEl.style.display = 'block';
        errorEl.innerHTML = `<strong>Error loading items:</strong> ${error.message}`;
    } finally {
        loadingEl.style.display = 'none';
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
    const itemsListEl = document.getElementById('itemsList');
    const noItemsEl = document.getElementById('noItems');
    
    if (items.length === 0) {
        itemsListEl.innerHTML = '';
        noItemsEl.style.display = 'block';
        return;
    }
    
    noItemsEl.style.display = 'none';
    
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
            <div class="item-actions">
                <button onclick="openEditItemModal(${item.id})" class="btn btn-small">Edit</button>
                <button onclick="deleteItem(${item.id})" class="btn btn-small btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredItems = [...allItems];
    } else {
        filteredItems = allItems.filter(item => {
            const searchableText = [
                item.item_name,
                item.item_code,
                item.company_name,
                item.warehouse_name,
                item.bin_location_code,
                item.counted_by,
                item.notes,
                item.id?.toString()
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm);
        });
    }
    
    displayItems(filteredItems);
}
window.handleSearch = handleSearch;

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
