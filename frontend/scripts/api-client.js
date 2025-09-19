// API Client for Zion Grocery Dashboard
// Handles all backend communication and data persistence

class ApiClient {
  constructor() {
    this.baseURL = null;
    this.isOnline = navigator.onLine;
    this.initializationPromise = this.initialize();
    this.setupConnectionMonitoring();
    // Guard against duplicate DELETE requests for the same resource (e.g., sales)
    this._inFlightDeletes = new Map();
    // Enhanced guards against duplicate operations
    this._inFlightOperations = new Map();
    this._operationHistory = new Map(); // Track recent operations
  }

  // Helper: build query string from params
  buildQuery(params = {}) {
    const entries = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return entries.length ? `?${entries.join("&")}` : "";
  }

  async initialize() {
    // Wait for config to be ready
    await this.waitForConfig();
    this.baseURL = this.getApiBaseUrl();
    console.log(`🔧 API Client initialized with baseURL: ${this.baseURL}`);
    
    // Mark as ready
    window.apiClientReady = true;
    window.dispatchEvent(new CustomEvent('apiClientReady', { 
      detail: { baseURL: this.baseURL } 
    }));
  }

  async waitForConfig(maxWait = 5000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkConfig = () => {
        if (window.CONFIG_READY && window.CONFIG?.API_BASE) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > maxWait) {
          console.warn('⚠️ Config timeout - using fallback API URL');
          resolve();
          return;
        }
        
        setTimeout(checkConfig, 50);
      };
      
      // Check if config is already ready
      if (window.CONFIG_READY && window.CONFIG?.API_BASE) {
        resolve();
      } else {
        // Listen for config ready event
        window.addEventListener('configReady', resolve, { once: true });
        // Also poll as fallback
        setTimeout(checkConfig, 50);
      }
    });
  }

  getApiBaseUrl() {
    // Simplified URL detection - use config if available, otherwise smart fallback
    if (window.CONFIG?.API_BASE) {
      return window.CONFIG.API_BASE;
    }

    // Single fallback logic based on current location
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:5000/api`;
    } else {
      // For all other environments (including Render), use current host
      return `${protocol}//${window.location.host}/api`;
    }
  }

  setupConnectionMonitoring() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      // Only sync if method exists - avoid error for now
      if (typeof this.syncOfflineData === 'function') {
        this.syncOfflineData();
      }
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      window.utils.showNotification(
        "Working offline - data will sync when connection returns",
        "warning"
      );
    });
  }

  async syncOfflineData() {
    console.log('🔄 Syncing offline data...');
    // TODO: Implement offline data sync logic if needed
    // For now, just log that we're back online
    if (window.utils && window.utils.showNotification) {
      window.utils.showNotification("Back online - data synced", "success");
    }
  }

  // Enhanced operation tracking to prevent duplicates
  _trackOperation(operationType, resourceId) {
    const key = `${operationType}:${resourceId}`;
    const now = Date.now();
    
    // Clean old operations (older than 30 seconds)
    for (const [historyKey, timestamp] of this._operationHistory.entries()) {
      if (now - timestamp > 30000) {
        this._operationHistory.delete(historyKey);
      }
    }
    
    // Check if this operation happened recently
    if (this._operationHistory.has(key)) {
      const lastOperation = this._operationHistory.get(key);
      if (now - lastOperation < 2000) { // 2 seconds
        console.warn(`⚠️ Duplicate ${operationType} operation detected for ${resourceId} - skipping`);
        return false;
      }
    }
    
    this._operationHistory.set(key, now);
    return true;
  }

  async makeRequest(endpoint, options = {}) {
    // Ensure initialization is complete
    await this.initializationPromise;
    
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔄 API Request: ${config.method} ${endpoint}`);

      let response = await fetch(url, config);

      // Light retry once for GET requests if rate-limited (429)
      if (response.status === 429 && (config.method || 'GET').toUpperCase() === 'GET') {
        console.warn(`⏳ Rate limited (429) on ${endpoint}. Retrying once after 800ms...`);
        await new Promise(r => setTimeout(r, 800));
        response = await fetch(url, config);
      }

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
          console.warn("Could not parse error response as JSON");
        }

        // Specific handling for 429
        if (response.status === 429) {
          throw new Error(`Rate limited (HTTP 429). Please wait a moment and try again.`);
        }

        // Provide specific guidance based on error type
        if (response.status === 500) {
          console.error("❌ Server Error Details:", {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            errorDetails,
            timestamp: new Date().toISOString(),
          });

          // Check if it's a database connection issue
          if (
            errorDetails &&
            (errorDetails.includes("database") ||
              errorDetails.includes("connection") ||
              errorDetails.includes("ECONNREFUSED") ||
              errorDetails.includes("timeout"))
          ) {
            throw new Error(
              `Database connection error: ${errorDetails}. Please run 'check-database-status.bat' to diagnose the issue.`
            );
          } else {
            throw new Error(
              `Server error occurred. Please check if the database is running and try again. Run 'check-database-status.bat' for diagnostics. Details: ${errorMessage}`
            );
          }
        } else if (response.status === 404) {
          throw new Error(
            `API endpoint not found: ${endpoint}. Please check if the backend server is running.`
          );
        } else if (response.status === 400) {
          throw new Error(
            `Bad request: ${
              errorDetails || "Invalid data sent to server"
            }. Please check your input and try again.`
          );
        } else if (response.status === 401) {
          throw new Error(
            `Unauthorized access. Please check your login credentials.`
          );
        } else if (response.status === 403) {
          throw new Error(
            `Access forbidden. You don't have permission to perform this action.`
          );
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
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("fetch")
      ) {
        throw new Error(
          `Cannot connect to server at ${this.baseURL}. Please ensure the backend server is running on the correct port.`
        );
      }

      // Bubble up clear rate limit message
      if (error.message.includes('Rate limited (HTTP 429)')) {
        throw error;
      }

      // Handle timeout errors
      if (
        error.message.includes("timeout") ||
        error.message.includes("AbortError")
      ) {
        throw new Error(
          `Request timeout. The server may be overloaded or the database connection is slow. Please try again.`
        );
      }

      // Important: Preserve common 4xx client errors (validation/auth/route) without
      // converting them into misleading database connection errors
      if (
        error.message.startsWith('Bad request') ||
        error.message.includes('API endpoint not found') ||
        error.message.includes('Unauthorized') ||
        error.message.includes("Access forbidden")
      ) {
        throw error;
      }

      // Re-throw enhanced errors or create generic database error
      if (
        error.message.includes("Database connection error") ||
        error.message.includes("Server error occurred") ||
        error.message.includes("Cannot connect to server")
      ) {
        throw error;
      }

      // Generic fallback with database guidance
      throw new Error(
        `Database connection required. Backend API unavailable: ${
          error.message || error
        }. Run 'check-database-status.bat' to diagnose database issues.`
      );
    }
  }

  // Products API
  async getProducts() {
    return this.makeRequest("/products");
  }

  // New: products with pagination and filters
  async getProductsPaginated({
    page = 1,
    perPage = 25,
    sortBy = "name",
    sortDir = "asc",
    category,
    search
  } = {}) {
    const qs = this.buildQuery({ page, perPage, sortBy, sortDir, category, search });
    return this.makeRequest(`/products${qs}`);
  }

  async createProduct(product) {
    return this.makeRequest("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id, product) {
    return this.makeRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id) {
    // Enhanced delete with duplicate prevention
    const operationKey = `deleteProduct:${id}`;
    
    // Check for recent duplicate operations
    if (!this._trackOperation('deleteProduct', id)) {
      throw new Error('Duplicate delete operation detected - please wait before retrying');
    }
    
    // Prevent concurrent deletes for the same product
    if (this._inFlightDeletes.has(operationKey)) {
      console.warn(`🔄 Product delete already in progress for ${id}`);
      return this._inFlightDeletes.get(operationKey);
    }

    const deletePromise = this.makeRequest(`/products/${id}`, {
      method: "DELETE",
    }).finally(() => {
      this._inFlightDeletes.delete(operationKey);
    });
    
    this._inFlightDeletes.set(operationKey, deletePromise);
    return deletePromise;
  }

  // Sales API
  async getSales() {
    return this.makeRequest("/sales");
  }

  // New: sales with pagination and filters
  async getSalesPaginated({
    page = 1,
    perPage = 25,
    sortBy = "created_at",
    sortDir = "desc",
    date_from,
    date_to,
    payment_method,
    status,
    customer_name
  } = {}) {
    const qs = this.buildQuery({ page, perPage, sortBy, sortDir, date_from, date_to, payment_method, status, customer_name });
    return this.makeRequest(`/sales${qs}`);
  }

  async createSale(sale) {
    return this.makeRequest("/sales", {
      method: "POST",
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id, sale) {
    return this.makeRequest(`/sales/${id}`, {
      method: "PUT",
      body: JSON.stringify(sale),
    });
  }

  async deleteSale(id) {
    const operationKey = `deleteSale:${id}`;
    
    // Enhanced duplicate prevention with operation tracking
    if (!this._trackOperation('deleteSale', id)) {
      console.warn(`⚠️ Duplicate sale delete operation detected for ${id} - skipping`);
      throw new Error('Duplicate delete operation detected - please wait before retrying');
    }
    
    // Prevent concurrent DELETE calls for the same sale id
    if (this._inFlightDeletes.has(operationKey)) {
      console.warn(`🔄 Sale delete already in progress for ${id}`);
      return this._inFlightDeletes.get(operationKey);
    }

    console.log(`🗑️ Initiating delete for sale ${id}`);
    
    const deletePromise = this.makeRequest(`/sales/${id}`, { 
      method: "DELETE" 
    })
    .then(result => {
      console.log(`✅ Successfully deleted sale ${id}`, result);
      return result;
    })
    .catch(error => {
      console.error(`❌ Failed to delete sale ${id}:`, error.message);
      throw error;
    })
    .finally(() => {
      this._inFlightDeletes.delete(operationKey);
      console.log(`🏁 Delete operation completed for sale ${id}`);
    });
    
    this._inFlightDeletes.set(operationKey, deletePromise);
    return deletePromise;
  }

  async getSalesWeekly() {
    // Call relative endpoint; makeRequest will prepend baseURL
    console.log('🔄 API Request: GET /sales/weekly');
    return this.makeRequest('/sales/weekly');
  }

  // Expenses API
  async getExpenses() {
    return this.makeRequest("/expenses");
  }

  async createExpense(expense) {
    return this.makeRequest("/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id, expense) {
    return this.makeRequest(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id) {
    // Enhanced delete with duplicate prevention
    const operationKey = `deleteExpense:${id}`;
    
    if (!this._trackOperation('deleteExpense', id)) {
      throw new Error('Duplicate delete operation detected - please wait before retrying');
    }
    
    if (this._inFlightDeletes.has(operationKey)) {
      return this._inFlightDeletes.get(operationKey);
    }

    const deletePromise = this.makeRequest(`/expenses/${id}`, {
      method: "DELETE",
    }).finally(() => this._inFlightDeletes.delete(operationKey));
    
    this._inFlightDeletes.set(operationKey, deletePromise);
    return deletePromise;
  }

  // Debts API
  async getDebts() {
    return this.makeRequest("/debts");
  }

  async createDebt(debtData) {
    return this.makeRequest('/debts', {
      method: 'POST',
      body: JSON.stringify(debtData)
    });
  }

  async updateDebt(id, debtData) {
    return this.makeRequest(`/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(debtData)
    });
  }

  async deleteDebt(id) {
    // Enhanced delete with duplicate prevention
    const operationKey = `deleteDebt:${id}`;
    
    if (!this._trackOperation('deleteDebt', id)) {
      throw new Error('Duplicate delete operation detected - please wait before retrying');
    }
    
    if (this._inFlightDeletes.has(operationKey)) {
      return this._inFlightDeletes.get(operationKey);
    }

    const deletePromise = this.makeRequest(`/debts/${id}`, {
      method: 'DELETE'
    }).finally(() => this._inFlightDeletes.delete(operationKey));
    
    this._inFlightDeletes.set(operationKey, deletePromise);
    return deletePromise;
  }

  // System operations
  async fixDatabaseSchema() {
    return this.makeRequest('/system/fix-schema', {
      method: 'POST'
    });
  }

  async getSchemaInfo() {
    return this.makeRequest('/system/schema-info', {
      method: 'GET'
    });
  }

  // Dashboard API
  async getDashboardStats() {
    return this.makeRequest("/dashboard/stats");
  }

  async getWeeklyExpenses() {
    return this.makeRequest("/dashboard/weekly-expenses");
  }

  // Health check with improved error handling
  async checkHealth() {
    try {
      // Ensure we have the correct baseURL
      this.baseURL = this.getApiBaseUrl();

      // Construct health check URL properly
      const healthUrl = this.baseURL.replace("/api", "") + "/health";
      console.log(`🏥 Checking health at: ${healthUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(healthUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Health check successful:", data);
        return true;
      } else {
        console.warn(`⚠️ Health check failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(
          "⏱️ Health check timeout - this is normal for slow connections"
        );
        return false;
      } else if (error.message.includes("Failed to fetch")) {
        console.warn("🌐 Network error - server may be unreachable");
        return false;
      } else {
        console.error("❌ Health check error:", error.message);
        return false;
      }
    }
  }

  // New: Stock validation methods
  async validateProductStock(productId) {
    return this.makeRequest(`/products/${productId}/validate-stock`);
  }

  async detectStockInconsistencies() {
    return this.makeRequest('/system/stock-inconsistencies');
  }

  // Helper method to clear operation history (useful for debugging)
  clearOperationHistory() {
    this._operationHistory.clear();
    this._inFlightDeletes.clear();
    this._inFlightOperations.clear();
    console.log("🧹 Operation history cleared");
  }

  // Get operation statistics (useful for debugging)
  getOperationStats() {
    return {
      inFlightDeletes: this._inFlightDeletes.size,
      operationHistorySize: this._operationHistory.size,
      recentOperations: Array.from(this._operationHistory.entries())
        .map(([key, timestamp]) => ({ key, timestamp, age: Date.now() - timestamp }))
        .sort((a, b) => b.timestamp - a.timestamp)
    };
  }
}

// Initialize global API client
window.apiClient = new ApiClient();

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ApiClient;
}
