// M-Pesa transaction management

// Use global mpesaTransactions variable for consistency
let mpesaTransactions = window.mpesaTransactions || [];

function addMpesaFromSale(sale) {
    const transaction = {
        id: window.utils.generateId(),
        transactionId: `MP${Date.now()}`,
        amount: sale.total,
        customerPhone: sale.customerPhone,
        status: 'completed',
        createdAt: sale.createdAt,
        date: sale.date,
        saleId: sale.id
    };
    
    mpesaTransactions.push(transaction);
    window.mpesaTransactions = mpesaTransactions;
    window.utils.saveToStorage('mpesa', mpesaTransactions);
}

function addManualMpesaTransaction() {
    const amount = prompt('Enter transaction amount:');
    const customerPhone = prompt('Enter customer phone:');
    
    // Validate amount input
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid amount greater than zero.');
        return;
    }

    if (customerPhone) {
        const transaction = {
            id: window.utils.generateId(),
            transactionId: `MP${Date.now()}`,
            amount: parsedAmount,
            customerPhone,
            status: 'completed',
            createdAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };
        
        mpesaTransactions.push(transaction);
        window.utils.saveToStorage('mpesa', mpesaTransactions);
        loadMpesaData();
        window.utils.showNotification('M-Pesa transaction added!');
        updateDashboardStats();
    }
}


function refreshMpesaTransactions() {
    // In a real application, this would fetch from M-Pesa API
    showNotification('M-Pesa transactions refreshed!', 'info');
    loadMpesaData();
}

function loadMpesaData() {
    const tbody = document.getElementById('mpesaTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = mpesaTransactions.map(transaction => `
        <tr>
            <td>${transaction.transactionId}</td>
            <td>${window.utils.formatDate(transaction.createdAt)}</td>
            <td>${window.utils.formatCurrency(transaction.amount)}</td>
            <td>${transaction.customerPhone}</td>
            <td><span class="status ${transaction.status}">${transaction.status}</span></td>
            <td>
                <button class="btn-small btn-danger" onclick="deleteMpesaTransaction('${transaction.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteMpesaTransaction(transactionId) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        mpesaTransactions = mpesaTransactions.filter(t => t.id !== transactionId);
        window.utils.saveToStorage('mpesa', mpesaTransactions);
        loadMpesaData();
        window.utils.showNotification('Transaction deleted!');
        updateDashboardStats();
    }
}
