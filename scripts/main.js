// Main application initialization

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Load ONLY from storage (default to empty arrays)
    products = getFromStorage('products', []);
    sales = getFromStorage('sales', []);
    expenses = getFromStorage('expenses', []);
    debts = getFromStorage('debts', []);
    mpesaTransactions = getFromStorage('mpesa', []);

    // No setTimeout needed if DOM is already ready (DOMContentLoaded ensures this)
    showSection('dashboard');

    // Optional: Log warnings if critical data is missing (no preloading)
    if (products.length === 0) {
        console.warn('Product list is empty. Add products to begin.');
    }
    console.log('App initialized with user data only.');
}

// Function to search through the products table
function searchTable(query) {
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase())
    );
    displayProducts(filteredProducts); // Assuming a function to display products
}

// Utility function to safely update element content
function safeUpdateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content;
        return true;
    } else {
        console.warn(`Element with ID '${elementId}' not found`);
        return false;
    }
}

// Export functions for global access
window.showSection = showSection;
window.toggleSubmenu = toggleSubmenu;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleCustomerInfo = toggleCustomerInfo;
window.addProduct = addProduct;
window.addSale = addSale;
window.addExpense = addExpense;
window.addDebt = addDebt;
window.searchTable = searchTable; // Now defined
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.deleteSale = deleteSale;
window.viewSaleDetails = viewSaleDetails;
window.deleteExpense = deleteExpense;
window.markDebtPaid = markDebtPaid;
window.deleteDebt = deleteDebt;
window.addManualMpesaTransaction = addManualMpesaTransaction;
window.refreshMpesaTransactions = refreshMpesaTransactions;
window.deleteMpesaTransaction = deleteMpesaTransaction;
window.generateDailyReport = generateDailyReport;
window.generateWeeklyReport = generateWeeklyReport;
window.generateMonthlyReport = generateMonthlyReport;
window.exportReport = exportReport;
window.safeUpdateElement = safeUpdateElement;
