// M-Pesa transaction management

let mpesaTransactions = getFromStorage('mpesa', []);

function addMpesaFromSale(sale) {
    const transaction = {
        id: generateId(),
        transactionId: `MP${Date.now()}`,
        amount: sale.total,
        customerPhone: sale.customerPhone,
        status: 'completed',
        createdAt: sale.createdAt,
        date: sale.date,
        saleId: sale.id
    };
    
    mpesaTransactions.push(transaction);
    saveToStorage('mpesa', mpesaTransactions);
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
            id: generateId(),
            transactionId: `MP${Date.now()}`,
            amount: parsedAmount,
            customerPhone,
            status: 'completed',
            createdAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };
        
        mpesaTransactions.push(transaction);
        saveToStorage('mpesa', mpesaTransactions);
        loadMpesaData();
        showNotification('M-Pesa transaction added!');
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
            <td>${formatDate(transaction.createdAt)}</td>
            <td>${formatCurrency(transaction.amount)}</td>
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
        saveToStorage('mpesa', mpesaTransactions);
        loadMpesaData();
        showNotification('Transaction deleted!');
        updateDashboardStats();
    }
}
