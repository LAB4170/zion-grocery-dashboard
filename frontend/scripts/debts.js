// Initialize pagination manager for debts
let debtsPaginationManager;

function initializeDebtsPagination() {
  if (typeof window.createPaginationManager === 'function') {
    debtsPaginationManager = window.createPaginationManager(
      'individual-debts', // Container ID - matches HTML
      'debts', // Data key
      renderDebtsTable // Render function
    );
    debtsPaginationManager.init();
  }
}

async function addDebt(event) {
  event.preventDefault();

  try {
    const customerName = document.getElementById("debtCustomerName").value;
    const customerPhone = document.getElementById("debtCustomerPhone").value;
    const amount = parseFloat(document.getElementById("debtAmount").value);
    const dueDate = document.getElementById("debtDueDate").value;

    // Validation checks with user feedback
    if (!customerName || customerName.trim() === "") {
      window.utils.showNotification("Please enter customer name", "error");
      return;
    }

    if (!customerPhone || customerPhone.trim() === "") {
      window.utils.showNotification("Please enter customer phone number", "error");
      return;
    }

    if (!amount || amount <= 0) {
      window.utils.showNotification("Please enter a valid amount", "error");
      return;
    }

    if (!dueDate) {
      window.utils.showNotification("Please select a due date", "error");
      return;
    }

    // Validate due date is not in the past
    const today = new Date();
    const selectedDate = new Date(dueDate);
    if (selectedDate < today.setHours(0, 0, 0, 0)) {
      window.utils.showNotification("Due date cannot be in the past", "error");
      return;
    }

    const debt = {
      id: window.utils.generateId(),
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      amount: amount,
      status: "pending",
      due_date: dueDate,
      created_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // DATABASE-FIRST OPERATION: Send to database first, then update cache
    const savedDebt = await window.dataManager.createData("debts", debt);
    
    // Update global variable only after successful database save
    window.debts = window.debts || [];
    window.debts.push(savedDebt);

    // Close modal and refresh data
    closeModal("debtModal");
    loadDebtsData();
    
    // Update dashboard if visible
    if (typeof updateDashboardStats === "function") {
      updateDashboardStats();
    }

    window.utils.showNotification("Debt added successfully!");

  } catch (error) {
    console.error("Failed to save debt:", error);
    
    // Provide specific error messages based on error type
    let errorMessage = "Failed to save debt. Please try again.";
    
    if (error.message.includes('Database connection')) {
      errorMessage = "Database connection error. Please check if the server is running.";
    } else if (error.message.includes('validation')) {
      errorMessage = "Invalid debt data. Please check all fields.";
    } else if (error.message.includes('duplicate')) {
      errorMessage = "A debt record for this customer already exists.";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Request timed out. Please try again.";
    }
    
    window.utils.showNotification(errorMessage, "error");
  }
}

async function addDebtFromSale(sale) {
  // Create debt object with proper field mapping for backend
  const debt = {
    id: window.utils.generateId(),
    customer_name: sale.customerName || sale.customer_name,
    customer_phone: sale.customerPhone || sale.customer_phone,
    amount: sale.total,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
    status: "pending",
    sale_id: sale.id,
    created_by: 'system',
    created_at: sale.createdAt || sale.created_at,
    // Keep frontend-compatible fields for local cache
    customerName: sale.customerName || sale.customer_name,
    customerPhone: sale.customerPhone || sale.customer_phone,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    date: sale.date,
    saleId: sale.id,
  };

  // DATABASE-FIRST OPERATION: Send to database first, then update cache
  try {
    const savedDebt = await window.dataManager.createData("debts", debt);
    
    // Update global variable only after successful database save
    window.debts = window.debts || [];
    window.debts.push(savedDebt);
  } catch (error) {
    console.error("Failed to save debt to database:", error);
    window.utils.showNotification("Failed to save debt. Please try again.", "error");
  }
}

function loadDebtsData(filteredDebts = null) {
  // Initialize pagination if not already done
  if (!debtsPaginationManager && typeof window.createPaginationManager === 'function') {
    initializeDebtsPagination();
  }

  // Update pagination data
  if (debtsPaginationManager) {
    debtsPaginationManager.updateData(filteredDebts);
  } else {
    // Fallback to original rendering if pagination not available
    renderDebtsTable(filteredDebts || window.debts || []);
  }
}

function renderDebtsTable(debtsToShow) {
  const tbody = document.getElementById("debtsTableBody");
  if (!tbody) return;

  // FIX: Use consistent global variable access
  const debts = window.debts || [];
  const dataToRender = debtsToShow || debts;

  tbody.innerHTML = dataToRender
    .map((debt) => {
      const statusBadge = getDebtStatusBadge(debt);
      const gracePeriodInfo = getGracePeriodInfo(debt);
      const isOverdue = isDebtOverdue(debt);
      const rowClass = isOverdue ? 'debt-overdue' : '';

      return `
            <tr class="${rowClass}">
                <td>
                    <div class="date-container">
                        <span class="date-display">${window.utils.formatDate(debt.createdAt)}</span>
                        <i class="fas fa-calendar-alt date-edit-icon" onclick="editDebtDate('${debt.id}', 'createdAt')" title="Edit Date"></i>
                    </div>
                </td>
                <td>${debt.customerName || "Unknown Customer"}</td>
                <td>${debt.customerPhone || "N/A"}</td>
                <td>${window.utils.formatCurrency(debt.amount || 0)}</td>
                <td>
                    <div class="status-container">
                        ${statusBadge}
                        ${gracePeriodInfo}
                    </div>
                </td>
                <td>
                    <div class="date-container">
                        <span class="date-display">${window.utils.formatDate(debt.dueDate)}</span>
                        <i class="fas fa-calendar-alt date-edit-icon" onclick="editDebtDate('${debt.id}', 'dueDate')" title="Edit Due Date"></i>
                    </div>
                </td>
                <td class="action-buttons">
                    ${
                      debt.status === "pending"
                        ? `<button class="btn-small btn-success" onclick="markDebtPaid('${debt.id}')" title="Mark as Paid"><i class="fas fa-check"></i> Mark Paid</button>`
                        : `<div class="paid-indicator">
                            <i class="fas fa-check-circle"></i>
                            <input type="text" class="paid-date-input" value="Paid on ${window.utils.formatDate(debt.paidAt)}" readonly>
                          </div>`
                    }
                    ${debt.saleId ? `<button class="btn-small btn-info" onclick="viewLinkedSale('${debt.saleId}')" title="View Related Sale"><i class="fas fa-link"></i> Sale</button>` : ''}
                    <button class="btn-small btn-danger" onclick="deleteDebt('${
                      debt.id
                    }')" title="Delete Debt"><i class="fas fa-trash"></i> Delete</button>
                </td>
            </tr>
        `;
    })
    .join("");

  // Update debt statistics
  updateDebtStats();
}

function loadGroupedDebtsData() {
  const content = document.getElementById("groupedDebtsContent");
  if (!content) return;

  // FIX: Use consistent global variable access
  const debts = window.debts || [];

  // Group debts by customer
  const groupedDebts = debts.reduce((groups, debt) => {
    const key = `${debt.customerName}-${debt.customerPhone}`;
    if (!groups[key]) {
      groups[key] = {
        customerName: debt.customerName,
        customerPhone: debt.customerPhone,
        debts: [],
        totalAmount: 0,
      };
    }
    groups[key].debts.push(debt);
    if (debt.status === "pending") {
      groups[key].totalAmount += debt.amount || 0;
    }
    return groups;
  }, {});

  content.innerHTML = Object.values(groupedDebts)
    .map(
      (group) => `
        <div class="debt-group">
            <h4>${group.customerName} (${group.customerPhone})</h4>
            <p>Total Outstanding: ${window.utils.formatCurrency(
              group.totalAmount
            )}</p>
            <div class="debt-list">
                ${group.debts
                  .map(
                    (debt) => `
                    <div class="debt-item">
                        <span>${window.utils.formatDate(
                          debt.createdAt
                        )} - ${window.utils.formatCurrency(debt.amount)} - ${
                      debt.status
                    }</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    `
    )
    .join("");
}

async function markDebtPaid(debtId) {
  // FIX: Use consistent global variable access
  const debts = window.debts || [];
  const debt = debts.find((d) => d.id === debtId);
  if (debt) {
    debt.status = "paid";
    debt.paidAt = new Date().toISOString();
    await window.dataManager.updateData("debts", debtId, debt);

    // Update corresponding sale record if it exists
    if (debt.saleId) {
      const sales = window.sales || [];
      const sale = sales.find((s) => s.id === debt.saleId);
      if (sale) {
        sale.status = "completed";
        sale.paidAt = debt.paidAt;
        await window.dataManager.updateData("sales", debt.saleId, sale);
      }
    }

    loadDebtsData();
    window.utils.showNotification("Debt marked as paid! Sale record updated.");

    // Update dashboard and sales table if visible
    if (typeof window.updateDashboardStats === "function") {
      window.updateDashboardStats();
    }
    if (window.currentSection === "sales" && typeof loadSalesData === "function") {
      loadSalesData();
    }
  }
}

async function deleteDebt(debtId) {
  if (confirm("Are you sure you want to delete this debt record?")) {
    // FIX: Use consistent global variable access
    window.debts = (window.debts || []).filter((d) => d.id !== debtId);
    await window.dataManager.deleteData("debts", debtId);
    loadDebtsData();
    window.utils.showNotification("Debt record deleted!");

    // Update dashboard
    if (typeof window.updateDashboardStats === "function") {
      window.updateDashboardStats();
    }
  }
}

// New helper functions for enhanced debt management

function getDebtStatusBadge(debt) {
  if (debt.status === "paid") {
    return '<span class="status-badge paid"><i class="fas fa-check-circle"></i> PAID</span>';
  }
  
  const isOverdue = isDebtOverdue(debt);
  if (isOverdue) {
    return '<span class="status-badge overdue"><i class="fas fa-exclamation-triangle"></i> OVERDUE</span>';
  }
  
  return '<span class="status-badge pending"><i class="fas fa-clock"></i> PENDING</span>';
}

function getGracePeriodInfo(debt) {
  if (debt.status === "paid") return "";
  
  const daysRemaining = getDaysUntilDue(debt);
  
  if (daysRemaining < 0) {
    return `<small class="grace-period overdue">Overdue by ${Math.abs(daysRemaining)} days</small>`;
  } else if (daysRemaining <= 2) {
    return `<small class="grace-period warning">${daysRemaining} days left</small>`;
  } else {
    return `<small class="grace-period normal">${daysRemaining} days left</small>`;
  }
}

function isDebtOverdue(debt) {
  if (debt.status === "paid") return false;
  return new Date(debt.dueDate) < new Date();
}

function getDaysUntilDue(debt) {
  const today = new Date();
  const dueDate = new Date(debt.dueDate);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function editDebtDate(debtId, dateField) {
  const debt = (window.debts || []).find(d => d.id === debtId);
  if (!debt) return;
  
  const currentDate = dateField === 'createdAt' 
    ? debt.createdAt.split('T')[0] 
    : debt.dueDate;
  
  const newDate = prompt(
    `Edit ${dateField === 'createdAt' ? 'Created Date' : 'Due Date'}:`, 
    currentDate
  );
  
  if (newDate && newDate !== currentDate) {
    if (dateField === 'createdAt') {
      debt.createdAt = new Date(newDate + 'T' + debt.createdAt.split('T')[1]).toISOString();
      debt.date = newDate;
    } else {
      debt.dueDate = newDate;
    }
    
    window.dataManager.updateData("debts", debtId, debt);
    loadDebtsData();
    window.utils.showNotification(`${dateField === 'createdAt' ? 'Created date' : 'Due date'} updated successfully!`);
  }
}

function viewLinkedSale(saleId) {
  const sale = (window.sales || []).find(s => s.id === saleId);
  if (sale) {
    // Switch to sales section and highlight the sale
    window.showSection('sales');
    setTimeout(() => {
      const saleRow = document.querySelector(`tr[data-sale-id="${saleId}"]`);
      if (saleRow) {
        saleRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        saleRow.classList.add('highlight-row');
        setTimeout(() => saleRow.classList.remove('highlight-row'), 3000);
      }
    }, 100);
  } else {
    window.utils.showNotification("Related sale not found", "error");
  }
}

function updateDebtStats() {
  const debts = window.debts || [];
  const pendingDebts = debts.filter(d => d.status === "pending");
  
  const totalOutstanding = pendingDebts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
  const totalDebtors = new Set(pendingDebts.map(d => `${d.customerName}-${d.customerPhone}`)).size;
  const overdueDebts = pendingDebts.filter(isDebtOverdue);
  const overdueAmount = overdueDebts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
  
  // Update stats in debt management overview
  const totalOutstandingEl = document.getElementById("total-outstanding");
  const totalDebtorsEl = document.getElementById("total-debtors");
  const overdueDebtsEl = document.getElementById("overdue-debts");
  
  if (totalOutstandingEl) totalOutstandingEl.textContent = window.utils.formatCurrency(totalOutstanding);
  if (totalDebtorsEl) totalDebtorsEl.textContent = totalDebtors.toString();
  if (overdueDebtsEl) overdueDebtsEl.textContent = window.utils.formatCurrency(overdueAmount);
}

// Export for global access
window.initializeDebtsPagination = initializeDebtsPagination;
window.loadDebtsData = loadDebtsData;
