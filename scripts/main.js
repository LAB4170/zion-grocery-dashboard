// Main application initialization

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Load initial data first
    products = getFromStorage('products', []);
    sales = getFromStorage('sales', []);
    expenses = getFromStorage('expenses', []);
    debts = getFromStorage('debts', []);
    mpesaTransactions = getFromStorage('mpesa', []);
    
    // Wait a bit for DOM to be fully ready, then set up navigation
    setTimeout(() => {
        showSection('dashboard');
        
        // Removed the sample data addition logic
        if (products.length === 0) {
            console.warn('No products found. Please add your products to get started.');
        }
        
        console.log('Zion Groceries Dashboard initialized successfully');
    }, 100);
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
