// Database-Only Data Manager for Zion Grocery Dashboard
// Uses PostgreSQL exclusively - no localStorage dependency

class DataManager {
    constructor() {
        this.isBackendAvailable = false;
        this.initializationPromise = this.initialize();
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    async initialize() {
        console.log('🔄 Initializing database-only data manager...');
        
        // Wait for API client to be fully initialized
        let apiClientReady = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!apiClientReady && attempts < maxAttempts) {
            if (window.apiClient && typeof window.apiClient.checkHealth === 'function') {
                apiClientReady = true;
                console.log('✅ API Client is ready');
            } else {
                console.log(`⏳ Waiting for API Client initialization... (${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
        }
        
        if (!apiClientReady) {
            console.error('❌ API Client failed to initialize after maximum attempts');
            this.showDatabaseError();
            throw new Error('API Client initialization timeout');
        }
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`🔍 Database connection attempt ${attempt}/${this.retryAttempts}...`);
                this.isBackendAvailable = await window.apiClient.checkHealth();
                
                if (this.isBackendAvailable) {
                    console.log('✅ PostgreSQL database connected successfully');
                    await this.performOneTimeMigration();
                    return;
                } else {
                    throw new Error('Backend health check returned false');
                }
            } catch (error) {
                const errorMessage = error.message || 'Unknown error';
                console.warn(`❌ Database connection attempt ${attempt}/${this.retryAttempts} failed: ${errorMessage}`);
                
                // Provide specific guidance based on error type
                if (errorMessage.includes('health check returned false')) {
                    console.warn('🔍 Backend is running but database health check failed');
                    console.warn('💡 Check: Database server status, connection string, credentials');
                } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
                    console.warn('🌐 Network connectivity issue detected');
                    console.warn('💡 Check: Server is running, firewall settings, URL configuration');
                } else if (errorMessage.includes('timeout')) {
                    console.warn('⏱️ Request timeout - server may be slow or overloaded');
                }
                
                if (attempt === this.retryAttempts) {
                    console.error('🚨 CRITICAL: Database unavailable after all retry attempts.');
                    console.error('📋 Troubleshooting steps:');
                    console.error('   1. Verify backend server is running');
                    console.error('   2. Check database server status');
                    console.error('   3. Verify network connectivity');
                    console.error('   4. Check environment configuration');
                    this.showDatabaseError();
                    throw new Error(`Database connection failed after ${this.retryAttempts} attempts: ${errorMessage}`);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    async performOneTimeMigration() {
        // One-time migration from localStorage to database (if any data exists)
        const dataTypes = ['products', 'sales', 'expenses', 'debts'];
        
        for (const type of dataTypes) {
            try {
                const localData = this.getLocalStorageData(type);
                if (localData.length > 0) {
                    console.log(`📦 Migrating ${localData.length} ${type} from localStorage to database...`);
                    
                    for (const item of localData) {
                        try {
                            await this.createData(type, item, true);
                        } catch (error) {
                            console.warn(`Failed to migrate ${type} item:`, error.message);
                        }
                    }
                    
                    // Clear localStorage after successful migration
                    localStorage.removeItem(type);
                    console.log(`✅ ${type} migration completed and localStorage cleared`);
                }
            } catch (error) {
                console.error(`Migration failed for ${type}:`, error);
            }
        }
        
        console.log('🎉 Database-only mode activated. All data operations use PostgreSQL.');
    }

    getLocalStorageData(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            return [];
        }
    }

    showDatabaseError() {
        const errorMessage = `
            🚨 DATABASE CONNECTION REQUIRED
            
            The application requires PostgreSQL database to function.
            Please ensure:
            
            1. PostgreSQL service is running
            2. Backend server is started (port 5000)
            3. Database connection is configured correctly
            
            Use 'start-safe-frontend.bat' to start with proper database setup.
        `;
        
        console.error(errorMessage);
        
        // Show user-friendly error in UI
        if (typeof window.utils?.showNotification === 'function') {
            window.utils.showNotification('Database connection required. Please restart using start-safe-frontend.bat', 'error');
        }
        
        // Create error overlay
        this.createErrorOverlay();
    }

    createErrorOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'database-error-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center; padding: 40px; max-width: 600px;">
                <h2 style="color: #ff4444; margin-bottom: 20px;">🚨 Database Connection Required</h2>
                <p style="margin-bottom: 15px;">This application requires PostgreSQL database to function properly.</p>
                <p style="margin-bottom: 15px;"><strong>Please ensure:</strong></p>
                <ul style="text-align: left; margin-bottom: 20px;">
                    <li>PostgreSQL service is running</li>
                    <li>Backend server is started (port 5000)</li>
                    <li>Database connection is configured</li>
                </ul>
                <p style="margin-bottom: 20px;"><strong>Recommended:</strong> Use <code>start-safe-frontend.bat</code> to start with proper setup.</p>
                <button onclick="location.reload()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">Retry Connection</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    async ensureConnection() {
        await this.initializationPromise;
        if (!this.isBackendAvailable) {
            throw new Error('Database connection not available');
        }
    }

    async getData(type) {
        await this.ensureConnection();
        
        try {
            const response = await window.apiClient.makeRequest(`/${type}`);
            return response.data || response;
        } catch (error) {
            console.error(`Failed to fetch ${type} from database:`, error);
            throw new Error(`Database operation failed: ${error.message}`);
        }
    }

    async createData(type, data, skipValidation = false) {
        await this.ensureConnection();
        
        // Ensure data has an ID
        if (!data.id) {
            data.id = window.utils.generateId();
        }
        
        // Add timestamps if not present (database-only mode)
        if (!data.created_at && !data.createdAt) {
            data.created_at = new Date().toISOString();
        }
        
        // Don't add duplicate timestamp fields - use created_at only
        if (data.createdAt && !data.created_at) {
            data.created_at = data.createdAt;
            delete data.createdAt;
        }
        
        // Use created_by field (not user_id) for backend compatibility
        if (!data.created_by && !data.user_id) {
            data.created_by = 'system';
        }
        
        // Remove user_id if created_by exists (avoid duplicate fields)
        if (data.created_by && data.user_id) {
            delete data.user_id;
        }
        
        try {
            console.log(`📤 Creating ${type} in PostgreSQL database:`, data);
            
            const response = await window.apiClient.makeRequest(`/${type}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            console.log(`✅ Successfully created ${type} in database:`, response);
            
            // Broadcast change to other clients
            if (window.socketIOSync) {
                window.socketIOSync.broadcastDataChange(type, { action: 'create', data: response });
            }
            
            // Return the data from response, handling both formats
            return response.data || response;
        } catch (error) {
            console.error(`❌ Failed to create ${type} in database:`, error);
            
            // Enhanced error logging for debugging
            if (error.message.includes('400')) {
                console.error('Validation error - check field names and data types');
                console.error('Sent data:', JSON.stringify(data, null, 2));
            }
            
            throw new Error(`Database create operation failed: ${error.message}`);
        }
    }

    async updateData(type, id, data) {
        await this.ensureConnection();
        
        // Add update timestamp
        data.updated_at = new Date().toISOString();
        
        try {
            const response = await window.apiClient.makeRequest(`/${type}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            console.log(`✅ Updated ${type} in database:`, id);
            return response.data || response;
        } catch (error) {
            console.error(`Failed to update ${type} in database:`, error);
            throw new Error(`Database update operation failed: ${error.message}`);
        }
    }

    async deleteData(type, id) {
        await this.ensureConnection();
        
        try {
            await window.apiClient.makeRequest(`/${type}/${id}`, {
                method: 'DELETE'
            });
            
            console.log(`✅ Deleted ${type} from database:`, id);
            return true;
        } catch (error) {
            console.error(`Failed to delete ${type} from database:`, error);
            throw new Error(`Database delete operation failed: ${error.message}`);
        }
    }

    // Convenience methods for specific data types
    async getProducts() { return this.getData('products'); }
    async createProduct(product) { return this.createData('products', product); }
    async updateProduct(id, product) { return this.updateData('products', id, product); }
    async deleteProduct(id) { return this.deleteData('products', id); }

    async getSales() { return this.getData('sales'); }
    async createSale(sale) { return this.createData('sales', sale); }
    async updateSale(id, sale) { return this.updateData('sales', id, sale); }
    async deleteSale(id) { return this.deleteData('sales', id); }

    async getExpenses() { return this.getData('expenses'); }
    async createExpense(expense) { return this.createData('expenses', expense); }
    async updateExpense(id, expense) { return this.updateData('expenses', id, expense); }
    async deleteExpense(id) { return this.deleteData('expenses', id); }

    async getDebts() { return this.getData('debts'); }
    async createDebt(debt) { return this.createData('debts', debt); }
    async updateDebt(id, debt) { return this.updateData('debts', id, debt); }
    async deleteDebt(id) { return this.deleteData('debts', id); }

    getConnectionStatus() {
        return {
            backend: this.isBackendAvailable,
            storage: 'PostgreSQL Database Only',
            localStorage: 'Disabled'
        };
    }

    // Method to check if database is ready
    isDatabaseReady() {
        return this.isBackendAvailable;
    }
}

// Initialize global data manager
window.dataManager = new DataManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
