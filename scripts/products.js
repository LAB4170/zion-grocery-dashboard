function addProduct(event) {
    event.preventDefault();
    
    const form = event.target;
    const editingId = form.dataset.editingId;
    
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value)
    };
    
    // Validate inputs
    if (!productData.name || isNaN(productData.price) || isNaN(productData.stock)) {
        alert('Please fill all fields with valid values');
        return;
    }
    
    if (productData.price < 0 || productData.stock < 0) {
        alert('Price and stock cannot be negative');
        return;
    }

    // Check if data and data.products are defined
    if (!data || !Array.isArray(data.products)) {
        alert('Product data is not available. Please initialize the data.');
        return;
    }

    if (editingId) {
        // Update existing product
        const productIndex = data.products.findIndex(p => p.id === parseInt(editingId));
        if (productIndex !== -1) {
            data.products[productIndex] = { 
                ...data.products[productIndex], 
                ...productData 
            };
        }
        
        // Reset the editing state
        delete form.dataset.editingId;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Add Product';
    } else {
        // Add new product
        const product = {
            id: Date.now(),
            ...productData
        };
        data.products.push(product);
    }
    
    renderProductsTable();
    updateDashboard();
    data.save(); // Auto-save to LocalStorage
    closeModal('productModal');
    form.reset();
}


function editProduct(id) {
    const product = data.products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;

    // Store the product ID in the form dataset
    const form = document.querySelector('#productModal form');
    form.dataset.editingId = id;

    // Change button text
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Product';

    openModal('productModal');
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    data.products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>KSh ${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        data.products = data.products.filter(product => product.id !== id);
        renderProductsTable();
        updateDashboard();
        data.save(); // Auto-save to LocalStorage
    }
}

function populateProductDropdown() {
    const select = document.getElementById('saleProduct');
    select.innerHTML = '<option value="">Select Product</option>';
    
    data.products.forEach(product => {
        if (product.stock > 0) { // Only show products with stock
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - KSh ${product.price.toFixed(2)} (Stock: ${product.stock})`;
            option.style.background = '#2c3e50';
            option.style.color = 'white';
            select.appendChild(option);
        }
    });
}
