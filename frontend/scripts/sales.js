let salesPaginationManager;
let __saleOpInProgress = false; // prevent duplicate operations

// Simple fallback for notifications if utils not loaded yet
function showNotification(message, type = 'success') {
  if (window.utils && window.utils.showNotification) {
    window.utils.showNotification(message, type);
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message);
  }
}

function initializeSalesPagination() {
  if (typeof window.createPaginationManager === 'function') {
    salesPaginationManager = window.createPaginationManager(
      'sales', // Container ID - matches HTML
      'sales', // Data key
      renderSalesTable // Render function
    );

    // Enable server-side pagination for scalability
    salesPaginationManager.enableServerMode(async ({ page, perPage }) => {
      try {
        const resp = await window.apiClient.getSalesPaginated({ page, perPage, sortBy: 'created_at', sortDir: 'desc' });
        const items = Array.isArray(resp?.data) ? resp.data : [];
        const total = resp?.meta?.total ?? items.length;
        return { items, total };
      } catch (e) {
        console.error('Failed to fetch sales page:', e);
        return { items: [], total: 0 };
      }
    });

    salesPaginationManager.init();

    // Avoid immediate fetch here to prevent duplicate bursts; outer flows will call loadSalesData()
  }
}

async function addSale(event) {
  event.preventDefault();

  if (__saleOpInProgress) {
    console.log('⚠️ Sale operation already in progress');
    return;
  }

  // Disable submit button to avoid double submits
  const submitBtn = document.getElementById('salesModalSubmit');
  const prevBtnText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = (submitBtn.textContent || 'Saving...').includes('Update') ? 'Updating…' : 'Saving…';
  }
  __saleOpInProgress = true;

  try {
    const productInput = document.getElementById("saleProductInput").value.trim();
    const product = resolveProductFromInput(productInput);
    const productId = product ? product.id : "";
    const quantity = parseInt(document.getElementById("saleQuantity").value);
    const saleDate = document.getElementById("saleDate").value;
    const paymentMethod = document.getElementById("salePaymentMethod").value;
    const customerName = document.getElementById("customerName").value;
    const customerPhone = document.getElementById("customerPhone").value;
    const saleId = document.getElementById("salesModal").dataset.saleId;

    // Validation checks with user feedback
    if (!productId) {
      showNotification("Please type and select a valid product name", "error");
      return;
    }

    if (!quantity || quantity <= 0) {
      showNotification("Please enter a valid quantity", "error");
      return;
    }

    if (!saleDate) {
      showNotification("Please select a sale date", "error");
      return;
    }

    // product already resolved above
    if (!product) {
      showNotification("Please select a valid product", "error");
      return;
    }

    if (saleId) {
      // Editing an existing sale
      const existingSale = (window.sales || []).find((s) => s.id === saleId);
      if (!existingSale) {
        showNotification("Sale not found for editing", "error");
        return;
      }

      // Validate new product stock only for user feedback (backend will enforce)
      if (productId !== existingSale.productId) {
        if (quantity > product.stockQuantity) {
          showNotification("Insufficient stock available for the new product", "error");
          return;
        }
      } else {
        const quantityDifference = quantity - existingSale.quantity;
        if (quantityDifference > 0 && quantityDifference > product.stockQuantity) {
          showNotification("Insufficient stock available for this update", "error");
          return;
        }
      }

      // Update sale record (backend will adjust stock/debt transactionally)
      existingSale.productId = productId;
      existingSale.productName = product.name;
      existingSale.quantity = quantity;
      existingSale.unitPrice = product.price;
      existingSale.total = product.price * quantity;
      existingSale.paymentMethod = paymentMethod;
      existingSale.customerName = paymentMethod === "debt" ? customerName : null;
      existingSale.customerPhone = paymentMethod === "debt" ? customerPhone : null;
      existingSale.status = paymentMethod === "debt" ? "pending" : "completed";
      existingSale.date = saleDate;
      // Keep createdAt aligned with the chosen sale date (preserve time component if it exists)
      existingSale.createdAt = new Date(saleDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString();

      await window.dataManager.updateData("sales", saleId, existingSale);

      // Refresh products from backend to reflect updated stock
      try {
        const refreshed = await window.dataManager.getData("products");
        window.products = (refreshed && refreshed.data) ? refreshed.data : (window.products || []);
      } catch (e) {
        console.warn('Product refresh failed after sale update:', e.message);
      }

      showNotification("Sale updated successfully!");

      // Refresh dashboard charts if currently viewing dashboard
      if (typeof window.loadDashboardData === "function" && window.currentSection === "dashboard") {
        window.loadDashboardData();
      }
    } else {
      // Adding a new sale
      if (quantity > product.stockQuantity) {
        showNotification("Insufficient stock available", "error");
        return;
      }

      // Validate required fields for debt payments
      if (paymentMethod === "debt") {
        if (!customerName || !customerPhone) {
          showNotification("Customer name and phone are required for debt payments", "error");
          return;
        }
      }

      const total = product.price * quantity;
      const createdAt = new Date(saleDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString();

      const sale = {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: parseFloat(product.price),
        total: parseFloat(product.price) * quantity,
        paymentMethod: paymentMethod,
        customerName: (paymentMethod === "debt") ? customerName : null,
        customerPhone: (paymentMethod === "debt") ? customerPhone : null,
        status: paymentMethod === "debt" ? "pending" : "completed",
        mpesaCode: null,
        notes: document.getElementById('saleNotes')?.value || null,
        date: saleDate,
        createdBy: null,
        createdAt: createdAt
      };

      // DATABASE-FIRST OPERATION: Send to database first, then update cache
      const savedSale = await window.dataManager.createData("sales", sale);
      
      // Update global variable only after successful database save
      window.sales = window.sales || [];
      window.sales.push(savedSale.data || savedSale);
      
      // Backend decrements stock transactionally; refresh products to reflect new stock
      try {
        const refreshed = await window.dataManager.getData("products");
        window.products = (refreshed && refreshed.data) ? refreshed.data : (window.products || []);
      } catch (e) {
        console.warn('Product refresh failed after sale create:', e.message);
      }

      // Debt record is created in backend transaction when paymentMethod === 'debt'

      showNotification("Sale recorded successfully!");

      // Refresh dashboard charts if currently viewing dashboard
      if (typeof window.loadDashboardData === "function" && window.currentSection === "dashboard") {
        window.loadDashboardData();
      }
    }

    // Close modal and refresh data
    window.utils.closeModal("salesModal");
    resetSalesModal(); // FIX: Call reset function

    if (window.currentSection === "sales") {
      loadSalesData();
    }

    // Update dashboard
    if (typeof window.updateDashboardStats === "function") {
      window.updateDashboardStats();
    }

  } catch (error) {
    console.error("Failed to save sale:", error);
    
    // Provide specific error messages based on error type
    let errorMessage = "Failed to save sale. Please try again.";
    
    if (error.message.includes('Database connection')) {
      errorMessage = "Database connection error. Please check if the server is running.";
    } else if (error.message.includes('validation')) {
      errorMessage = "Invalid data provided. Please check all fields.";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Request timed out. Please try again.";
    }
    
    showNotification(errorMessage, "error");
  } finally {
    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = prevBtnText || 'Add Sale';
    }
    __saleOpInProgress = false;
  }
}

async function loadSalesData(filteredSales = null) {
  try {
    // Server-side pagination mode: fetch current page
    if (salesPaginationManager && salesPaginationManager.serverMode && typeof salesPaginationManager.fetchAndUpdate === 'function' && !filteredSales) {
      await salesPaginationManager.fetchAndUpdate();
    } else {
      // Legacy path or filtered view: fall back to full load
      if (!filteredSales) {
        console.log('📥 Loading sales from database...');
        const result = await window.dataManager.getData("sales");
        
        if (result && result.data) {
          window.sales = result.data;
          console.log('✅ Sales loaded from database:', window.sales.length, 'items');
        } else {
          window.sales = [];
          console.warn('⚠️ No sales data received from database');
        }
      }
    }

    const salesToShow = filteredSales || window.sales || [];

    // Initialize pagination if not already done
    if (!salesPaginationManager && typeof window.createPaginationManager === 'function') {
      initializeSalesPagination();
    }

    // Update pagination data
    if (salesPaginationManager) {
      if (salesPaginationManager.serverMode && !filteredSales) {
        // In server mode, updateData should not reset items; controls show from fetcher
        // But keep window.sales for other consumers (dashboard)
      } else {
        salesPaginationManager.updateData(salesToShow);
      }
    } else {
      // Fallback to original rendering if pagination not available
      renderSalesTable(salesToShow);
    }
  } catch (error) {
    console.error('❌ Failed to load sales:', error);
    showNotification('Failed to load sales', 'error');
    
    // Show empty table on error
    if (salesPaginationManager) {
      salesPaginationManager.updateData([]);
    } else {
      renderSalesTable([]);
    }
  }
}

function renderSalesTable(salesToShow) {
  const tbody = document.getElementById("salesTableBody");
  if (!tbody) return;

  // Sync with global variables - use window.sales consistently
  const sales = window.sales || [];
  const dataToRender = salesToShow || sales;

  tbody.innerHTML = dataToRender
    .map((sale) => {
      const paymentBadge = getPaymentBadge(sale.paymentMethod);
      const statusBadge = getStatusBadge(sale.status);

      return `
            <tr data-sale-id="${sale.id}">
                <td>
                    <div class="date-container">
                        <span class="date-display">${window.utils.formatDate(sale.date)}</span>
                        <i class="fas fa-calendar-alt date-edit-icon" onclick="editSaleDate('${sale.id}')" title="Edit Sale Date"></i>
                    </div>
                </td>
                <td>${sale.productName || "Unknown Product"}</td>
                <td>${sale.quantity || 0}</td>
                <td>${window.utils.formatCurrency(sale.unitPrice || 0)}</td>
                <td>${window.utils.formatCurrency(sale.total || 0)}</td>
                <td>${paymentBadge}</td>
                <td>${statusBadge}</td>
                <td class="action-buttons">
                    <button class="btn-small" onclick="viewSaleDetails('${
                      sale.id
                    }')">View</button>
                    <button class="btn-small" onclick="editSale('${
                      sale.id
                    }')">Edit</button>
                    <button class="btn-small btn-danger" onclick="deleteSale('${
                      sale.id
                    }')">Delete</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// Helper function for payment method badges
function getPaymentBadge(paymentMethod) {
  const badges = {
    cash: '<span class="payment-badge cash">CASH</span>',
    debt: '<span class="payment-badge debt">DEBT</span>',
  };
  return (
    badges[paymentMethod] ||
    `<span class="payment-badge">${(
      paymentMethod || "UNKNOWN"
    ).toUpperCase()}</span>`
  );
}

// Helper function for status badges
function getStatusBadge(status) {
  const badges = {
    completed: '<span class="status-badge completed">COMPLETED</span>',
    pending: '<span class="status-badge pending">PENDING</span>',
    cancelled: '<span class="status-badge cancelled">CANCELLED</span>',
  };
  return (
    badges[status] ||
    `<span class="status-badge">${(status || "UNKNOWN").toUpperCase()}</span>`
  );
}

async function deleteSale(saleId) {
  if (!confirm("Are you sure you want to delete this sale?")) {
    return;
  }

  if (__saleOpInProgress) {
    console.log('⚠️ Delete already in progress');
    return;
  }
  __saleOpInProgress = true;

  try {
    // Call backend to delete (backend restores stock transactionally)
    await window.dataManager.deleteData("sales", saleId);

    // Remove from local cache (UI responsiveness)
    window.sales = (window.sales || []).filter((s) => s.id !== saleId);

    // Refresh products from backend to reflect restored stock
    try {
      const refreshed = await window.dataManager.getData("products");
      window.products = (refreshed && refreshed.data) ? refreshed.data : (window.products || []);
    } catch (e) {
      console.warn('Product refresh failed after sale delete:', e.message);
    }

    // If using server-side pagination, refresh current page; else reload table
    if (salesPaginationManager && salesPaginationManager.serverMode && typeof salesPaginationManager.fetchAndUpdate === 'function') {
      await salesPaginationManager.fetchAndUpdate();
    } else {
      loadSalesData();
    }

    showNotification("Sale deleted successfully!");

    // Update dashboard
    if (typeof window.updateDashboardStats === "function") {
      window.updateDashboardStats();
    }

    // Refresh dashboard charts if currently viewing dashboard
    if (typeof window.loadDashboardData === "function" && window.currentSection === "dashboard") {
      window.loadDashboardData();
    }
  } catch (err) {
    console.error('Delete sale failed:', err);
    showNotification('Failed to delete sale. Please try again.', 'error');
  } finally {
    __saleOpInProgress = false;
  }
}

function viewSaleDetails(saleId) {
  const sales = window.sales || [];
  const sale = sales.find((s) => s.id === saleId);
  if (sale) {
    showNotification(
      `Sale Details:\n\nProduct: ${sale.productName}\nQuantity: ${
        sale.quantity
      }\nUnit Price: ${window.utils.formatCurrency(
        sale.unitPrice
      )}\nTotal: ${window.utils.formatCurrency(sale.total)}\nPayment: ${
        sale.paymentMethod
      }\nCustomer: ${
        sale.customerName || "N/A"
      }\nDate: ${window.utils.formatDate(sale.date)}`,
      "info"
    );
  }
}

function editSale(saleId) {
  const sales = window.sales || [];
  const sale = sales.find((s) => s.id === saleId);
  if (!sale) return;

  // Populate product select first
  populateProductSelect();

  // Set modal title and button text
  const modalTitle = document.getElementById("salesModalTitle");
  const submitButton = document.getElementById("salesModalSubmit");

  if (modalTitle) modalTitle.textContent = "Edit Sale";
  if (submitButton) submitButton.textContent = "Update Sale";

  // Store sale ID in the modal for reference
  const modal = document.getElementById("salesModal");
  if (modal) modal.dataset.saleId = saleId;

  // Populate form fields with validation
  const productInputEl = document.getElementById("saleProductInput");
  const quantityInput = document.getElementById("saleQuantity");
  const paymentSelect = document.getElementById("salePaymentMethod");
  const customerNameInput = document.getElementById("customerName");
  const customerPhoneInput = document.getElementById("customerPhone");

  if (productInputEl) productInputEl.value = sale.productName;
  if (quantityInput) quantityInput.value = sale.quantity;
  
  // Set the sale date
  const saleDateInput = document.getElementById("saleDate");
  if (saleDateInput) saleDateInput.value = sale.date;
  
  if (paymentSelect) paymentSelect.value = sale.paymentMethod;
  if (customerNameInput) customerNameInput.value = sale.customerName || "";
  if (customerPhoneInput) customerPhoneInput.value = sale.customerPhone || "";

  // Trigger customer info visibility
  toggleCustomerInfo();

  // Show modal
  window.utils.openModal("salesModal");
}

// FIX: Implement missing reset function
function resetSalesModal() {
  const modalTitle = document.getElementById("salesModalTitle");
  const submitButton = document.getElementById("salesModalSubmit");
  const modal = document.getElementById("salesModal");
  const form = document.getElementById("saleForm");

  if (modalTitle) modalTitle.textContent = "Add New Sale";
  if (submitButton) submitButton.textContent = "Add Sale";
  if (modal) modal.dataset.saleId = "";
  if (form) form.reset();

  // Set default date to today
  const saleDateInput = document.getElementById("saleDate");
  if (saleDateInput) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    saleDateInput.value = `${yyyy}-${mm}-${dd}`; // Local date (YYYY-MM-DD)
  }

  // Hide customer info fields
  const customerInfoGroup = document.getElementById("customerInfoGroup");
  const customerPhoneGroup = document.getElementById("customerPhoneGroup");
  if (customerInfoGroup) customerInfoGroup.style.display = "none";
  if (customerPhoneGroup) customerPhoneGroup.style.display = "none";
}

// New functions for date editing functionality

function focusDateInput(inputId) {
  const dateInput = document.getElementById(inputId);
  if (dateInput) {
    dateInput.focus();
    // Try to open the date picker
    if (dateInput.showPicker) {
      dateInput.showPicker();
    } else {
      // Fallback for browsers that don't support showPicker
      dateInput.click();
    }
  }
}

function openDatePicker(inputId) {
  const dateInput = document.getElementById(inputId);
  if (dateInput) {
    dateInput.focus();
    // Multiple approaches to ensure calendar opens
    if (dateInput.showPicker) {
      try {
        dateInput.showPicker();
      } catch (e) {
        // Fallback if showPicker fails
        dateInput.click();
      }
    } else {
      // For browsers without showPicker support
      dateInput.click();
    }
  }
}

async function editSaleDate(saleId) {
  const sale = (window.sales || []).find(s => s.id === saleId);
  if (!sale) return;
  
  const currentDate = sale.date;
  const newDate = prompt(
    `Edit Sale Date (YYYY-MM-DD format):\nCurrent: ${currentDate}`, 
    currentDate
  );
  
  if (newDate && newDate !== currentDate) {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDate)) {
      showNotification("Please enter date in YYYY-MM-DD format", "error");
      return;
    }
    
    // Validate date range (1940-2099)
    const inputDate = new Date(newDate);
    const minDate = new Date('1940-01-01');
    const maxDate = new Date('2099-12-31');
    
    if (inputDate < minDate || inputDate > maxDate) {
      showNotification("Date must be between 1940 and 2099", "error");
      return;
    }
    
    // Update sale record
    sale.date = newDate;
    const existingISO = typeof sale.createdAt === 'string' ? sale.createdAt : (sale.createdAt?.toISOString?.() || null);
    const timePart = existingISO && existingISO.includes('T') ? existingISO.split('T')[1] : '00:00:00.000Z';
    sale.createdAt = new Date(`${newDate}T${timePart}`).toISOString();
    
    // Update linked debt record if exists
    const debts = window.debts || [];
    const linkedDebt = debts.find(d => d.saleId === saleId);
    if (linkedDebt) {
      linkedDebt.date = newDate;
      linkedDebt.createdAt = sale.createdAt;
      // Recalculate due date (7 days from new date)
      linkedDebt.dueDate = new Date(Date.parse(newDate) + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      await window.dataManager.updateData("debts", linkedDebt.id, linkedDebt);
    }
    
    await window.dataManager.updateData("sales", saleId, sale);
    loadSalesData();
    showNotification("Sale date updated successfully!");
    
    // Update dashboard if visible
    if (typeof window.updateDashboardStats === "function") {
      window.updateDashboardStats();
    }
  }
}

// Helper: resolve a product from typed input (exact match first, then case-insensitive unique match)
function resolveProductFromInput(inputValue) {
  const products = window.products || [];
  if (!inputValue) return null;
  // Exact match (case-insensitive)
  const exact = products.find(p => (p.name || '').toLowerCase() === inputValue.toLowerCase());
  if (exact) return exact;
  // Starts-with or includes unique match
  const candidates = products.filter(p => (p.name || '').toLowerCase().includes(inputValue.toLowerCase()));
  return candidates.length === 1 ? candidates[0] : null;
}

// Export for global access
window.initializeSalesPagination = initializeSalesPagination;
window.loadSalesData = loadSalesData;
window.resetSalesModal = resetSalesModal;
window.focusDateInput = focusDateInput;
window.openDatePicker = openDatePicker;
window.editSaleDate = editSaleDate;
// Ensure action handlers are available globally for onclick usage
window.editSale = editSale;
window.deleteSale = deleteSale;
window.viewSaleDetails = viewSaleDetails;
window.addSale = addSale;
