/**
 * Stock Take App - View, Add, and Update Items
 * Displays items from Cloudflare D1 database and allows adding/updating
 */

// Global state
let allItems = [];
let filteredItems = [];

/**
 * Initialize app - load items on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Stock Take App initialized');
    loadItems();
});

/**
 * Load items from database
 */
async function loadItems() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const itemsListEl = document.getElementById('itemsList');
    const noItemsEl = document.getElementById('noItems');
    
    // Show loading
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    itemsListEl.innerHTML = '';
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const items = await response.json();
        
        console.log(`Loaded ${items.length} items`);
        
        // Store items
        allItems = items;
        filteredItems = [...items];
        
        // Display items
        displayItems(filteredItems);
        
    } catch (error) {
        console.error('Error loading items:', error);
        errorEl.style.display = 'block';
        errorEl.innerHTML = `
            <strong>Error loading items:</strong> ${error.message}<br>
            <small>Make sure your Cloudflare Worker is deployed and the URL is correct in config.js</small>
        `;
    } finally {
        loadingEl.style.display = 'none';
    }
}

// Make available globally
window.loadItems = loadItems;

/**
 * Display items in the UI
 */
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
                ${item.location ? `<div class="detail-item">
                    <strong>Location:</strong> ${escapeHtml(item.location)}
                </div>` : ''}
                ${item.date ? `<div class="detail-item">
                    <strong>Date:</strong> ${escapeHtml(item.date)}
                </div>` : ''}
                ${item.notes ? `<div class="detail-item">
                    <strong>Notes:</strong> ${escapeHtml(item.notes)}
                </div>` : ''}
                ${item.created_at ? `<div class="detail-item">
                    <strong>Added:</strong> ${formatDate(item.created_at)}
                </div>` : ''}
            </div>
            <div class="item-actions">
                <button onclick="openEditModal(${item.id})" class="btn btn-small">Edit</button>
            </div>
        </div>
    `).join('');
}

/**
 * Handle search
 */
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredItems = [...allItems];
    } else {
        filteredItems = allItems.filter(item => {
            const searchableText = [
                item.item_name,
                item.location,
                item.notes,
                item.id?.toString()
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm);
        });
    }
    
    displayItems(filteredItems);
}

// Make available globally
window.handleSearch = handleSearch;

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch (e) {
        return dateString;
    }
}

/**
 * Open add modal
 */
function openAddModal() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('addDate').value = today;
    
    // Show modal
    document.getElementById('addModal').style.display = 'flex';
}

// Make available globally
window.openAddModal = openAddModal;

/**
 * Close add modal
 */
function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('addForm').reset();
}

// Make available globally
window.closeAddModal = closeAddModal;

/**
 * Handle form submission for adding new item
 */
async function handleAdd(event) {
    event.preventDefault();
    
    const addBtn = document.getElementById('addBtn');
    const addText = document.getElementById('addText');
    const addSpinner = document.getElementById('addSpinner');
    
    const formData = {
        item_name: document.getElementById('addItemName').value.trim(),
        quantity: parseInt(document.getElementById('addQuantity').value) || 0,
        location: document.getElementById('addLocation').value.trim() || null,
        date: document.getElementById('addDate').value || null,
        notes: document.getElementById('addNotes').value.trim() || null
    };
    
    // Disable button and show spinner
    addBtn.disabled = true;
    addText.style.display = 'none';
    addSpinner.style.display = 'inline';
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add item');
        }
        
        const result = await response.json();
        
        // Show success message
        alert(`✅ Successfully added item "${formData.item_name}"!`);
        
        // Close modal and refresh items
        closeAddModal();
        loadItems();
        
    } catch (error) {
        console.error('Error adding item:', error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        addBtn.disabled = false;
        addText.style.display = 'inline';
        addSpinner.style.display = 'none';
    }
}

// Make available globally
window.handleAdd = handleAdd;

/**
 * Open edit modal with item data
 */
function openEditModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Populate form with item data
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.item_name || '';
    document.getElementById('editQuantity').value = item.quantity || 0;
    document.getElementById('editLocation').value = item.location || '';
    document.getElementById('editDate').value = item.date || '';
    document.getElementById('editNotes').value = item.notes || '';
    
    // Show modal
    document.getElementById('editModal').style.display = 'flex';
}

// Make available globally
window.openEditModal = openEditModal;

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editForm').reset();
}

// Make available globally
window.closeEditModal = closeEditModal;

/**
 * Handle form submission for update
 */
async function handleUpdate(event) {
    event.preventDefault();
    
    const updateBtn = document.getElementById('updateBtn');
    const updateText = document.getElementById('updateText');
    const updateSpinner = document.getElementById('updateSpinner');
    
    const itemId = document.getElementById('editItemId').value;
    const formData = {
        item_name: document.getElementById('editItemName').value.trim(),
        quantity: parseInt(document.getElementById('editQuantity').value) || 0,
        location: document.getElementById('editLocation').value.trim() || null,
        date: document.getElementById('editDate').value || null,
        notes: document.getElementById('editNotes').value.trim() || null
    };
    
    // Disable button and show spinner
    updateBtn.disabled = true;
    updateText.style.display = 'none';
    updateSpinner.style.display = 'inline';
    
    try {
        const response = await fetch(`${CONFIG.apiUrl}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update item');
        }
        
        const result = await response.json();
        
        // Show success message
        alert(`✅ Successfully updated item "${formData.item_name}"!`);
        
        // Close modal and refresh items
        closeEditModal();
        loadItems();
        
    } catch (error) {
        console.error('Error updating item:', error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        updateBtn.disabled = false;
        updateText.style.display = 'inline';
        updateSpinner.style.display = 'none';
    }
}

// Make available globally
window.handleUpdate = handleUpdate;

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
