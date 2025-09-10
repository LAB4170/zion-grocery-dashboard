// data-manager.js - Enhanced with proper initialization and backend detection
class DataManager {
  constructor() {
    this.isBackendAvailable = false;
    this.initializationPromise = this.initialize();
    
    // Field mappings for frontend (camelCase) to backend (snake_case) conversion
    this.fieldMappings = {
      products: {
        // Frontend -> Backend
        stock: 'stock_quantity',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      sales: {
        // Frontend -> Backend
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paymentMethod: 'payment_method',
        productId: 'product_id',
        productName: 'product_name',
        unitPrice: 'unit_price',
        customerName: 'customer_name',
        customerPhone: 'customer_phone',
        mpesaCode: 'mpesa_code',
        createdBy: 'created_by'
      },
      expenses: {
        // Frontend -> Backend
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        expenseDate: 'expense_date',
        receiptNumber: 'receipt_number',
        createdBy: 'created_by',
        approvedBy: 'approved_by',
        approvedAt: 'approved_at'
      },
      debts: {
        // Frontend -> Backend
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        customerName: 'customer_name',
        customerPhone: 'customer_phone',
        amountPaid: 'amount_paid',
        saleId: 'sale_id',
        dueDate: 'due_date',
        createdBy: 'created_by'
      }
    };

    // Reverse mappings for backend to frontend conversion
    this.reverseMappings = {};
    Object.keys(this.fieldMappings).forEach(table => {
      this.reverseMappings[table] = {};
      Object.entries(this.fieldMappings[table]).forEach(([frontend, backend]) => {
        this.reverseMappings[table][backend] = frontend;
      });
    });
  }

  async initialize() {
    console.log("🔄 Initializing DataManager...");
    
    // Wait for API client to be ready
    await this.waitForApiClient();
    
    // Test backend connection
    await this.testBackendConnection();
    
    console.log(`✅ DataManager initialized. Backend available: ${this.isBackendAvailable}`);
    return this.isBackendAvailable;
  }

  async waitForApiClient() {
    // Wait up to 5 seconds for apiClient to be available
    let attempts = 0;
    const maxAttempts = 50;

    while (!window.apiClient && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.apiClient) {
      console.error("❌ API Client not available after waiting");
      throw new Error("API Client not available");
    } else {
      console.log("✅ API Client ready");
    }
  }

  async testBackendConnection() {
    try {
      if (!window.apiClient) {
        throw new Error("API Client not available");
      }

      // Test backend health endpoint
      console.log("🔍 Testing backend connection...");
      await window.apiClient.checkHealth();
      
      this.isBackendAvailable = true;
      console.log("✅ Backend connection successful");
    } catch (error) {
      console.error("❌ Backend connection failed:", error.message);
      this.isBackendAvailable = false;
      
      // Provide specific troubleshooting guidance
      if (error.message.includes("fetch")) {
        console.error("💡 Backend server may not be running on http://localhost:5000");
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("💡 PostgreSQL database connection failed");
      }
    }
  }

  async getData(table) {
    try {
      if (!window.apiClient) {
        throw new Error("API Client not available");
      }

      console.log(`📥 Fetching ${table} from PostgreSQL database`);

      // Use the specific method for each table type
      let result;
      switch (table) {
        case "products":
          result = await window.apiClient.getProducts();
          break;
        case "sales":
          result = await window.apiClient.getSales();
          break;
        case "expenses":
          result = await window.apiClient.getExpenses();
          break;
        case "debts":
          result = await window.apiClient.getDebts();
          break;
        default:
          // Fallback to makeRequest for other tables
          result = await window.apiClient.makeRequest(`/${table}`);
      }

      console.log(`✅ Successfully fetched ${table}:`, result);
      
      // Transform result to frontend format if it contains data
      if (result && result.data) {
        result.data = this.transformToFrontend(table, result.data);
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to fetch ${table} from database:`, error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  async createData(table, data) {
    try {
      if (!window.apiClient) {
        throw new Error("API Client not available");
      }

      // Transform frontend data to backend format
      const backendData = this.transformToBackend(table, data);
      console.log(`📤 Creating ${table} in PostgreSQL database:`, backendData);

      // Use the specific method for each table type
      let result;
      switch (table) {
        case "products":
          result = await window.apiClient.createProduct(backendData);
          break;
        case "sales":
          result = await window.apiClient.createSale(backendData);
          break;
        case "expenses":
          result = await window.apiClient.createExpense(backendData);
          break;
        case "debts":
          result = await window.apiClient.createDebt(backendData);
          break;
        default:
          // Fallback to makeRequest for other tables
          result = await window.apiClient.makeRequest(`/${table}`, {
            method: "POST",
            body: JSON.stringify(backendData),
          });
      }

      console.log(`✅ Successfully created ${table}:`, result);
      
      // Transform result back to frontend format if it contains data
      if (result && result.data) {
        result.data = this.transformToFrontend(table, result.data);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to create ${table} in database:`, error);
      throw new Error(`Database create operation failed: ${error.message}`);
    }
  }

  async updateData(table, id, data) {
    try {
      if (!window.apiClient) {
        throw new Error("API Client not available");
      }

      // Transform frontend data to backend format
      const backendData = this.transformToBackend(table, data);
      console.log(`📝 Updating ${table} with ID ${id}:`, backendData);

      // Use the specific method for each table type
      let result;
      switch (table) {
        case "products":
          result = await window.apiClient.updateProduct(id, backendData);
          break;
        case "sales":
          result = await window.apiClient.updateSale(id, backendData);
          break;
        case "expenses":
          result = await window.apiClient.updateExpense(id, backendData);
          break;
        case "debts":
          result = await window.apiClient.updateDebt(id, backendData);
          break;
        default:
          // Fallback to makeRequest for other tables
          result = await window.apiClient.makeRequest(`/${table}/${id}`, {
            method: "PUT",
            body: JSON.stringify(backendData),
          });
      }

      console.log(`✅ Successfully updated ${table}:`, result);
      
      // Transform result back to frontend format if it contains data
      if (result && result.data) {
        result.data = this.transformToFrontend(table, result.data);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to update ${table}:`, error);
      throw new Error(`Database update operation failed: ${error.message}`);
    }
  }

  async deleteData(table, id) {
    try {
      if (!window.apiClient) {
        throw new Error("API Client not available");
      }

      console.log(`🗑️ Deleting ${table} with ID ${id}`);

      // Use the specific method for each table type
      let result;
      switch (table) {
        case "products":
          result = await window.apiClient.deleteProduct(id);
          break;
        case "sales":
          result = await window.apiClient.deleteSale(id);
          break;
        case "expenses":
          result = await window.apiClient.deleteExpense(id);
          break;
        case "debts":
          result = await window.apiClient.deleteDebt(id);
          break;
        default:
          // Fallback to makeRequest for other tables
          result = await window.apiClient.makeRequest(`/${table}/${id}`, {
            method: "DELETE",
          });
      }

      console.log(`✅ Successfully deleted ${table} with ID ${id}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to delete ${table}:`, error);
      throw new Error(`Database delete operation failed: ${error.message}`);
    }
  }

  // Transform frontend data to backend format
  transformToBackend(table, data) {
    if (!this.fieldMappings[table] || !data) return data;
    
    const transformed = { ...data };
    const mappings = this.fieldMappings[table];
    
    Object.entries(mappings).forEach(([frontendField, backendField]) => {
      if (transformed.hasOwnProperty(frontendField)) {
        transformed[backendField] = transformed[frontendField];
        delete transformed[frontendField];
      }
    });
    
    // Add default values for required backend fields
    if (table === 'sales' && !transformed.created_by) {
      transformed.created_by = 'system';
    }
    if (table === 'expenses' && !transformed.created_by) {
      transformed.created_by = 'system';
    }
    if (table === 'debts' && !transformed.created_by) {
      transformed.created_by = 'system';
    }
    
    console.log(`🔄 Transformed ${table} data for backend:`, { original: data, transformed });
    return transformed;
  }

  // Transform backend data to frontend format
  transformToFrontend(table, data) {
    if (!this.reverseMappings[table] || !data) return data;
    
    const transformed = { ...data };
    const mappings = this.reverseMappings[table];
    
    Object.entries(mappings).forEach(([backendField, frontendField]) => {
      if (transformed.hasOwnProperty(backendField)) {
        transformed[frontendField] = transformed[backendField];
        delete transformed[backendField];
      }
    });
    
    return transformed;
  }

  // Convenience methods for dashboard
  async getSales() {
    return this.getData("sales");
  }

  async getProducts() {
    return this.getData("products");
  }

  async getExpenses() {
    return this.getData("expenses");
  }

  async getDebts() {
    return this.getData("debts");
  }
}

// Initialize global data manager
window.dataManager = new DataManager();
