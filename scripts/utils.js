// Utility functions used across the application
window.utils = {
    formatCurrency: function(amount) {
        if (isNaN(parseFloat(amount))) return 'KSh 0.00';
        return `KSh ${parseFloat(amount).toLocaleString('en-KE', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    },

    formatDate: function(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Date formatting error:', e);
            return 'Invalid Date';
        }
    },

    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    searchTable: function(tableId, searchValue) {
        try {
            const table = document.getElementById(tableId);
            if (!table) return;
            
            const rows = table.getElementsByTagName('tr');
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                let found = false;
                
                for (let j = 0; j < cells.length; j++) {
                    if (cells[j].textContent.toLowerCase().includes(searchValue.toLowerCase())) {
                        found = true;
                        break;
                    }
                }
                
                row.style.display = found ? '' : 'none';
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    },

    showNotification: function(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.success;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => notification.style.opacity = '1', 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    },

    saveToStorage: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    getFromStorage: function(key, defaultValue = []) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage read error:', error);
            return defaultValue;
        }
    },

    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    },

    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }
};
