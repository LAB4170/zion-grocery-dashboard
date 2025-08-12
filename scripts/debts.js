// Debt management functions

// Use global debts variable for consistency
let debts = window.debts || [];

function addDebt(event) {
    event.preventDefault();
    
    const customerName = document.getElementById('debtCustomerName').value;
    const customerPhone = document.getElementById('debtCustomerPhone').value;
    const amount = parseFloat(document.getElementById('debtAmount').value);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
        window.utils.showNotification('Please enter a valid amount.', 'error');
        return; // Exit the function if the amount is invalid
    }
    
    const dueDate = document.getElementById('debtDueDate').value;
    
    const debt = {
        id: window.utils.generateId(),
        customerName,
        customerPhone,
        amount,
        dueDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
    };
    
    debts.push(debt);
    window.debts = debts;
    window.utils.saveToStorage('debts', debts);
    
    window.utils.closeModal('debtModal');
    window.utils.showNotification('Debt recorded successfully!');
    
    if (window.currentSection === 'individual-debts') {
        loadDebtsData();
    }
    
    // Update dashboard
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}


function addDebtFromSale(sale) {
    const debt = {
        id: window.utils.generateId(),
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
    window.utils.saveToStorage('debts', debts);
}

function loadDebtsData() {
    const tbody = document.getElementById('debtsTableBody');
    if (!tbody) return;
    
    // Sync with global variables
    debts = window.debts || [];
    
    tbody.innerHTML = debts.map(debt => {
        const statusBadge = debt.status === 'pending' ? 
            '<span class="status-badge pending">PENDING</span>' : 
            '<span class="status-badge paid">PAID</span>';
            
        return `
            <tr>
                <td>${window.utils.formatDate(debt.createdAt)}</td>
                <td>${debt.customerName || 'Unknown Customer'}</td>
                <td>${debt.customerPhone || 'N/A'}</td>
                <td>${window.utils.formatCurrency(debt.amount || 0)}</td>
                <td>${statusBadge}</td>
                <td>${window.utils.formatDate(debt.dueDate)}</td>
                <td class="action-buttons">
                    ${debt.status === 'pending' ? `<button class="btn-small" onclick="markDebtPaid('${debt.id}')">Mark Paid</button>` : ''}
                    <button class="btn-small btn-danger" onclick="deleteDebt('${debt.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function loadGroupedDebtsData() {
    const content = document.getElementById('groupedDebtsContent');
    if (!content) return;
    
    // Sync with global variables
    debts = window.debts || [];
    
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
            <p>Total Outstanding: ${window.utils.formatCurrency(group.totalAmount)}</p>
            <div class="debt-list">
                ${group.debts.map(debt => `
                    <div class="debt-item">
                        <span>${window.utils.formatDate(debt.createdAt)} - ${window.utils.formatCurrency(debt.amount)} - ${debt.status}</span>
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
        window.utils.saveToStorage('debts', debts);
        loadDebtsData();
        window.utils.showNotification('Debt marked as paid!');
        updateDashboardStats();
    }
}

function deleteDebt(debtId) {
    if (confirm('Are you sure you want to delete this debt record?')) {
        debts = debts.filter(d => d.id !== debtId);
        window.utils.saveToStorage('debts', debts);
        loadDebtsData();
        window.utils.showNotification('Debt record deleted!');
        updateDashboardStats();
    }
}
