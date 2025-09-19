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

// Helper: build Nairobi-local ISO timestamp (UTC+03:00)
function getNairobiIsoNow() {
  const partsDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const dateMap = Object.fromEntries(partsDate.map(p => [p.type, p.value]));
  const partsTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date());
  const timeMap = Object.fromEntries(partsTime.map(p => [p.type, p.value]));
  const ymd = `${dateMap.year}-${dateMap.month}-${dateMap.day}`;
  const hms = `${timeMap.hour || '00'}:${timeMap.minute || '00'}:${timeMap.second || '00'}`;
  return new Date(`${ymd}T${hms}+03:00`).toISOString();
}

// Helper: Nairobi date-only string (YYYY-MM-DD)
function getNairobiDateString(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
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
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      amount: amount,
      status: "pending",
      // Ensure due date is a Nairobi date-only string
      dueDate: dueDate,
      createdBy: 'system',
      createdAt: getNairobiIsoNow(),
      updatedAt: getNairobiIsoNow()
    };

    // DATABASE-FIRST OPERATION: Send to database first, then update cache
    const savedDebt = await window.dataManager.createData("debts", debt);
    
    // Update global variable only after successful database save
    window.debts = window.debts || [];
    window.debts.push(savedDebt?.data || savedDebt);

    // Close modal and refresh data
    closeModal("debtModal");
    loadDebtsData();
    
    // Update dashboard if visible
    window.forceStatsNext = true;
    if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
    if (window.currentSection === 'dashboard') {
      if (typeof window.createPaymentChart === 'function') window.createPaymentChart();
      if (typeof window.createWeeklyChart === 'function') window.createWeeklyChart();
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
    customerName: sale.customerName || sale.customer_name,
    customerPhone: sale.customerPhone || sale.customer_phone,
    amount: sale.total,
    // 7 days from now in Nairobi local date
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return getNairobiDateString(d); })(),
    status: "pending",
    saleId: sale.id,
    createdBy: 'system',
    createdAt: sale.createdAt || sale.created_at || getNairobiIsoNow(),
    date: sale.date,
  };

  // DATABASE-FIRST OPERATION: Send to database first, then update cache
  try {
    const savedDebt = await window.dataManager.createData("debts", debt);
    
    // Update global variable only after successful database save
    window.debts = window.debts || [];
    window.debts.push(savedDebt?.data || savedDebt);
  } catch (error) {
    console.error("Failed to save debt to database:", error);
    window.utils.showNotification("Failed to save debt. Please try again.", "error");
  }
}

async function loadDebtsData(filteredDebts = null) {
  try {
    // If no filtered debts provided, fetch from database
    if (!filteredDebts) {
      console.log('📥 Loading debts from database...');
      const result = await window.dataManager.getData("debts");
      
      if (result && result.data) {
        window.debts = result.data;
        console.log('✅ Debts loaded from database:', window.debts.length, 'items');
      } else {
        window.debts = [];
        console.warn('⚠️ No debts data received from database');
      }
    }

    const debtsToShow = filteredDebts || window.debts || [];

    // Initialize pagination if not already done
    if (!debtsPaginationManager && typeof window.createPaginationManager === 'function') {
      initializeDebtsPagination();
    }

    // Update pagination data
    if (debtsPaginationManager) {
      debtsPaginationManager.updateData(debtsToShow);
    } else {
      // Fallback to original rendering if pagination not available
      renderDebtsTable(debtsToShow);
    }
  } catch (error) {
    console.error('❌ Failed to load debts:', error);
    window.utils.showNotification('Failed to load debts', 'error');
    
    // Show empty table on error
    if (debtsPaginationManager) {
      debtsPaginationManager.updateData([]);
    } else {
      renderDebtsTable([]);
    }
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
    debt.paidAt = getNairobiIsoNow();
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
    window.forceStatsNext = true;
    if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
    if (window.currentSection === 'dashboard') {
      if (typeof window.createPaymentChart === 'function') window.createPaymentChart();
      if (typeof window.createWeeklyChart === 'function') window.createWeeklyChart();
    }

    window.utils.showNotification("Debt marked as paid! Sale record updated.");

    // Update sales table if visible
    if (window.currentSection === "sales" && typeof loadSalesData === "function") {
      loadSalesData();
    }
  }
}

async function deleteDebt(debtId) {
  try {
    if (!confirm("Are you sure you want to delete this debt record?")) {
      return;
    }

    await window.dataManager.deleteData("debts", debtId);

    // Update local array
    const debts = window.debts || [];
    window.debts = debts.filter((d) => d.id !== debtId);

    window.utils.showNotification("Debt deleted successfully!");
    loadDebtsData();
    window.forceStatsNext = true;
    if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
    if (window.currentSection === 'dashboard') {
      if (typeof window.createPaymentChart === 'function') window.createPaymentChart();
      if (typeof window.createWeeklyChart === 'function') window.createWeeklyChart();
    }

  } catch (error) {
    console.error('Error deleting debt:', error);
    window.utils.showNotification(`Failed to delete debt: ${error.message}`, 'error');
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
  // Compare Nairobi-local dates only (ignore time)
  const today = getNairobiDateString();
  const due = typeof debt.dueDate === 'string' ? debt.dueDate.slice(0,10) : getNairobiDateString(new Date(debt.dueDate));
  return due < today;
}

function getDaysUntilDue(debt) {
  // Compute difference in days based on Nairobi-local date-only values
  const todayStr = getNairobiDateString();
  const dueStr = typeof debt.dueDate === 'string' ? debt.dueDate.slice(0,10) : getNairobiDateString(new Date(debt.dueDate));
  const t = new Date(`${todayStr}T00:00:00+03:00`);
  const d = new Date(`${dueStr}T00:00:00+03:00`);
  const diffTime = d - t;
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
      const timePart = (debt.createdAt && debt.createdAt.includes('T')) ? debt.createdAt.split('T')[1].replace('Z','').substring(0,8) : '00:00:00';
      debt.createdAt = new Date(`${newDate}T${timePart}+03:00`).toISOString();
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
