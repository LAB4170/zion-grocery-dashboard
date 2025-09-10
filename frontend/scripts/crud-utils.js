/**
 * Simplified CRUD Utilities for Zion Grocery Dashboard
 * Eliminates complexity and provides consistent operations
 */

class SimpleCRUD {
  constructor(entityType, globalArrayName, validationRules = {}) {
    this.entityType = entityType;
    this.globalArrayName = globalArrayName;
    this.validationRules = validationRules;
  }

  // Simplified validation with automatic error display
  validate(data) {
    for (const [field, rules] of Object.entries(this.validationRules)) {
      const value = data[field];
      
      if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        window.utils.showNotification(rules.message || `${field} is required`, "error");
        return false;
      }
      
      if (rules.type === 'number' && (isNaN(value) || value < 0)) {
        window.utils.showNotification(rules.message || `${field} must be a valid positive number`, "error");
        return false;
      }
      
      if (rules.min && value < rules.min) {
        window.utils.showNotification(rules.message || `${field} must be at least ${rules.min}`, "error");
        return false;
      }
    }
    return true;
  }

  // Get form data automatically
  getFormData(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      // Auto-convert numbers
      if (form.querySelector(`[name="${key}"]`)?.type === 'number') {
        data[key] = value ? parseFloat(value) : 0;
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }

  // Simplified create operation
  async create(data) {
    try {
      if (!this.validate(data)) return null;

      // Add metadata
      const entityData = {
        id: window.utils.generateId(),
        ...data,
        created_at: new Date().toISOString()
      };

      // Save to database
      const saved = await window.dataManager.createData(this.entityType, entityData);
      
      // Update global array
      if (!window[this.globalArrayName]) window[this.globalArrayName] = [];
      window[this.globalArrayName].push(saved.data || saved);
      
      window.utils.showNotification(`${this.entityType} created successfully!`);
      return saved.data || saved;
    } catch (error) {
      window.utils.showNotification(`Failed to create ${this.entityType}: ${error.message}`, "error");
      return null;
    }
  }

  // Simplified update operation
  async update(id, data) {
    try {
      if (!this.validate(data)) return null;

      // Add metadata
      const entityData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      // Save to database
      const saved = await window.dataManager.updateData(this.entityType, id, entityData);
      
      // Update global array
      const array = window[this.globalArrayName] || [];
      const index = array.findIndex(item => item.id === id);
      if (index !== -1) {
        array[index] = saved.data || saved;
      }
      
      window.utils.showNotification(`${this.entityType} updated successfully!`);
      return saved.data || saved;
    } catch (error) {
      window.utils.showNotification(`Failed to update ${this.entityType}: ${error.message}`, "error");
      return null;
    }
  }

  // Simplified delete operation
  async delete(id) {
    try {
      await window.dataManager.deleteData(this.entityType, id);
      
      // Update global array
      const array = window[this.globalArrayName] || [];
      const index = array.findIndex(item => item.id === id);
      if (index !== -1) {
        array.splice(index, 1);
      }
      
      window.utils.showNotification(`${this.entityType} deleted successfully!`);
      return true;
    } catch (error) {
      window.utils.showNotification(`Failed to delete ${this.entityType}: ${error.message}`, "error");
      return false;
    }
  }

  // Find entity by ID
  findById(id) {
    const array = window[this.globalArrayName] || [];
    return array.find(item => item.id === id);
  }

  // Get all entities
  getAll() {
    return window[this.globalArrayName] || [];
  }
}

// Pre-configured CRUD instances for each entity type
window.ProductCRUD = new SimpleCRUD('products', 'products', {
  name: { required: true, message: "Product name is required" },
  category: { required: true, message: "Please select a category" },
  price: { required: true, type: 'number', min: 0, message: "Please enter a valid price" },
  stockQuantity: { type: 'number', min: 0, message: "Stock quantity cannot be negative" }
});

window.SaleCRUD = new SimpleCRUD('sales', 'sales', {
  productId: { required: true, message: "Please select a product" },
  quantity: { required: true, type: 'number', min: 1, message: "Please enter a valid quantity" },
  paymentMethod: { required: true, message: "Please select a payment method" }
});

window.ExpenseCRUD = new SimpleCRUD('expenses', 'expenses', {
  description: { required: true, message: "Expense description is required" },
  amount: { required: true, type: 'number', min: 0, message: "Please enter a valid amount" },
  category: { required: true, message: "Please select a category" }
});

window.DebtCRUD = new SimpleCRUD('debts', 'debts', {
  customerName: { required: true, message: "Customer name is required" },
  customerPhone: { required: true, message: "Customer phone is required" },
  amount: { required: true, type: 'number', min: 0, message: "Please enter a valid amount" }
});

// Export the SimpleCRUD class for custom instances
window.SimpleCRUD = SimpleCRUD;
