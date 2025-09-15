// Product management functions - FIXED VERSION WITH PAGINATION

// Use global products variable for consistency - no redeclaration needed
// Access window.products directly to avoid conflicts

// Simple fallback for notifications if utils not loaded yet
function showNotification(message, type = 'success') {
  if (window.utils && window.utils.showNotification) {
    window.utils.showNotification(message, type);
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message);
  }
}

// Initialize pagination manager for products
let productsPaginationManager;

// Initialize products module
async function initializeProducts() {
  try {
    console.log('🚀 Initializing products module...');
    
    // Auto-fix database schema if needed
    if (window.SystemManager) {
      await window.SystemManager.autoFixSchemaIfNeeded();
    }
    
    await loadProductsData();
    populateProductDropdowns();
    console.log('✅ Products module initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize products module:', error);
    showNotification('Failed to initialize products module', 'error');
  }
}

function initializeProductsPagination() {
  console.log('Initializing products pagination...');
  
  // Check if container exists before initializing
  const container = document.getElementById('products');
  if (!container) {
    console.warn('Products container not found, retrying in 100ms');
    setTimeout(initializeProductsPagination, 100);
    return;
  }
  
  if (typeof window.createPaginationManager === 'function') {
    productsPaginationManager = window.createPaginationManager(
      'products', // Container ID - matches HTML
      'products', // Data key
      renderProductsTable // Render function
    );
    productsPaginationManager.init();
    console.log('Products pagination manager created and initialized');
    
    // Force immediate data update with current products
    setTimeout(() => {
      if (productsPaginationManager && window.products) {
        productsPaginationManager.updateData(window.products);
        console.log('Products pagination data updated with', window.products.length, 'items');
      }
    }, 50);
  } else {
    console.error('createPaginationManager function not available');
  }
}

async function addProduct(event) {
  event.preventDefault();

  try {
    // Get form data automatically
    const productData = {
      name: document.getElementById("productName").value.trim(),
      category: document.getElementById("productCategory").value,
      price: parseFloat(document.getElementById("productPrice").value) || 0,
      stockQuantity: parseInt(document.getElementById("productStock").value) || 0
    };

    const modal = document.getElementById("productModal");
    const isEditing = modal && modal.hasAttribute("data-editing");

    if (isEditing) {
      // Update existing product
      const productId = modal.getAttribute("data-editing");
      const result = await window.dataManager.updateData("products", productId, productData);
      
      if (result) {
        closeModal("productModal");
        loadProductsData();
        populateProductSelect();
      }
    } else {
      // Create new product
      const result = await window.dataManager.createData("products", productData);
      
      if (result) {
        closeModal("productModal");
        loadProductsData();
        populateProductSelect();
      }
    }
  } catch (error) {
    console.error("Product operation failed:", error);
    showNotification("Operation failed. Please try again.", "error");
  }
}

function loadProductsData(filteredProducts = null) {

  if (productsPaginationManager) {
    productsPaginationManager.updateData(filteredProducts);
  } else {
    // Fallback to original rendering if pagination not available
    renderProductsTable(filteredProducts || window.products || []);
  }
}

function renderProductsTable(productsToShow) {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  // Sync with global variables - use window.products consistently
  const products = window.products || [];
  const dataToRender = productsToShow || products;

  tbody.innerHTML = dataToRender
    .map((product) => {
      const stockClass = (product.stockQuantity || 0) <= 5 ? "low-stock" : "";
      const stockIndicator = (product.stockQuantity || 0) <= 5 ? "" : "";

      return `
            <tr class="${stockClass}">
                <td>${product.name || "Unknown Product"}</td>
                <td><span class="category-badge">${
                  product.category || "Uncategorized"
                }</span></td>
                <td>${window.utils.formatCurrency(product.price || 0)}</td>
                <td>${stockIndicator} ${product.stockQuantity || 0}</td>
                <td class="action-buttons">
                    <button class="btn-small" onclick="editProduct('${
                      product.id
                    }')">Edit</button>
                    <button class="btn-small btn-danger" onclick="deleteProduct('${
                      product.id
                    }')">Delete</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

async function deleteProduct(productId) {
  try {
    // First check if the product can be deleted
    const response = await window.apiClient.makeRequest(`/products/${productId}/can-delete`);
    
    if (!response.data.canDelete) {
      showNotification(
        `Cannot delete this product: ${response.data.message}. Consider deactivating it instead.`,
        'error'
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    // Proceed with deletion
    await window.dataManager.deleteData("products", productId);

    // Update local array
    const products = window.products || [];
    window.products = products.filter((p) => p.id !== productId);

    showNotification("Product deleted successfully!");
    loadProductsData();

    // Update dashboard and refresh product select
    if (typeof window.updateDashboardStats === "function") {
      window.updateDashboardStats();
    }
    if (typeof window.populateProductSelect === "function") {
      window.populateProductSelect();
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Handle specific constraint errors
    if (error.message.includes('sales records')) {
      showNotification(
        'Cannot delete product with existing sales records. Consider deactivating it instead.',
        'error'
      );
    } else {
      showNotification(
        `Failed to delete product: ${error.message}`,
        'error'
      );
    }
  }
}

function editProduct(productId) {
  const products = window.products || [];
  const product = products.find((p) => p.id === productId);
  if (!product) {
    showNotification("Product not found", "error");
    return;
  }

  // Populate form fields
  document.getElementById("productName").value = product.name || "";
  document.getElementById("productCategory").value = product.category || "";
  document.getElementById("productPrice").value = product.price || 0;
  document.getElementById("productStock").value = product.stockQuantity || 0;

  // FIX: Update modal state for editing
  const modal = document.getElementById("productModal");
  const modalTitle = document.getElementById("productModalTitle");
  const submitButton = document.getElementById("productModalSubmit");

  if (modal) modal.setAttribute("data-editing", productId);
  if (modalTitle) modalTitle.textContent = "Edit Product";
  if (submitButton) submitButton.textContent = "Update Product";

  // Open modal
  window.utils.openModal("productModal");
}

// FIX: Implement missing reset function
function resetProductModal() {
  const modal = document.getElementById("productModal");
  const modalTitle = document.getElementById("productModalTitle");
  const submitButton = document.getElementById("productModalSubmit");
  const form = document.getElementById("productForm");

  if (modal) modal.removeAttribute("data-editing");
  if (modalTitle) modalTitle.textContent = "Add New Product";
  if (submitButton) submitButton.textContent = "Add Product";
  if (form) form.reset();
}

function populateProductSelect() {
  const select = document.getElementById("saleProduct");
  if (!select) return;

  // Sync with global variables - use window.products consistently
  const products = window.products || [];

  select.innerHTML =
    '<option value="">Select Product</option>' +
    products
      .map((product) => {
        const stockInfo =
          (product.stockQuantity || 0) <= 5
            ? ` (Low Stock: ${product.stockQuantity || 0})`
            : ` (Stock: ${product.stockQuantity || 0})`;
        return `<option value="${product.id}">${
          product.name || "Unknown Product"
        } - ${window.utils.formatCurrency(
          product.price || 0
        )}${stockInfo}</option>`;
      })
      .join("");
}

// Export for global access
window.resetProductModal = resetProductModal;
window.loadProductsData = loadProductsData;
