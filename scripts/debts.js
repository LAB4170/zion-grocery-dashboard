// Debt management functions

let debts = getFromStorage('debts', []);

function addDebt(event) {
    event.preventDefault();
    
    const customerName = document.getElementById('debtCustomerName').value;
    const customerPhone = document.getElementById('debtCustomerPhone').value;
    const amount = parseFloat(document.getElementById('debtAmount').value);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
        showNotification('Please enter a valid amount.');
        return; // Exit the function if the amount is invalid
    }
    
    const dueDate = document.getElementById('debtDueDate').value;
    
    const debt = {
        id: generateId(),
        customerName,
        customerPhone,
        amount,
        dueDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
    };
    
    debts.push(debt);
    saveToStorage('debts', debts);
    
    closeModal('debtModal');
    showNotification('Debt recorded successfully!');
    
    if (currentSection === 'individual-debts') {
        loadDebtsData();
    }
    
    updateDashboardStats();
}


function addDebtFromSale(sale) {
    const debt = {
        id: generateId(),
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        amount: sale.total,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'pending',
        createdAt: sale.createdAt,
        date: sale.date,
        saleId: sale.id
    };
    
    debts.push(debt);
    saveToStorage('debts', debts);
}

function loadDebtsData() {
    const tbody = document.getElementById('debtsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = debts.map(debt => `
        <tr>
            <td>${formatDate(debt.createdAt)}</td>
            <td>${debt.customerName}</td>
            <td>${debt.customerPhone}</td>
            <td>${formatCurrency(debt.amount)}</td>
            <td><span class="status ${debt.status}">${debt.status}</span></td>
            <td>${formatDate(debt.dueDate)}</td>
            <td>
                <button class="btn-small" onclick="markDebtPaid('${debt.id}')">Mark Paid</button>
                <button class="btn-small btn-danger" onclick="deleteDebt('${debt.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function loadGroupedDebtsData() {
    const content = document.getElementById('groupedDebtsContent');
    if (!content) return;
    
    // Group debts by customer
    const groupedDebts = debts.reduce((groups, debt) => {
        const key = `${debt.customerName}-${debt.customerPhone}`;
        if (!groups[key]) {
            groups[key] = {
                customerName: debt.customerName,
                customerPhone: debt.customerPhone,
                debts: [],
                totalAmount: 0
            };
        }
        groups[key].debts.push(debt);
        if (debt.status === 'pending') {
            groups[key].totalAmount += debt.amount;
        }
        return groups;
    }, {});
    
    content.innerHTML = Object.values(groupedDebts).map(group => `
        <div class="debt-group">
            <h4>${group.customerName} (${group.customerPhone})</h4>
            <p>Total Outstanding: ${formatCurrency(group.totalAmount)}</p>
            <div class="debt-list">
                ${group.debts.map(debt => `
                    <div class="debt-item">
                        <span>${formatDate(debt.createdAt)} - ${formatCurrency(debt.amount)} - ${debt.status}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function markDebtPaid(debtId) {
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
        debt.status = 'paid';
        debt.paidAt = new Date().toISOString();
        saveToStorage('debts', debts);
        loadDebtsData();
        showNotification('Debt marked as paid!');
        updateDashboardStats();
    }
}

function deleteDebt(debtId) {
    if (confirm('Are you sure you want to delete this debt record?')) {
        debts = debts.filter(d => d.id !== debtId);
        saveToStorage('debts', debts);
        loadDebtsData();
        showNotification('Debt record deleted!');
        updateDashboardStats();
    }
}
