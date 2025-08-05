// Debt Management with Auto-Save
function addDebt(event) {
    event.preventDefault();
    
    // Validate inputs
    const customerName = document.getElementById('debtCustomerName').value.trim();
    const customerPhone = document.getElementById('debtCustomerPhone').value.trim();
    const amount = parseFloat(document.getElementById('debtAmount').value);
    const dueDate = document.getElementById('debtDueDate').value;
    
    if (!customerName || !customerPhone || isNaN(amount) || !dueDate) {
        alert('Please fill all fields with valid values');
        return;
    }
    
    if (amount <= 0) {
        alert('Debt amount must be positive');
        return;
    }
    
    // Validate Kenyan phone number format (254XXXXXXXXX or 07XXXXXXXX)
    const phoneRegex = /^(?:254|\+254|0)?(7\d{8})$/;
    if (!phoneRegex.test(customerPhone)) {
        alert('Please enter a valid Kenyan phone number (e.g., 07XXXXXXXX or 2547XXXXXXXX)');
        return;
    }
    
    // Validate due date is in the future
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) {
        alert('Due date must be in the future');
        return;
    }

    const debt = {
        id: Date.now(),
        date: today,
        customerName: customerName,
        customerPhone: customerPhone.replace(/^(?:254|\+254|0)?(7\d{8})$/, '254$1'), // Standardize to 254 format
        amount: amount,
        status: 'pending',
        dueDate: dueDate
    };
    
    data.debts.push(debt);
    renderDebtsTable();
    updateDashboard();
    data.save(); // Auto-save to LocalStorage
    closeModal('debtModal');
    event.target.reset();
}

function renderDebtsTable() {
    const tbody = document.getElementById('debtsTableBody');
    tbody.innerHTML = '';
    
    data.debts.forEach(debt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${debt.date}</td>
            <td>${debt.customerName}</td>
            <td>${debt.customerPhone}</td>
            <td>KSh ${debt.amount.toFixed(2)}</td>
            <td><span class="debt-status-${debt.status}">${debt.status}</span></td>
            <td>${debt.dueDate}</td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="markDebtPaid(${debt.id})">Mark Paid</button>
                <button class="btn btn-danger btn-small" onclick="deleteDebt(${debt.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateGroupedDebts();
}

function updateGroupedDebts() {
    const groupedDebtsContainer = document.getElementById('groupedDebtsContent');
    
    // Group debts by customer
    const groupedDebts = {};
    data.debts.filter(debt => debt.status === 'pending').forEach(debt => {
        const key = `${debt.customerName}_${debt.customerPhone}`;
        if (!groupedDebts[key]) {
            groupedDebts[key] = {
                customerName: debt.customerName,
                customerPhone: debt.customerPhone,
                debts: [],
                totalAmount: 0
            };
        }
        groupedDebts[key].debts.push(debt);
        groupedDebts[key].totalAmount += debt.amount;
    });
    
    // Filter customers with multiple debts
    const multipleDebts = Object.values(groupedDebts).filter(group => group.debts.length > 1);
    
    if (multipleDebts.length === 0) {
        groupedDebtsContainer.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">No customers with multiple pending debts found.</p>';
        return;
    }
    
    let html = '<h3 style="color: white; margin-bottom: 20px;">Customers with Multiple Pending Debts</h3>';
    html += '<table class="table"><thead><tr><th>Customer</th><th>Phone</th><th>Number of Debts</th><th>Total Amount</th><th>Actions</th></tr></thead><tbody>';
    
    multipleDebts.forEach(group => {
        html += `
            <tr>
                <td>${group.customerName}</td>
                <td>${group.customerPhone}</td>
                <td>${group.debts.length}</td>
                <td>KSh ${group.totalAmount.toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn btn-small" onclick="viewCustomerDebts('${group.customerName}', '${group.customerPhone}')">View Details</button>
                    <button class="btn btn-small" onclick="markAllCustomerDebtsPaid('${group.customerName}', '${group.customerPhone}')">Mark All Paid</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    groupedDebtsContainer.innerHTML = html;
}

function viewCustomerDebts(customerName, customerPhone) {
    const customerDebts = data.debts.filter(debt => 
        debt.customerName === customerName && 
        debt.customerPhone === customerPhone && 
        debt.status === 'pending'
    );
    
    let details = `Customer: ${customerName}\nPhone: ${customerPhone}\n\nPending Debts:\n`;
    customerDebts.forEach((debt, index) => {
        details += `${index + 1}. Date: ${debt.date}, Amount: KSh ${debt.amount.toFixed(2)}, Due: ${debt.dueDate}\n`;
    });
    
    alert(details);
}

function markAllCustomerDebtsPaid(customerName, customerPhone) {
    if (confirm(`Mark all debts for ${customerName} as paid?`)) {
        data.debts.forEach(debt => {
            if (debt.customerName === customerName && 
                debt.customerPhone === customerPhone && 
                debt.status === 'pending') {
                debt.status = 'paid';
            }
        });
        renderDebtsTable();
        updateDashboard();
        data.save(); // Auto-save to LocalStorage
    }
}

function markDebtPaid(id) {
    const debt = data.debts.find(d => d.id === id);
    if (debt) {
        debt.status = 'paid';
        renderDebtsTable();
        updateDashboard();
        data.save(); // Auto-save to LocalStorage
    }
}

function deleteDebt(id) {
    if (confirm('Are you sure you want to delete this debt record?')) {
        data.debts = data.debts.filter(debt => debt.id !== id);
        renderDebtsTable();
        updateDashboard();
        data.save(); // Auto-save to LocalStorage
    }
}
