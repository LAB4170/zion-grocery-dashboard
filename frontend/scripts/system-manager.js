/**
 * System Management Utility
 * Handles database schema fixes and system maintenance via frontend
 */

class SystemManager {
  constructor() {
    this.isFixing = false;
  }

  // Fix database schema via API
  async fixDatabaseSchema() {
    if (this.isFixing) {
      window.utils.showNotification("Schema fix already in progress", "warning");
      return;
    }

    try {
      this.isFixing = true;
      window.utils.showNotification("Fixing database schema...", "info");

      const result = await window.apiClient.fixDatabaseSchema();
      
      if (result.success) {
        window.utils.showNotification(result.message, "success");
        console.log("✅ Schema fix completed:", result);
        
        // Refresh data after schema fix
        if (typeof loadProductsData === 'function') {
          await loadProductsData();
        }
        
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("❌ Schema fix failed:", error);
      window.utils.showNotification(`Schema fix failed: ${error.message}`, "error");
      throw error;
    } finally {
      this.isFixing = false;
    }
  }

  // Get database schema information
  async getSchemaInfo() {
    try {
      const result = await window.apiClient.getSchemaInfo();
      
      if (result.success) {
        console.log("📋 Database schema info:", result.schema);
        return result.schema;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("❌ Failed to get schema info:", error);
      window.utils.showNotification(`Failed to get schema info: ${error.message}`, "error");
      throw error;
    }
  }

  // Check if schema fix is needed
  async checkSchemaHealth() {
    try {
      const schema = await this.getSchemaInfo();
      const productsColumns = schema.products?.map(col => col.column_name) || [];
      
      const hasStock = productsColumns.includes('stock');
      const hasStockQuantity = productsColumns.includes('stock_quantity');
      
      if (hasStock && !hasStockQuantity) {
        return {
          needsFix: true,
          issue: "Products table uses 'stock' instead of 'stock_quantity'",
          columns: productsColumns
        };
      }
      
      return {
        needsFix: false,
        message: "Database schema is correct",
        columns: productsColumns
      };
    } catch (error) {
      return {
        needsFix: null,
        error: error.message
      };
    }
  }

  // Auto-fix schema if needed (called during app initialization)
  async autoFixSchemaIfNeeded() {
    try {
      const health = await this.checkSchemaHealth();
      
      if (health.needsFix) {
        console.log("🔧 Auto-fixing database schema...");
        await this.fixDatabaseSchema();
        return true;
      } else if (health.needsFix === false) {
        console.log("✅ Database schema is healthy");
        return false;
      } else {
        console.warn("⚠️ Could not check schema health:", health.error);
        return null;
      }
    } catch (error) {
      console.error("❌ Auto-fix failed:", error);
      return false;
    }
  }
}

// Create global instance
window.SystemManager = new SystemManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SystemManager;
}
