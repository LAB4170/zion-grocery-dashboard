// Product management functions

// Use global products variable for consistency
let products = window.products || [];

function addProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    
    // Validation
    if (!name || !category || isNaN(price) || isNaN(stock)) {
        window.utils.showNotification('Please fill all fields correctly', 'error');
        return;
    }
    
    const product = {
        id: window.utils.generateId(),
        name,
        category,
        price,
        stock,
        createdAt: new Date().toISOString()
    };
    
    // Update both local and global variables
    products.push(product);
    window.products = products;
    window.utils.saveToStorage('products', products);
    
    window.utils.closeModal('productModal');
    window.utils.showNotification('Product added successfully!');
    
    if (window.currentSection === 'sales-settings') {
        loadProductsData();
    }
    
    // Update dashboard and refresh product select
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
    populateProductSelect();
}

function loadProductsData(filteredProducts = null) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    // Sync with global variables
    products = window.products || [];
    const productsToShow = filteredProducts || products;
    
    tbody.innerHTML = productsToShow.map(product => {
        const stockClass = (product.stock || 0) <= 5 ? 'low-stock' : '';
        const stockIndicator = (product.stock || 0) <= 5 ? '⚠️' : '';
        
        return `
            <tr class="${stockClass}">
                <td>${product.name || 'Unknown Product'}</td>
                <td><span class="category-badge">${product.category || 'Uncategorized'}</span></td>
                <td>${window.utils.formatCurrency(product.price || 0)}</td>
                <td>${stockIndicator} ${product.stock || 0}</td>
                <td class="action-buttons">
                    <button class="btn-small" onclick="editProduct('${product.id}')">Edit</button>
                    <button class="btn-small btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    products = products.filter(p => p.id !== productId);
    window.products = products;
    window.utils.saveToStorage('products', products);
    
    window.utils.showNotification('Product deleted successfully!');
    loadProductsData();
    
    // Update dashboard and refresh product select
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
    populateProductSelect();
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        
        window.utils.openModal('productModal');
        
        document.getElementById('productModal').setAttribute('data-editing', productId);
    }
}

function populateProductSelect() {
    const select = document.getElementById('saleProduct');
    if (!select) return;
    
    // Sync with global variables
    products = window.products || [];
    
    select.innerHTML = '<option value="">Select Product</option>' + 
        products.map(product => {
            const stockInfo = (product.stock || 0) <= 5 ? ` (Low Stock: ${product.stock || 0})` : ` (Stock: ${product.stock || 0})`;
            return `<option value="${product.id}">${product.name || 'Unknown Product'} - ${window.utils.formatCurrency(product.price || 0)}${stockInfo}</option>`;
        }).join('');
}
