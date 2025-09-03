// Product management functions - FIXED VERSION WITH PAGINATION

// Use global products variable for consistency - no redeclaration needed
// Access window.products directly to avoid conflicts

// Initialize pagination manager for products
let productsPaginationManager;

function initializeProductsPagination() {
  console.log('Initializing products pagination...');
  if (typeof window.createPaginationManager === 'function') {
    productsPaginationManager = window.createPaginationManager(
      'products', // Container ID - matches HTML
      'products', // Data key
      renderProductsTable // Render function
    );
    productsPaginationManager.init();
    console.log('Products pagination manager created and initialized');
    
    // Force immediate data update
    setTimeout(() => {
      if (productsPaginationManager && window.products) {
        productsPaginationManager.updateData(window.products);
        console.log('Products pagination data updated with', window.products.length, 'items');
      }
    }, 100);
  } else {
    console.error('createPaginationManager function not available');
  }
}

function addProduct(event) {
  event.preventDefault();

  const name = document.getElementById("productName").value;
  const category = document.getElementById("productCategory").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);

  // Validation
  if (!name || !category || isNaN(price) || isNaN(stock)) {
    window.utils.showNotification("Please fill all fields correctly", "error");
    return;
  }

  if (price <= 0) {
    window.utils.showNotification("Price must be greater than zero", "error");
    return;
  }

  if (stock < 0) {
    window.utils.showNotification("Stock cannot be negative", "error");
    return;
  }

  // FIX: Check if we're editing an existing product
  const modal = document.getElementById("productModal");
  const editingProductId = modal ? modal.getAttribute("data-editing") : null;

  if (editingProductId) {
    // EDITING MODE - Update existing product
    const products = window.products || [];
    const productIndex = products.findIndex((p) => p.id === editingProductId);

    if (productIndex !== -1) {
      // Update existing product
      products[productIndex] = {
        ...products[productIndex], // Keep original id and createdAt
        name,
        category,
        price,
        stock,
        updatedAt: new Date().toISOString(),
      };

      window.products = products;
      await window.dataManager.updateData("products", products[productIndex]);
      window.utils.showNotification("Product updated successfully!");
    }

    // Clear editing mode
    modal.removeAttribute("data-editing");
  } else {
    // ADDING MODE - Create new product
    const product = {
      id: window.utils.generateId(),
      name,
      category,
      price,
      stock,
      createdAt: new Date().toISOString(),
    };

    // Update global products array
    window.products = window.products || [];
    window.products.push(product);
    await window.dataManager.addData("products", product);

    loadProductsData();
    document.getElementById("productForm").reset();
    window.utils.closeModal("productModal");
    window.utils.showNotification("Product added successfully!");
  }

  if (window.currentSection === "sales-settings") {
    loadProductsData();
  }

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
      const stockClass = (product.stock || 0) <= 5 ? "low-stock" : "";
      const stockIndicator = (product.stock || 0) <= 5 ? "" : "";

      return `
            <tr class="${stockClass}">
                <td>${product.name || "Unknown Product"}</td>
                <td><span class="category-badge">${
                  product.category || "Uncategorized"
                }</span></td>
                <td>${window.utils.formatCurrency(product.price || 0)}</td>
                <td>${stockIndicator} ${product.stock || 0}</td>
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
  document.getElementById("productStock").value = product.stock || 0;

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
          (product.stock || 0) <= 5
            ? ` (Low Stock: ${product.stock || 0})`
            : ` (Stock: ${product.stock || 0})`;
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
window.initializeProductsPagination = initializeProductsPagination;
window.loadProductsData = loadProductsData;
