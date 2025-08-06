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

// Dashboard initialization with retry logic
function initializeDashboard() {
  // Check if dashboard container exists and has content
  const dashboardContainer = document.getElementById('dashboard-container');
  
  if (dashboardContainer && dashboardContainer.innerHTML.trim() !== '') {
    // Dashboard is loaded, proceed with initialization
    console.log('Dashboard content loaded, initializing...');
    
    // Load data first
    data.load();
    
    // Update dashboard stats
    if (typeof updateDashboard === 'function') {
      updateDashboard();
    } else {
      console.error('updateDashboard function not found');
    }
    
    // Initialize charts with slight delay to ensure DOM is ready
    setTimeout(() => {
      if (typeof initializeCharts === 'function') {
        initializeCharts();
      } else {
        console.error('initializeCharts function not found');
      }
    }, 100);
  } else {
    // If not loaded yet, wait and try again (max 10 attempts)
    const maxAttempts = 10;
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      if (dashboardContainer && dashboardContainer.innerHTML.trim() !== '') {
        clearInterval(checkInterval);
        initializeDashboard();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('Dashboard failed to load after multiple attempts');
      }
    }, 200);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Start loading the dashboard
  initializeDashboard();
  
  // Auto-save when window closes or refreshes
  window.addEventListener('beforeunload', function() {
    data.save();
  });
});

// Make data globally available
window.appData = data;
