// Export data as JSON file
function exportData() {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `zion-groceries-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
        data.save();
        location.reload(); // Refresh to apply changes
      }
    } catch (e) {
      alert('Error importing data: ' + e.message);
    }
  };
  reader.readAsText(file);
}
