// M-Pesa Management with Manual Entry and Auto-Save
function renderMpesaTable() {
    const tbody = document.getElementById('mpesaTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...data.mpesaTransactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    sortedTransactions.forEach(transaction => {
        try {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td>${new Date(transaction.date).toLocaleString()}</td>
                <td>KSh ${transaction.amount?.toFixed(2) || '0.00'}</td>
                <td>${formatPhoneNumber(transaction.customerPhone)}</td>
                <td><span class="mpesa-status ${transaction.status}">${transaction.status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-small" onclick="viewTransactionDetails('${transaction.id}')">View</button>
                    <button class="btn btn-danger btn-small" onclick="deleteMpesaTransaction('${transaction.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        } catch (error) {
            console.error('Error rendering transaction row:', error);
        }
    });
}

function addManualMpesaTransaction() {
    try {
        const amountInput = prompt('Enter transaction amount (KSh):');
        const phoneInput = prompt('Enter customer phone number (e.g., 2547XXXXXXXX):');
        
        if (amountInput === null || phoneInput === null) {
            return; // User cancelled
        }

        const transaction = {
            id: 'MP' + Date.now(),
            date: new Date().toISOString(),
            amount: parseFloat(amountInput),
            customerPhone: phoneInput,
            status: 'completed' // Assuming manual entries are always completed
        };

        // Validate inputs
        if (isNaN(transaction.amount)) {
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
        if (data.save) data.save(); // Auto-save to LocalStorage
        showToast('Transaction added successfully');
    } catch (error) {
        console.error('Error adding manual M-Pesa transaction:', error);
        showToast('An error occurred while adding transaction', 'error');
    }
}

function viewTransactionDetails(id) {
    try {
        const transaction = data.mpesaTransactions.find(t => t.id === id);
        if (!transaction) {
            showToast('Transaction not found', 'error');
            return;
        }

        const detailHtml = `
            <h3>Transaction Details</h3>
            <p><strong>ID:</strong> ${transaction.id}</p>
            <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleString()}</p>
            <p><strong>Amount:</strong> KSh ${transaction.amount?.toFixed(2) || '0.00'}</p>
            <p><strong>Phone:</strong> ${formatPhoneNumber(transaction.customerPhone)}</p>
            <p><strong>Status:</strong> <span class="${transaction.status}">${transaction.status}</span></p>
        `;
        
        openDetailModal('M-Pesa Transaction', detailHtml);
    } catch (error) {
        console.error('Error viewing transaction details:', error);
        showToast('Error showing transaction details', 'error');
    }
}

function deleteMpesaTransaction(id) {
    try {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const initialLength = data.mpesaTransactions.length;
            data.mpesaTransactions = data.mpesaTransactions.filter(t => t.id !== id);
            
            if (data.mpesaTransactions.length < initialLength) {
                renderMpesaTable();
                updateDashboard();
                if (data.save) data.save(); // Auto-save to LocalStorage
                showToast('Transaction deleted successfully');
            } else {
                showToast('Transaction not found', 'error');
            }
        }
    } catch (error) {
        console.error('Error deleting M-Pesa transaction:', error);
        showToast('Error deleting transaction', 'error');
    }
}

// Helper function to format phone numbers
function formatPhoneNumber(phone) {
    try {
        if (!phone) return '';
        // Convert 254XXXXXXXXX to 0XX XXX XXXX
        const cleaned = phone.toString().replace(/^254/, '0');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3,4})/, '$1 $2 $3');
    } catch (error) {
        console.error('Error formatting phone number:', error);
        return phone || '';
    }
}

// Helper function to show toast notifications
function showToast(message, type = 'success') {
    try {
        const toastContainer = document.getElementById('toast-container') || document.body;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } catch (error) {
        console.error('Error showing toast:', error);
        // Fallback to alert if toast system fails
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize M-Pesa functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if data exists and has mpesaTransactions array
    if (data && !Array.isArray(data.mpesaTransactions)) {
        data.mpesaTransactions = [];
    }
    
    // Initial render
    renderMpesaTable();
});
