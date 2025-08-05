// M-Pesa Management with Manual Entry and Auto-Save
function renderMpesaTable() {
    const tbody = document.getElementById('mpesaTableBody');
    tbody.innerHTML = '';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...data.mpesaTransactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${new Date(transaction.date).toLocaleString()}</td>
            <td>KSh ${transaction.amount.toFixed(2)}</td>
            <td>${formatPhoneNumber(transaction.customerPhone)}</td>
            <td><span class="mpesa-status ${transaction.status}">${transaction.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="viewTransactionDetails('${transaction.id}')">View</button>
                <button class="btn btn-danger btn-small" onclick="deleteMpesaTransaction('${transaction.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addManualMpesaTransaction() {
    const transaction = {
        id: 'MP' + Date.now(),
        date: new Date().toISOString(),
        amount: parseFloat(prompt('Enter transaction amount (KSh):')),
        customerPhone: prompt('Enter customer phone number (e.g., 2547XXXXXXXX):'),
        status: 'completed' // Assuming manual entries are always completed
    };

    // Validate inputs
    if (isNaN(transaction.amount) {
        showToast('Invalid amount entered', 'error');
        return;
    }

    if (!/^254\d{9}$/.test(transaction.customerPhone)) {
        showToast('Invalid phone number format. Use 2547XXXXXXXX', 'error');
        return;
    }

    data.mpesaTransactions.push(transaction);
    renderMpesaTable();
    updateDashboard();
    data.save(); // Auto-save to LocalStorage
    showToast('Transaction added successfully');
}

function viewTransactionDetails(id) {
    const transaction = data.mpesaTransactions.find(t => t.id === id);
    if (!transaction) return;

    const detailHtml = `
        <h3>Transaction Details</h3>
        <p><strong>ID:</strong> ${transaction.id}</p>
        <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleString()}</p>
        <p><strong>Amount:</strong> KSh ${transaction.amount.toFixed(2)}</p>
        <p><strong>Phone:</strong> ${formatPhoneNumber(transaction.customerPhone)}</p>
        <p><strong>Status:</strong> <span class="${transaction.status}">${transaction.status}</span></p>
    `;
    
    openDetailModal('M-Pesa Transaction', detailHtml);
}

function deleteMpesaTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        data.mpesaTransactions = data.mpesaTransactions.filter(t => t.id !== id);
        renderMpesaTable();
        updateDashboard();
        data.save(); // Auto-save to LocalStorage
        showToast('Transaction deleted successfully');
    }
}

// Helper function to format phone numbers
function formatPhoneNumber(phone) {
    // Convert 254XXXXXXXXX to 0XX XXX XXXX
    const cleaned = phone.replace(/^254/, '0');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3,4})/, '$1 $2 $3');
}

// Helper function to show toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}
