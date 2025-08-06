// Utility functions with LocalStorage auto-save

// Save all data to LocalStorage
function saveDataToLocalStorage() {
  try {
    localStorage.setItem('zionGroceriesData', JSON.stringify(data));
    console.log('Data auto-saved to LocalStorage');
  } catch (e) {
    console.error('Error saving to LocalStorage:', e);
    // Handle quota exceeded or other storage errors
    if (e.name === 'QuotaExceededError') {
      alert('Warning: Your browser storage is full. Some data may not be saved.');
    }
  }
}

// Load data from LocalStorage
function loadDataFromLocalStorage() {
  const savedData = localStorage.getItem('zionGroceriesData');
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      
      // Validate the loaded data structure
      if (parsedData && Array.isArray(parsedData.products) && Array.isArray(parsedData.sales)) {
        Object.assign(data, parsedData);
        console.log('Data loaded from LocalStorage');
        return true;
      } else {
        console.error('Invalid data structure loaded from LocalStorage');
      }
    } catch (e) {
      console.error('Error loading from LocalStorage:', e);
    }
  }
  return false;
}

// Initialize data with LocalStorage auto-load
document.addEventListener('DOMContentLoaded', function() {
  if (loadDataFromLocalStorage()) {
    // Data loaded successfully, render all tables
    renderProductsTable();
    renderSalesTable();
    renderDebtsTable();
    renderMpesaTable();
    updateDashboard();
  }
});

// Auto-save data periodically (every 30 seconds)
setInterval(saveDataToLocalStorage, 30000);

// Also save before page unload
window.addEventListener('beforeunload', saveDataToLocalStorage);
