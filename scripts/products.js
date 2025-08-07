// Product management functions

// Function to get data from storage
function getFromStorage(key, defaultValue) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

// Function to save data to storage
function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Function to generate a unique ID for products
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Function to format currency
function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

// Function to show notifications
function showNotification(message) {
    alert(message); // Simple alert for demonstration
}

// Function to close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Function to open modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Initialize products from storage
let products = getFromStorage('products', []);

function addProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    
    const product = {
        id: generateId(),
        name,
        category,
        price,
        stock,
        createdAt: new Date().toISOString()
    };
    
    products.push(product);
    saveToStorage('products', products);
    
    closeModal('productModal');
    showNotification('Product added successfully!');
    
    if (currentSection === 'sales-settings') {
        loadProductsData();
    }
    
    updateDashboardStats();
}

function loadProductsData() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn-small" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => String(p.id) !== String(productId));
        saveToStorage('products', products);
        loadProductsData();
        showNotification('Product deleted successfully!');
        updateDashboardStats();
    }
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        
        openModal('productModal');
        
        document.getElementById('productModal').setAttribute('data-editing', productId);
    }
}

function populateProductSelect() {
    const select = document.getElementById('saleProduct');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Product</option>' + 
        products.filter(p => p.stock > 0).map(product => 
            `<option value="${product.id}">${product.name} (${product.stock} available)</option>`
        ).join('');
}
