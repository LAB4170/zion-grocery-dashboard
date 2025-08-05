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
      if (parsedData && parsedData.products && parsedData.sales) {
        Object.assign(data, parsedData);
        console.log('Data loaded from LocalStorage');
        return true;
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

// Export data as JSON file
function exportData() {
  // First save current state to LocalStorage
  saveDataToLocalStorage();
  
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `zion-groceries-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Revoke the object URL to free memory
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Import data from JSON file
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // Validate basic structure
      if (!importedData.products || !importedData.sales) {
        throw new Error('Invalid backup file format');
      }

      if (confirm('This will overwrite current data. Continue?')) {
        Object.assign(data, importedData);
        
        // Save imported data to LocalStorage
        saveDataToLocalStorage();
        
        // Refresh to apply changes
        location.reload();
      }
    } catch (e) {
      alert('Error importing data: ' + e.message);
    } finally {
      // Reset the file input
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

// Auto-save data periodically (every 30 seconds)
setInterval(saveDataToLocalStorage, 30000);

// Also save before page unload
window.addEventListener('beforeunload', saveDataToLocalStorage);
