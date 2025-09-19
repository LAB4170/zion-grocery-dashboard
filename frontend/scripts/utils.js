// Utility functions used across the application
window.utils = {
    formatCurrency: function(amount) {
        if (isNaN(parseFloat(amount))) return 'KSh 0.00';
        return `KSh ${parseFloat(amount).toLocaleString('en-KE', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    },

    formatDate: function(dateInput) {
        try {
            if (!dateInput) return 'Invalid Date';
            let d = null;
            if (dateInput instanceof Date) {
                d = dateInput;
            } else if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                // Treat date-only strings as Nairobi local midnight to avoid UTC shifting
                d = new Date(`${dateInput}T00:00:00+03:00`);
            } else {
                d = new Date(dateInput);
            }
            if (isNaN(d.getTime())) return 'Invalid Date';
            return new Intl.DateTimeFormat('en-KE', {
                timeZone: 'Africa/Nairobi',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(d);
        } catch (e) {
            console.error('Date formatting error:', e);
            return 'Invalid Date';
        }
    },

    generateId: function() {
        // Generate a proper UUID v4 format for PostgreSQL compatibility
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
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

    // Database-only mode - localStorage functions removed
    // All data operations should use window.dataManager instead
    
    saveToStorage: function(key, data) {
        console.warn('⚠️ saveToStorage is deprecated. Use window.dataManager instead.');
        throw new Error('localStorage operations disabled. Use window.dataManager for database operations.');
    },

    getFromStorage: function(key, defaultValue = []) {
        console.warn('⚠️ getFromStorage is deprecated. Use window.dataManager instead.');
        throw new Error('localStorage operations disabled. Use window.dataManager for database operations.');
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
