// Sales management functions

let sales = getFromStorage('sales', []);

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
        showNotification('Please select a valid product', 'error');
        return;
    }
    
    if (saleId) {
        // Editing an existing sale
        const existingSale = sales.find(s => s.id === saleId);
        if (!existingSale) return;
        
        // Calculate stock difference
        const quantityDifference = quantity - existingSale.quantity;
        
        if (quantityDifference > product.stock) {
            showNotification('Insufficient stock available for this update', 'error');
            return;
        }
        
        // Update product stock
        product.stock -= quantityDifference;
        saveToStorage('products', products);
        
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
        
        saveToStorage('sales', sales);
        showNotification('Sale updated successfully!');
    } else {
        // Adding a new sale
        if (quantity > product.stock) {
            showNotification('Insufficient stock available', 'error');
            return;
        }
        
        const total = product.price * quantity;
        
        const sale = {
            id: generateId(),
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
        saveToStorage('sales', sales);
        
        // Update product stock
        product.stock -= quantity;
        saveToStorage('products', products);
        
        // Add debt if payment method is debt
        if (paymentMethod === 'debt') {
            addDebtFromSale(sale);
        }
        
        // Add M-Pesa transaction if payment method is M-Pesa
        if (paymentMethod === 'mpesa') {
            addMpesaFromSale(sale);
        }
        
        showNotification('Sale recorded successfully!');
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
    
    tbody.innerHTML = sales.map(sale => `
        <tr>
            <td>${formatDate(sale.createdAt)}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>${formatCurrency(sale.unitPrice)}</td>
            <td>${formatCurrency(sale.total)}</td>
            <td>${sale.paymentMethod.toUpperCase()}</td>
            <td><span class="status ${sale.status}">${sale.status}</span></td>
            <td>
                <button class="btn-small" onclick="viewSaleDetails('${sale.id}')">View</button>
                <button class="btn-small" onclick="editSale('${sale.id}')">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteSale('${sale.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteSale(saleId) {
    if (confirm('Are you sure you want to delete this sale?')) {
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            // Restore stock
            const product = products.find(p => p.id === sale.productId);
            if (product) {
                product.stock += sale.quantity;
                saveToStorage('products', products);
            }
        }
        
        sales = sales.filter(s => s.id !== saleId);
        saveToStorage('sales', sales);
        loadSalesData();
        showNotification('Sale deleted successfully!');
        updateDashboardStats();
    }
}

function viewSaleDetails(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
        alert(`Sale Details:\n\nProduct: ${sale.productName}\nQuantity: ${sale.quantity}\nUnit Price: ${formatCurrency(sale.unitPrice)}\nTotal: ${formatCurrency(sale.total)}\nPayment: ${sale.paymentMethod}\nCustomer: ${sale.customerName || 'N/A'}\nDate: ${formatDate(sale.createdAt)}`);
    }
}

function editSale(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    
    // Set modal title
    document.getElementById('salesModalTitle').textContent = 'Edit Sale';
    
    // Change button text
    document.getElementById('salesModalSubmit').textContent = 'Update Sale';
    
    // Store sale ID in the modal for reference
    document.getElementById('salesModal').dataset.saleId = saleId;
    
    // Populate form fields
    document.getElementById('saleProduct').value = sale.productId;
    document.getElementById('saleQuantity').value = sale.quantity;
    document.getElementById('salePaymentMethod').value = sale.paymentMethod;
    document.getElementById('customerName').value = sale.customerName || '';
    document.getElementById('customerPhone').value = sale.customerPhone || '';
    
    // Show modal
    openModal('salesModal');
}
function resetSalesModal() {
    document.getElementById('salesModalTitle').textContent = 'Add New Sale';
    document.getElementById('salesModalSubmit').textContent = 'Add Sale';
    document.getElementById('salesModal').dataset.saleId = '';
    document.getElementById('saleForm').reset();
}
