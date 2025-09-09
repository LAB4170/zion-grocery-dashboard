// data-manager.js - Fixed to use correct API client methods
class DataManager {
  constructor() {
    // Wait for API client to be ready
    this.waitForApiClient();
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
    } else {
      console.log("✅ API Client ready");
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

      console.log(`📤 Creating ${table} in PostgreSQL database:`, data);

      // Use the specific method for each table type
      let result;
      switch (table) {
        case "products":
          result = await window.apiClient.createProduct(data);
          break;
        case "sales":
          result = await window.apiClient.createSale(data);
          break;
        case "expenses":
          result = await window.apiClient.createExpense(data);
          break;
        case "debts":
          result = await window.apiClient.createDebt(data);
          break;
        default:
          // Fallback to makeRequest for other tables
          result = await window.apiClient.makeRequest(`/${table}`, {
            method: "POST",
            body: JSON.stringify(data),
          });
      }

      console.log(`✅ Successfully created ${table}:`, result);
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

      console.log(`📝 Updating ${table} with ID ${id}:`, data);

      // Use the specific method for each table type
      let result;
      switch (table) {
        case "products":
          result = await window.apiClient.updateProduct(id, data);
          break;
        case "sales":
          result = await window.apiClient.updateSale(id, data);
          break;
        case "expenses":
          result = await window.apiClient.updateExpense(id, data);
          break;
        case "debts":
          result = await window.apiClient.updateDebt(id, data);
          break;
        default:
          // Fallback to makeRequest for other tables
          result = await window.apiClient.makeRequest(`/${table}/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
      }

      console.log(`✅ Successfully updated ${table}:`, result);
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
}

// Initialize global data manager
window.dataManager = new DataManager();
