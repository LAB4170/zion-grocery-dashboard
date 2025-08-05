// M-Pesa management
function renderMpesaTable() {
    const tbody = document.getElementById('mpesaTableBody');
    tbody.innerHTML = '';
    
    data.mpesaTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.date}</td>
            <td>KSh ${transaction.amount.toFixed(2)}</td>
            <td>${transaction.customerPhone}</td>
            <td><span class="mpesa-status">${transaction.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="viewTransaction('${transaction.id}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function refreshMpesaTransactions() {
    // Simulate API call to fetch M-Pesa transactions
    alert('Fetching latest M-Pesa transactions from Pochi La Biashara (0117511337)...');
    
    // Simulate some new transactions
    const newTransactions = [
        {
            id: 'MP' + Date.now(),
            date: new Date().toLocaleString(),
            amount: Math.floor(Math.random() * 5000) + 100,
            customerPhone: '254' + Math.floor(Math.random() * 1000000000),
            status: 'completed'
        }
    ];
    
    data.mpesaTransactions.push(...newTransactions);
    renderMpesaTable();
    updateDashboard();
}
