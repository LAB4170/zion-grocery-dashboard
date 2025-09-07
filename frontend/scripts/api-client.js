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

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`🔄 API Request: ${config.method} ${endpoint}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                let errorDetails = null;
                
                // Try to get more specific error info from response
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorDetails = errorData.message;
                        errorMessage += ` - ${errorData.message}`;
                    }
                    if (errorData.error) {
                        errorMessage += ` (${errorData.error})`;
                    }
                } catch (parseError) {
                    // Response body isn't JSON, use status text
                    console.warn('Could not parse error response as JSON');
                }
                
                // Provide specific guidance based on error type
                if (response.status === 500) {
                    console.error('❌ Server Error Details:', {
                        endpoint,
                        status: response.status,
                        statusText: response.statusText,
                        errorDetails,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Check if it's a database connection issue
                    if (errorDetails && (
                        errorDetails.includes('database') || 
                        errorDetails.includes('connection') ||
                        errorDetails.includes('ECONNREFUSED') ||
                        errorDetails.includes('timeout')
                    )) {
                        throw new Error(`Database connection error: ${errorDetails}. Please run 'check-database-status.bat' to diagnose the issue.`);
                    } else {
                        throw new Error(`Server error occurred. Please check if the database is running and try again. Run 'check-database-status.bat' for diagnostics. Details: ${errorMessage}`);
                    }
                } else if (response.status === 404) {
                    throw new Error(`API endpoint not found: ${endpoint}. Please check if the backend server is running.`);
                } else if (response.status === 400) {
                    throw new Error(`Bad request: ${errorDetails || 'Invalid data sent to server'}. Please check your input and try again.`);
                } else if (response.status === 401) {
                    throw new Error(`Unauthorized access. Please check your login credentials.`);
                } else if (response.status === 403) {
                    throw new Error(`Access forbidden. You don't have permission to perform this action.`);
                } else {
                    throw new Error(errorMessage);
                }
            }
            
            const data = await response.json();
            console.log(`✅ API Request successful: ${endpoint}`, data);
            return data;
        } catch (error) {
            console.error(`❌ API Request failed: ${endpoint}`, error);
            
            // Handle network errors (server not running)
            if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
                throw new Error(`Cannot connect to server at ${this.baseURL}. Please ensure the backend server is running on the correct port.`);
            }
            
            // Handle timeout errors
            if (error.message.includes('timeout') || error.message.includes('AbortError')) {
                throw new Error(`Request timeout. The server may be overloaded or the database connection is slow. Please try again.`);
            }
            
            // Re-throw enhanced errors or create generic database error
            if (error.message.includes('Database connection error') || 
                error.message.includes('Server error occurred') ||
                error.message.includes('Cannot connect to server')) {
                throw error;
            }
            
            // Generic fallback with database guidance
            throw new Error(`Database connection required. Backend API unavailable: ${error.message || error}. Run 'check-database-status.bat' to diagnose database issues.`);
        }
    }

    // Products API
    async getProducts() {
        return this.makeRequest('/products');
    }

    async createProduct(product) {
        return this.makeRequest('/products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    }

    async updateProduct(id, product) {
        return this.makeRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    }

    async deleteProduct(id) {
        return this.makeRequest(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Sales API
    async getSales() {
        return this.makeRequest('/sales');
    }

    async createSale(sale) {
        return this.makeRequest('/sales', {
            method: 'POST',
            body: JSON.stringify(sale)
        });
    }

    async updateSale(id, sale) {
        return this.makeRequest(`/sales/${id}`, {
            method: 'PUT',
            body: JSON.stringify(sale)
        });
    }

    async deleteSale(id) {
        return this.makeRequest(`/sales/${id}`, {
            method: 'DELETE'
        });
    }

    // Expenses API
    async getExpenses() {
        return this.makeRequest('/expenses');
    }

    async createExpense(expense) {
        return this.makeRequest('/expenses', {
            method: 'POST',
            body: JSON.stringify(expense)
        });
    }

    async updateExpense(id, expense) {
        return this.makeRequest(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(expense)
        });
    }

    async deleteExpense(id) {
        return this.makeRequest(`/expenses/${id}`, {
            method: 'DELETE'
        });
    }

    // Debts API
    async getDebts() {
        return this.makeRequest('/debts');
    }

    async createDebt(debt) {
        return this.makeRequest('/debts', {
            method: 'POST',
            body: JSON.stringify(debt)
        });
    }

    async updateDebt(id, debt) {
        return this.makeRequest(`/debts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(debt)
        });
    }

    async deleteDebt(id) {
        return this.makeRequest(`/debts/${id}`, {
            method: 'DELETE'
        });
    }

    // Dashboard API
    async getDashboardStats() {
        return this.makeRequest('/dashboard/stats');
    }

    // Health check with improved error handling
    async checkHealth() {
        try {
            // Ensure we have the correct baseURL
            this.baseURL = this.getApiBaseUrl();
            
            // Construct health check URL properly
            const healthUrl = this.baseURL.replace('/api', '') + '/health';
            console.log(`🏥 Checking health at: ${healthUrl}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Health check successful:', data);
                return true;
            } else {
                console.warn(`⚠️ Health check failed with status: ${response.status}`);
                return false;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('⏱️ Health check timeout - this is normal for slow connections');
                return false;
            } else if (error.message.includes('Failed to fetch')) {
                console.warn('🌐 Network error - server may be unreachable');
                return false;
            } else {
                console.error('❌ Health check error:', error.message);
                return false;
            }
        }
    }
}

// Initialize global API client
window.apiClient = new ApiClient();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
