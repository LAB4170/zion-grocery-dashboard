// Modal management functions - Enhanced versions of utils modal functions - FIXED VERSION

function openModal(modalId) {
  // Use utils function but add specific logic
  window.utils.openModal(modalId);

  // Load products for sales modal
  if (modalId === "salesModal") {
    populateProductSelect();
    resetSalesModal(); // FIX: Ensure modal is reset when opened for new sale
  }

  // FIX: Reset product modal when opened for new product
  if (modalId === "productModal") {
    resetProductModal();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    // Reset form if it exists
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
    }

    // FIX: Reset modal states properly
    if (modalId === "salesModal") {
      resetSalesModal();
    } else if (modalId === "productModal") {
      resetProductModal();
    } else if (modalId === "expenseModal") {
      // Reset expense form
      const expenseForm = document.getElementById("expenseForm");
      if (expenseForm) expenseForm.reset();
    } else if (modalId === "debtModal") {
      // Reset debt form
      const debtForm = document.getElementById("debtForm");
      if (debtForm) debtForm.reset();
    }
  }

  // Use utils function for consistent behavior
  utils.closeModal(modalId);
}

// Close modals when clicking outside
window.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal")) {
    const modalId = event.target.id;
    closeModal(modalId); // FIX: Use our enhanced close function
  }
});

function toggleCustomerInfo() {
  const paymentMethod = document.getElementById("salePaymentMethod").value;
  const customerInfoGroup = document.getElementById("customerInfoGroup");
  const customerPhoneGroup = document.getElementById("customerPhoneGroup");
  const mpesaCodeGroup = document.getElementById("mpesaCodeGroup");

  // Show customer info only for debt payments
  if (paymentMethod === "debt") {
    customerInfoGroup.style.display = "block";
    customerPhoneGroup.style.display = "block";

    // Make fields required for debt payments only
    document.getElementById("customerName").required = true;
    document.getElementById("customerPhone").required = true;
  } else {
    customerInfoGroup.style.display = "none";
    customerPhoneGroup.style.display = "none";

    // Make fields not required for cash and M-Pesa
    document.getElementById("customerName").required = false;
    document.getElementById("customerPhone").required = false;
  }

  // Show M-Pesa code field only for M-Pesa payments (optional)
  if (mpesaCodeGroup) {
    if (paymentMethod === "mpesa") {
      mpesaCodeGroup.style.display = "block";
      document.getElementById("mpesaCode").required = false; // Make optional
      document.getElementById("mpesaCode").value = ""; // Clear M-Pesa code field
    } else {
      mpesaCodeGroup.style.display = "none";
      document.getElementById("mpesaCode").required = false;
    }
  }
}

// FIX: Implement comprehensive modal reset functions
function resetSalesModal() {
  const modalTitle = document.getElementById("salesModalTitle");
  const submitButton = document.getElementById("salesModalSubmit");
  const modal = document.getElementById("salesModal");
  const form = document.getElementById("saleForm");

  if (modalTitle) modalTitle.textContent = "Add New Sale";
  if (submitButton) submitButton.textContent = "Add Sale";
  if (modal) modal.dataset.saleId = "";
  if (form) form.reset();

  // Hide customer info fields
  const customerInfoGroup = document.getElementById("customerInfoGroup");
  const customerPhoneGroup = document.getElementById("customerPhoneGroup");
  if (customerInfoGroup) customerInfoGroup.style.display = "none";
  if (customerPhoneGroup) customerPhoneGroup.style.display = "none";

  // Reset required fields
  const customerName = document.getElementById("customerName");
  const customerPhone = document.getElementById("customerPhone");
  if (customerName) customerName.required = false;
  if (customerPhone) customerPhone.required = false;
}

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

// Export functions for global access
window.resetSalesModal = resetSalesModal;
window.resetProductModal = resetProductModal;
