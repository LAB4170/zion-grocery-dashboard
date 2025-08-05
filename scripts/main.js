// Global data storage with LocalStorage integration
const data = {
  products: [],
  sales: [],
  expenses: [],
  debts: [],
  mpesaTransactions: [],

  // Save all data to LocalStorage
  save: function() {
    localStorage.setItem('zionGroceriesData', JSON.stringify({
      products: this.products,
      sales: this.sales,
      expenses: this.expenses,
      debts: this.debts,
      mpesaTransactions: this.mpesaTransactions
    }));
    console.log('Data saved to LocalStorage');
  },

  // Load all data from LocalStorage
  load: function() {
    const savedData = localStorage.getItem('zionGroceriesData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        this.products = parsedData.products || [];
        this.sales = parsedData.sales || [];
        this.expenses = parsedData.expenses || [];
        this.debts = parsedData.debts || [];
        this.mpesaTransactions = parsedData.mpesaTransactions || [];
        console.log('Data loaded from LocalStorage');
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
  }
};

// Initialize data on load
document.addEventListener('DOMContentLoaded', function() {
  data.load(); // Load saved data first
  updateDashboard();
  setTimeout(initializeCharts, 500);
});

// Auto-save when window closes or refreshes
window.addEventListener('beforeunload', function() {
  data.save();
});
