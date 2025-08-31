// Main application initialization

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Load ONLY from storage (default to empty arrays)
    window.products = window.utils.getFromStorage('products', []);
    window.sales = window.utils.getFromStorage('sales', []);
    window.expenses = window.utils.getFromStorage('expenses', []);
    window.debts = window.utils.getFromStorage('debts', []);


    // Assign to local variables for backward compatibility
    products = window.products;
    sales = window.sales;
    expenses = window.expenses;
    debts = window.debts;


    // Navigation.js will handle section initialization after partials load
    // showSection('dashboard'); // Removed - causes timing conflict

    // Optional: Log warnings if critical data is missing (no preloading)
    if (products.length === 0) {
        console.warn('Product list is empty. Add products to begin.');
    }
    console.log('App initialized with user data only.');
}

// Function to search through tables - aligned with HTML calls
function searchTable(tableId, searchValue) {
    // Use utils searchTable function for consistency
    window.utils.searchTable(tableId, searchValue);
}

// Legacy function for backward compatibility
function searchProducts(query) {
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase())
    );
    loadProductsData(filteredProducts);
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

// Make global variables accessible
window.products = [];
window.sales = [];
window.expenses = [];
window.debts = [];

window.currentSection = null;

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
window.searchTable = searchTable;
window.searchProducts = searchProducts;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.deleteSale = deleteSale;
window.viewSaleDetails = viewSaleDetails;
window.deleteExpense = deleteExpense;
window.markDebtPaid = markDebtPaid;
window.deleteDebt = deleteDebt;

window.generateDailyReport = generateDailyReport;
window.generateWeeklyReport = generateWeeklyReport;
window.generateMonthlyReport = generateMonthlyReport;
window.safeUpdateElement = safeUpdateElement;
window.loadProductsData = loadProductsData;
window.loadSalesData = loadSalesData;
window.loadExpensesData = loadExpensesData;
window.loadDebtsData = loadDebtsData;
window.updateDashboardStats = updateDashboardStats;
window.populateProductSelect = populateProductSelect;
