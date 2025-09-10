let salesPaginationManager;

function initializeSalesPagination() {
  if (typeof window.createPaginationManager === 'function') {
    salesPaginationManager = window.createPaginationManager(
      'sales', // Container ID - matches HTML
      'sales', // Data key
      renderSalesTable // Render function
    );
    salesPaginationManager.init();
  }
}

async function addSale(event) {
  event.preventDefault();

  try {
    const productId = document.getElementById("saleProduct").value;
    const quantity = parseInt(document.getElementById("saleQuantity").value);
    const saleDate = document.getElementById("saleDate").value;
    const paymentMethod = document.getElementById("salePaymentMethod").value;
    const customerName = document.getElementById("customerName").value;
    const customerPhone = document.getElementById("customerPhone").value;
    const saleId = document.getElementById("salesModal").dataset.saleId;

    // Validation checks with user feedback
    if (!productId) {
      window.utils.showNotification("Please select a product", "error");
      return;
    }

    if (!quantity || quantity <= 0) {
      window.utils.showNotification("Please enter a valid quantity", "error");
      return;
    }

    if (!saleDate) {
      window.utils.showNotification("Please select a sale date", "error");
      return;
    }

    // CRITICAL FIX: Remove parseInt conversion - IDs are strings
    const product = (window.products || []).find((p) => p.id === productId);
    if (!product) {
      window.utils.showNotification("Please select a valid product", "error");
      return;
    }

    if (saleId) {
      // Editing an existing sale
      const existingSale = (window.sales || []).find((s) => s.id === saleId);
      if (!existingSale) {
        window.utils.showNotification("Sale not found for editing", "error");
        return;
      }

      // Calculate stock difference
      const quantityDifference = quantity - existingSale.quantity;

      if (quantityDifference > product.stockQuantity) {
        window.utils.showNotification(
          "Insufficient stock available for this update",
          "error"
        );
        return;
      }

      // Update product stock
      product.stockQuantity -= quantityDifference;
      await window.dataManager.updateData("products", product.id, product);

      // Update sale record
      existingSale.productId = productId;
      existingSale.productName = product.name;
      existingSale.quantity = quantity;
      existingSale.unitPrice = product.price;
      existingSale.total = product.price * quantity;
      existingSale.paymentMethod = paymentMethod;
      existingSale.customerName = paymentMethod === "cash" ? "" : customerName;
      existingSale.customerPhone = paymentMethod === "cash" ? "" : customerPhone;
      existingSale.status = paymentMethod === "debt" ? "pending" : "completed";
      existingSale.date = saleDate;
      existingSale.createdAt = new Date(saleDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString();

      await window.dataManager.updateData("sales", saleId, existingSale);
      window.utils.showNotification("Sale updated successfully!");
    } else {
      // Adding a new sale
      if (quantity > product.stockQuantity) {
        window.utils.showNotification("Insufficient stock available", "error");
        return;
      }

      // Validate required fields for debt payments
      if (paymentMethod === "debt") {
        if (!customerName || !customerPhone) {
          window.utils.showNotification("Customer name and phone are required for debt payments", "error");
          return;
        }
      }

      const total = product.price * quantity;

      const sale = {
        id: window.utils.generateId(), // Generate UUID for primary key
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: parseFloat(product.price),  // Convert to number, not string
        total: parseFloat(product.price) * quantity,
        paymentMethod: paymentMethod,
        customerName: (paymentMethod === "debt") ? customerName : null,  // Use null instead of empty string
        customerPhone: (paymentMethod === "debt") ? customerPhone : null, // Use null instead of empty string
        status: paymentMethod === "debt" ? "pending" : "completed",
        mpesaCode: paymentMethod === "mpesa" ? (document.getElementById('mpesaCode')?.value || null) : null,
        notes: document.getElementById('saleNotes')?.value || null,
        date: saleDate,  // Add date field for dashboard compatibility
        createdBy: null, // FIX: Use null instead of 'system' string to avoid UUID error
        createdAt: new Date().toISOString()  // Single timestamp field only
      };

      // DATABASE-FIRST OPERATION: Send to database first, then update cache
      const savedSale = await window.dataManager.createData("sales", sale);
      
      // Update global variable only after successful database save
      window.sales = window.sales || [];
      window.sales.push(savedSale);
      
      // Update product stock in database
      product.stockQuantity -= quantity;
      const updatedProduct = await window.dataManager.updateData("products", product.id, product);
      
      // Update global products array
      const productIndex = window.products.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        window.products[productIndex] = updatedProduct;
      }

      // Add debt if payment method is debt
      if (paymentMethod === "debt") {
        await addDebtFromSale(savedSale);
      }

      window.utils.showNotification("Sale recorded successfully!");
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
    
    window.utils.showNotification(errorMessage, "error");
  }
}

function loadSalesData(filteredSales = null) {
  // Initialize pagination if not already done
  if (!salesPaginationManager && typeof window.createPaginationManager === 'function') {
    initializeSalesPagination();
  }

  // Update pagination data
  if (salesPaginationManager) {
    salesPaginationManager.updateData(filteredSales);
  } else {
    // Fallback to original rendering if pagination not available
    renderSalesTable(filteredSales || window.sales || []);
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
                        <span class="date-display">${window.utils.formatDate(sale.createdAt)}</span>
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
    mpesa: '<span class="payment-badge mpesa">M-PESA</span>',
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

  const sales = window.sales || [];
  const sale = sales.find((s) => s.id === saleId);
  if (sale) {
    // Restore stock to the product
    const product = (window.products || []).find(
      (p) => p.id === sale.productId
    );
    if (product) {
      product.stockQuantity += sale.quantity;
      await window.dataManager.updateData("products", product.id, product);
    }
  }

  window.sales = sales.filter((s) => s.id !== saleId);
  await window.dataManager.deleteData("sales", saleId);

  loadSalesData();
  window.utils.showNotification("Sale deleted successfully!");

  // Update dashboard
  if (typeof window.updateDashboardStats === "function") {
    window.updateDashboardStats();
  }
}

function viewSaleDetails(saleId) {
  const sales = window.sales || [];
  const sale = sales.find((s) => s.id === saleId);
  if (sale) {
    window.utils.showNotification(
      `Sale Details:\n\nProduct: ${sale.productName}\nQuantity: ${
        sale.quantity
      }\nUnit Price: ${window.utils.formatCurrency(
        sale.unitPrice
      )}\nTotal: ${window.utils.formatCurrency(sale.total)}\nPayment: ${
        sale.paymentMethod
      }\nCustomer: ${
        sale.customerName || "N/A"
      }\nDate: ${window.utils.formatDate(sale.createdAt)}`,
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
  const productSelect = document.getElementById("saleProduct");
  const quantityInput = document.getElementById("saleQuantity");
  const paymentSelect = document.getElementById("salePaymentMethod");
  const customerNameInput = document.getElementById("customerName");
  const customerPhoneInput = document.getElementById("customerPhone");

  if (productSelect) productSelect.value = sale.productId;
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
  if (saleDateInput) saleDateInput.value = new Date().toISOString().split("T")[0];

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
      window.utils.showNotification("Please enter date in YYYY-MM-DD format", "error");
      return;
    }
    
    // Validate date range (1940-2099)
    const inputDate = new Date(newDate);
    const minDate = new Date('1940-01-01');
    const maxDate = new Date('2099-12-31');
    
    if (inputDate < minDate || inputDate > maxDate) {
      window.utils.showNotification("Date must be between 1940 and 2099", "error");
      return;
    }
    
    // Update sale record
    sale.date = newDate;
    sale.createdAt = new Date(newDate + 'T' + sale.createdAt.split('T')[1]).toISOString();
    
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
    window.utils.showNotification("Sale date updated successfully!");
    
    // Update dashboard if visible
    if (typeof window.updateDashboardStats === "function") {
      window.updateDashboardStats();
    }
  }
}

// Export for global access
window.initializeSalesPagination = initializeSalesPagination;
window.loadSalesData = loadSalesData;
window.resetSalesModal = resetSalesModal;
window.focusDateInput = focusDateInput;
window.openDatePicker = openDatePicker;
window.editSaleDate = editSaleDate;
