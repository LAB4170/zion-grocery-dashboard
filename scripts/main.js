// Global data storage
const data = {
    products: [],
    sales: [],
    expenses: [],
    debts: [],
    mpesaTransactions: []
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    setTimeout(initializeCharts, 500);
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};
