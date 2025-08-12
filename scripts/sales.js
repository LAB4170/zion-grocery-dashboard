// Sales management functions

// Use global sales variable for consistency - no redeclaration needed
// Access window.sales directly to avoid conflicts

function addSale(event) {
    event.preventDefault();
    
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const paymentMethod = document.getElementById('salePaymentMethod').value;
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const saleId = document.getElementById('salesModal').dataset.saleId;
    
    const product = products.find(p => p.id === parseInt(productId, 10));
    if (!product) {
        window.utils.showNotification('Please select a valid product', 'error');
        return;
    }
    
    if (saleId) {
        // Editing an existing sale
        const existingSale = sales.find(s => s.id === saleId);
        if (!existingSale) return;
        
        // Calculate stock difference
        const quantityDifference = quantity - existingSale.quantity;
        
        if (quantityDifference > product.stock) {
            window.utils.showNotification('Insufficient stock available for this update', 'error');
            return;
        }
        
        // Update product stock
        product.stock -= quantityDifference;
        window.utils.saveToStorage('products', products);
        
        // Update sale record
        existingSale.productId = productId;
        existingSale.productName = product.name;
        existingSale.quantity = quantity;
        existingSale.unitPrice = product.price;
        existingSale.total = product.price * quantity;
        existingSale.paymentMethod = paymentMethod;
        existingSale.customerName = paymentMethod === 'cash' ? '' : customerName;
        existingSale.customerPhone = paymentMethod === 'cash' ? '' : customerPhone;
        existingSale.status = paymentMethod === 'debt' ? 'pending' : 'completed';
        
        window.utils.saveToStorage('sales', sales);
        window.utils.showNotification('Sale updated successfully!');
    } else {
        // Adding a new sale
        if (quantity > product.stock) {
            window.utils.showNotification('Insufficient stock available', 'error');
            return;
        }
        
        const total = product.price * quantity;
        
        const sale = {
            id: window.utils.generateId(),
            productId,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            total,
            paymentMethod,
            customerName: paymentMethod === 'cash' ? '' : customerName,
            customerPhone: paymentMethod === 'cash' ? '' : customerPhone,
            status: paymentMethod === 'debt' ? 'pending' : 'completed',
            createdAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };
        
        sales.push(sale);
        window.utils.saveToStorage('sales', sales);
        
        // Update product stock
        product.stock -= quantity;
        window.utils.saveToStorage('products', products);
        
        // Add debt if payment method is debt
        if (paymentMethod === 'debt') {
            addDebtFromSale(sale);
        }
        
        // M-Pesa transactions are handled as regular sales
        
        window.utils.showNotification('Sale recorded successfully!');
    }
    
    closeModal('salesModal');
    
    if (currentSection === 'sales') {
        loadSalesData();
    }
    
    updateDashboardStats();
}

function loadSalesData() {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    
    // Sync with global variables
    sales = window.sales || [];
    
    tbody.innerHTML = sales.map(sale => {
        const paymentBadge = getPaymentBadge(sale.paymentMethod);
        const statusBadge = getStatusBadge(sale.status);
        
        return `
            <tr>
                <td>${window.utils.formatDate(sale.createdAt)}</td>
                <td>${sale.productName || 'Unknown Product'}</td>
                <td>${sale.quantity || 0}</td>
                <td>${window.utils.formatCurrency(sale.unitPrice || 0)}</td>
                <td>${window.utils.formatCurrency(sale.total || 0)}</td>
                <td>${paymentBadge}</td>
                <td>${statusBadge}</td>
                <td class="action-buttons">
                    <button class="btn-small" onclick="viewSaleDetails('${sale.id}')">View</button>
                    <button class="btn-small" onclick="editSale('${sale.id}')">Edit</button>
                    <button class="btn-small btn-danger" onclick="deleteSale('${sale.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Helper function for payment method badges
function getPaymentBadge(paymentMethod) {
    const badges = {
        'cash': '<span class="payment-badge cash">CASH</span>',
        'mpesa': '<span class="payment-badge mpesa">M-PESA</span>',
        'debt': '<span class="payment-badge debt">DEBT</span>'
    };
    return badges[paymentMethod] || `<span class="payment-badge">${(paymentMethod || 'UNKNOWN').toUpperCase()}</span>`;
}

// Helper function for status badges
function getStatusBadge(status) {
    const badges = {
        'completed': '<span class="status-badge completed">COMPLETED</span>',
        'pending': '<span class="status-badge pending">PENDING</span>',
        'cancelled': '<span class="status-badge cancelled">CANCELLED</span>'
    };
    return badges[status] || `<span class="status-badge">${(status || 'UNKNOWN').toUpperCase()}</span>`;
}

function deleteSale(saleId) {
    if (!confirm('Are you sure you want to delete this sale?')) {
        return;
    }
    
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
        // Restore stock to the product
        const product = (window.products || []).find(p => p.id === sale.productId);
        if (product) {
            product.stock += sale.quantity;
            window.products = window.products || [];
            window.utils.saveToStorage('products', window.products);
        }
    }
    
    sales = sales.filter(s => s.id !== saleId);
    window.sales = sales;
    window.utils.saveToStorage('sales', sales);
    
    loadSalesData();
    window.utils.showNotification('Sale deleted successfully!');
    
    // Update dashboard
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}

function viewSaleDetails(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
        window.utils.showNotification(`Sale Details:\n\nProduct: ${sale.productName}\nQuantity: ${sale.quantity}\nUnit Price: ${window.utils.formatCurrency(sale.unitPrice)}\nTotal: ${window.utils.formatCurrency(sale.total)}\nPayment: ${sale.paymentMethod}\nCustomer: ${sale.customerName || 'N/A'}\nDate: ${window.utils.formatDate(sale.createdAt)}`, 'info');
    }
}

function editSale(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    
    // Populate product select first
    populateProductSelect();
    
    // Set modal title and button text
    const modalTitle = document.getElementById('salesModalTitle');
    const submitButton = document.getElementById('salesModalSubmit');
    
    if (modalTitle) modalTitle.textContent = 'Edit Sale';
    if (submitButton) submitButton.textContent = 'Update Sale';
    
    // Store sale ID in the modal for reference
    const modal = document.getElementById('salesModal');
    if (modal) modal.dataset.saleId = saleId;
    
    // Populate form fields with validation
    const productSelect = document.getElementById('saleProduct');
    const quantityInput = document.getElementById('saleQuantity');
    const paymentSelect = document.getElementById('salePaymentMethod');
    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');
    
    if (productSelect) productSelect.value = sale.productId;
    if (quantityInput) quantityInput.value = sale.quantity;
    if (paymentSelect) paymentSelect.value = sale.paymentMethod;
    if (customerNameInput) customerNameInput.value = sale.customerName || '';
    if (customerPhoneInput) customerPhoneInput.value = sale.customerPhone || '';
    
    // Trigger customer info visibility
    toggleCustomerInfo();
    
    // Show modal
    window.utils.openModal('salesModal');
}
function resetSalesModal() {
    document.getElementById('salesModalTitle').textContent = 'Add New Sale';
    document.getElementById('salesModalSubmit').textContent = 'Add Sale';
    document.getElementById('salesModal').dataset.saleId = '';
    document.getElementById('saleForm').reset();
}
