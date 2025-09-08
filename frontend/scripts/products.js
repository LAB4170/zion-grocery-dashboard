// Product management functions - FIXED VERSION WITH PAGINATION

// Use global products variable for consistency - no redeclaration needed
// Access window.products directly to avoid conflicts

// Initialize pagination manager for products
let productsPaginationManager;

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
    const name = document.getElementById("productName").value;
    const category = document.getElementById("productCategory").value;
    const price = parseFloat(document.getElementById("productPrice").value);
    const stock = parseInt(document.getElementById("productStock").value);

    // Validation checks with user feedback
    if (!name || name.trim() === "") {
      window.utils.showNotification("Please enter a product name", "error");
      return;
    }

    if (!category) {
      window.utils.showNotification("Please select a category", "error");
      return;
    }

    if (!price || price <= 0) {
      window.utils.showNotification("Please enter a valid price", "error");
      return;
    }

    if (isNaN(stock) || stock < 0) {
      window.utils.showNotification("Please enter a valid stock quantity", "error");
      return;
    }

    const modal = document.getElementById("productModal");
    const isEditing = modal && modal.hasAttribute("data-editing");

    if (isEditing) {
      // Update existing product
      const productId = modal.getAttribute("data-editing");
      const productIndex = (window.products || []).findIndex((p) => p.id === productId);
      
      if (productIndex === -1) {
        window.utils.showNotification("Product not found for editing", "error");
        return;
      }

      const updatedProduct = {
        ...window.products[productIndex],
        name: name.trim(),
        category: category,
        price: price,
        stock_quantity: stock,
        updated_at: new Date().toISOString()
      };

      // Update in database first
      const savedProduct = await window.dataManager.updateData("products", productId, updatedProduct);
      
      // Update global array only after successful database update
      window.products[productIndex] = savedProduct;
      
      window.utils.showNotification("Product updated successfully!");
    } else {
      // Create new product
      const product = {
        id: window.utils.generateId(),
        name: name.trim(),
        category: category,
        price: price,
        stock_quantity: stock,
        min_stock: Math.max(1, Math.floor(stock * 0.1)), // 10% of initial stock as minimum
        is_active: true,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // DATABASE-FIRST OPERATION: Send to database first, then update cache
      console.log('Sending product to database:', product);
      const savedProduct = await window.dataManager.createData("products", product);
      console.log('Product saved successfully:', savedProduct);
      
      // Update global variable only after successful database save
      window.products = window.products || [];
      window.products.push(savedProduct);

      window.utils.showNotification("Product added successfully!");
    }

    // Close modal and refresh data
    closeModal("productModal");
    loadProductsData();
    
    // Update dashboard if visible
    if (typeof updateDashboardStats === "function") {
      updateDashboardStats();
    }

  } catch (error) {
    console.error("Failed to save product:", error);
    
    // Provide specific error messages based on error type
    let errorMessage = "Failed to save product. Please try again.";
    
    if (error.message.includes('Database connection')) {
      errorMessage = "Database connection error. Please check if the server is running.";
    } else if (error.message.includes('validation')) {
      errorMessage = "Invalid product data. Please check all fields.";
    } else if (error.message.includes('duplicate')) {
      errorMessage = "A product with this name already exists.";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Request timed out. Please try again.";
    }
    
    window.utils.showNotification(errorMessage, "error");
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
      const stockClass = (product.stock_quantity || 0) <= 5 ? "low-stock" : "";
      const stockIndicator = (product.stock_quantity || 0) <= 5 ? "" : "";

      return `
            <tr class="${stockClass}">
                <td>${product.name || "Unknown Product"}</td>
                <td><span class="category-badge">${
                  product.category || "Uncategorized"
                }</span></td>
                <td>${window.utils.formatCurrency(product.price || 0)}</td>
                <td>${stockIndicator} ${product.stock_quantity || 0}</td>
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
  if (!confirm("Are you sure you want to delete this product?")) {
    return;
  }

  const products = window.products || [];
  window.products = products.filter((p) => p.id !== productId);
  await window.dataManager.deleteData("products", productId);

  window.utils.showNotification("Product deleted successfully!");
  loadProductsData();

  // Update dashboard and refresh product select
  if (typeof window.updateDashboardStats === "function") {
    window.updateDashboardStats();
  }
  if (typeof window.updateInventoryOverview === "function") {
    window.updateInventoryOverview();
  }
  if (typeof window.updateDetailedInventory === "function") {
    window.updateDetailedInventory();
  }
  populateProductSelect();
}

function editProduct(productId) {
  const products = window.products || [];
  const product = products.find((p) => p.id === productId);
  if (!product) {
    window.utils.showNotification("Product not found", "error");
    return;
  }

  // Populate form fields
  document.getElementById("productName").value = product.name || "";
  document.getElementById("productCategory").value = product.category || "";
  document.getElementById("productPrice").value = product.price || 0;
  document.getElementById("productStock").value = product.stock_quantity || 0;

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
          (product.stock_quantity || 0) <= 5
            ? ` (Low Stock: ${product.stock_quantity || 0})`
            : ` (Stock: ${product.stock_quantity || 0})`;
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
