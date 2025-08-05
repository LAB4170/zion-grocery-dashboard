// Sales management
document.getElementById('salePaymentMethod').addEventListener('change', function() {
    const method = this.value;
    const customerInfo = document.getElementById('customerInfoGroup');
    const customerPhone = document.getElementById('customerPhoneGroup');
    
    if (method === 'debt') {
        customerInfo.style.display = 'block';
        customerPhone.style.display = 'block';
        document.getElementById('customerName').required = true;
        document.getElementById('customerPhone').required = true;
    } else {
        customerInfo.style.display = 'none';
        customerPhone.style.display = 'none';
        document.getElementById('customerName').required = false;
        document.getElementById('customerPhone').required = false;
    }
});

function editSale(id) {
    const sale = data.sales.find(s => s.id === id);
    if (!sale) return;

    // Find the product to get current details
    const product = data.products.find(p => p.id === sale.productId);
    
    // Populate the form fields
    document.getElementById('saleProduct').value = sale.productId;
    document.getElementById('saleQuantity').value = sale.quantity;
    document.getElementById('salePaymentMethod').value = sale.paymentMethod;
    
    // Handle customer info for debt sales
    if (sale.paymentMethod === 'debt') {
        document.getElementById('customerName').value = sale.customerName;
        document.getElementById('customerPhone').value = sale.customerPhone;
        document.getElementById('customerInfoGroup').style.display = 'block';
        document.getElementById('customerPhoneGroup').style.display = 'block';
    } else {
        document.getElementById('customerInfoGroup').style.display = 'none';
        document.getElementById('customerPhoneGroup').style.display = 'none';
    }

    // Store the sale ID in the form dataset
    const form = document.querySelector('#salesModal form');
    form.dataset.editingId = id;

    // Change button text
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Sale';

    // Update the dropdown to show current stock
    populateProductDropdown();
    
    openModal('salesModal');
}

function addSale(event) {
    event.preventDefault();
    
    const form = event.target;
    const editingId = form.dataset.editingId;
    
    const productId = parseInt(document.getElementById('saleProduct').value);
    const product = data.products.find(p => p.id === productId);
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const paymentMethod = document.getElementById('salePaymentMethod').value;
    const customerName = document.getElementById('customerName').value || '';
    const customerPhone = document.getElementById('customerPhone').value || '';
    
    if (!product) {
        alert('Please select a valid product');
        return;
    }
    
    if (product.stock < quantity && !editingId) {
        alert('Insufficient stock available');
        return;
    }
    
    const total = product.price * quantity;
    
    if (editingId) {
        // Update existing sale
        const saleIndex = data.sales.findIndex(s => s.id === parseInt(editingId));
        if (saleIndex !== -1) {
            const oldSale = data.sales[saleIndex];
            
            // Restore old stock quantity
            const oldProduct = data.products.find(p => p.id === oldSale.productId);
            if (oldProduct) {
                oldProduct.stock += oldSale.quantity;
            }
            
            // Update with new data
            data.sales[saleIndex] = {
                ...oldSale,
                productId: productId,
                productName: product.name,
                quantity: quantity,
                unitPrice: product.price,
                total: total,
                paymentMethod: paymentMethod,
                status: paymentMethod === 'debt' ? 'pending' : 'completed',
                customerName: customerName,
                customerPhone: customerPhone
            };
            
            // Update new stock quantity
            product.stock -= quantity;
            
            // Handle debt updates if payment method changed to/from debt
            if (paymentMethod === 'debt' && oldSale.paymentMethod !== 'debt') {
                // Add new debt record
                const debt = {
                    id: Date.now() + 1,
                    date: new Date().toISOString().split('T')[0],
                    customerName: customerName,
                    customerPhone: customerPhone,
                    amount: total,
                    status: 'pending',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                };
                data.debts.push(debt);
            } else if (paymentMethod !== 'debt' && oldSale.paymentMethod === 'debt') {
                // Remove old debt record
                data.debts = data.debts.filter(d => 
                    !(d.customerName === oldSale.customerName && 
                      d.customerPhone === oldSale.customerPhone && 
                      d.amount === oldSale.total)
                );
            }
            renderDebtsTable();
        }
        
        // Reset the editing state
        delete form.dataset.editingId;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Add Sale';
    } else {
        // Add new sale
        const sale = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            productId: productId,
            productName: product.name,
            quantity: quantity,
            unitPrice: product.price,
            total: total,
            paymentMethod: paymentMethod,
            status: paymentMethod === 'debt' ? 'pending' : 'completed',
            customerName: customerName,
            customerPhone: customerPhone
        };
        
        // Update product stock
        product.stock -= quantity;
        
        // Add debt record if payment method is debt
        if (paymentMethod === 'debt') {
            const debt = {
                id: Date.now() + 1,
                date: new Date().toISOString().split('T')[0],
                customerName: sale.customerName,
                customerPhone: sale.customerPhone,
                amount: total,
                status: 'pending',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };
            data.debts.push(debt);
            renderDebtsTable();
        }
        
        // Simulate M-Pesa transaction if payment method is mpesa
        if (paymentMethod === 'mpesa') {
            const mpesaTransaction = {
                id: 'MP' + Date.now(),
                date: new Date().toLocaleString(),
                amount: total,
                customerPhone: '254' + Math.floor(Math.random() * 1000000000),
                status: 'completed'
            };
            data.mpesaTransactions.push(mpesaTransaction);
            renderMpesaTable();
        }
        
        data.sales.push(sale);
    }
    
    renderSalesTable();
    renderProductsTable();
    updateDashboard();
    closeModal('salesModal');
    form.reset();
}

function renderSalesTable() {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    
    data.sales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>KSh ${sale.unitPrice.toFixed(2)}</td>
            <td>KSh ${sale.total.toFixed(2)}</td>
            <td>${sale.paymentMethod.toUpperCase()}</td>
            <td><span class="${sale.status === 'completed' ? 'mpesa-status' : 'debt-status-pending'}">${sale.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="editSale(${sale.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteSale(${sale.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale?')) {
        const sale = data.sales.find(s => s.id === id);
        if (sale) {
            // Restore product stock
            const product = data.products.find(p => p.id === sale.productId);
            if (product) {
                product.stock += sale.quantity;
            }
            
            // Remove associated debt if payment method was debt
            if (sale.paymentMethod === 'debt') {
                data.debts = data.debts.filter(d => 
                    !(d.customerName === sale.customerName && 
                      d.customerPhone === sale.customerPhone && 
                      d.amount === sale.total)
                );
                renderDebtsTable();
            }
        }
        data.sales = data.sales.filter(sale => sale.id !== id);
        renderSalesTable();
        renderProductsTable();
        updateDashboard();
    }
}
