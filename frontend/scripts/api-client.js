// API Client for Zion Grocery Dashboard
// Handles all backend communication and data persistence

class ApiClient {
    constructor() {
        // Add fallback URL to prevent undefined baseURL
        this.baseURL = this.getApiBaseUrl();
        this.isOnline = navigator.onLine;
        this.setupConnectionMonitoring();
        console.log(`🔧 API Client initialized with baseURL: ${this.baseURL}`);
    }

    getApiBaseUrl() {
        // Try to get from config first, with fallback
        if (window.CONFIG?.API_BASE) {
            return window.CONFIG.API_BASE;
        }
        
        // Fallback based on current location
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            return 'http://localhost:5000/api';
        } else if (window.location.hostname.includes('onrender.com')) {
            return 'https://zion-grocery-dashboard-1.onrender.com/api';
        } else {
            return `${window.location.protocol}//${window.location.host}/api`;
        }
    }

    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            window.utils.showNotification('Working offline - data will sync when connection returns', 'warning');
        });
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Request successful: ${endpoint}`, data);
            return data;
        } catch (error) {
            console.error(`❌ API Request failed: ${endpoint}`, error);
            
            // For database-only mode, don't fallback to localStorage
            // Instead, throw the error to be handled by the calling code
            throw new Error(`Database connection required. Backend API unavailable: ${error.message}`);
        }
    }

    handleOfflineRequest(endpoint, options) {
        // Removed this method as it's no longer needed
    }

    async syncOfflineData() {
        // Removed this method as it's no longer needed
    }

    // Products API
    async getProducts() {
        return this.request('/products');
    }

    async createProduct(product) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    }

    async updateProduct(id, product) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Sales API
    async getSales() {
        return this.request('/sales');
    }

    async createSale(sale) {
        return this.request('/sales', {
            method: 'POST',
            body: JSON.stringify(sale)
        });
    }

    async updateSale(id, sale) {
        return this.request(`/sales/${id}`, {
            method: 'PUT',
            body: JSON.stringify(sale)
        });
    }

    async deleteSale(id) {
        return this.request(`/sales/${id}`, {
            method: 'DELETE'
        });
    }

    // Expenses API
    async getExpenses() {
        return this.request('/expenses');
    }

    async createExpense(expense) {
        return this.request('/expenses', {
            method: 'POST',
            body: JSON.stringify(expense)
        });
    }

    async updateExpense(id, expense) {
        return this.request(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(expense)
        });
    }

    async deleteExpense(id) {
        return this.request(`/expenses/${id}`, {
            method: 'DELETE'
        });
    }

    // Debts API
    async getDebts() {
        return this.request('/debts');
    }

    async createDebt(debt) {
        return this.request('/debts', {
            method: 'POST',
            body: JSON.stringify(debt)
        });
    }

    async updateDebt(id, debt) {
        return this.request(`/debts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(debt)
        });
    }

    async deleteDebt(id) {
        return this.request(`/debts/${id}`, {
            method: 'DELETE'
        });
    }

    // Dashboard API
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }

    // Health check with improved error handling
    async checkHealth() {
        try {
            // Ensure we have the correct baseURL
            this.baseURL = this.getApiBaseUrl();
            
            // Construct health check URL properly
            const healthUrl = this.baseURL.replace('/api', '') + '/health';
            console.log(`🏥 Checking health at: ${healthUrl}`);
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Health check successful:', data);
                return true;
            } else {
                console.warn(`⚠️ Health check failed with status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Health check error:', error.message);
            return false;
        }
    }
}

// Initialize global API client
window.apiClient = new ApiClient();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
