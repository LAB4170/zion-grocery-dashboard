// Expenses management functions - FIXED VERSION

// Use global expenses variable for consistency - no redeclaration needed
// Access window.expenses directly to avoid conflicts

// Helper: current ISO timestamp based on Nairobi local time (UTC+03:00)
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

async function addExpense(event) {
  event.preventDefault();

  try {
    const description = document.getElementById("expenseDescription").value;
    const category = document.getElementById("expenseCategory").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);

    // Validation checks with user feedback
    if (!description || description.trim() === "") {
      window.utils.showNotification("Please enter an expense description", "error");
      return;
    }

    if (!category) {
      window.utils.showNotification("Please select a category", "error");
      return;
    }

    if (!amount || amount <= 0) {
      window.utils.showNotification("Please enter a valid amount", "error");
      return;
    }

    const expense = {
      description: description.trim(),
      category: category,
      amount: amount,
      createdBy: 'system',
      // Use Nairobi-local timestamp to avoid day shifting in reports
      createdAt: getNairobiIsoNow(),
      updatedAt: getNairobiIsoNow()
    };

    // DATABASE-FIRST OPERATION: Send to database first, then update cache
    const savedExpense = await window.dataManager.createData("expenses", expense);
    
    // Update global variable only after successful database save
    window.expenses = window.expenses || [];
    window.expenses.push(savedExpense?.data || savedExpense);

    // Force next dashboard stats fetch to bypass throttle/cache and update now
    window.forceStatsNext = true;
    if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
    if (window.currentSection === 'dashboard') {
      if (typeof window.createPaymentChart === 'function') window.createPaymentChart();
      if (typeof window.createWeeklyChart === 'function') window.createWeeklyChart();
    }

    // Close modal and refresh data
    closeModal("expenseModal");
    loadExpensesData();
    
    window.utils.showNotification("Expense added successfully!");

  } catch (error) {
    console.error("Failed to save expense:", error);
    
    // Provide specific error messages based on error type
    let errorMessage = "Failed to save expense. Please try again.";
    
    if (error.message.includes('Database connection')) {
      errorMessage = "Database connection error. Please check if the server is running.";
    } else if (error.message.includes('validation')) {
      errorMessage = "Invalid expense data. Please check all fields.";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Request timed out. Please try again.";
    }
    
    window.utils.showNotification(errorMessage, "error");
  }
}

async function loadExpensesData(filteredExpenses = null) {
  try {
    // If no filtered expenses provided, fetch from database
    if (!filteredExpenses) {
      console.log('📥 Loading expenses from database...');
      const result = await window.dataManager.getData("expenses");
      
      if (result && result.data) {
        window.expenses = result.data;
        console.log('✅ Expenses loaded from database:', window.expenses.length, 'items');
      } else {
        window.expenses = [];
        console.warn('⚠️ No expenses data received from database');
      }
    }

    const expensesToShow = filteredExpenses || window.expenses || [];
    
    const tbody = document.getElementById("expensesTableBody");
    if (!tbody) return;

    tbody.innerHTML = expensesToShow
      .map(
        (expense) => `
          <tr>
              <td>${window.utils.formatDate(expense.createdAt)}</td>
              <td>${expense.description || "No description"}</td>
              <td><span class="category-badge">${
                expense.category || "Uncategorized"
              }</span></td>
              <td>${window.utils.formatCurrency(expense.amount || 0)}</td>
              <td>
                  <button class="btn-small btn-danger" onclick="deleteExpense('${
                    expense.id
                  }')">Delete</button>
              </td>
          </tr>
      `
      )
      .join("");
  } catch (error) {
    console.error('❌ Failed to load expenses:', error);
    window.utils.showNotification('Failed to load expenses', 'error');
    
    // Show empty table on error
    const tbody = document.getElementById("expensesTableBody");
    if (tbody) tbody.innerHTML = "";
  }
}

async function deleteExpense(expenseId) {
  try {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    await window.dataManager.deleteData("expenses", expenseId);

    // Update local array
    const expenses = window.expenses || [];
    window.expenses = expenses.filter((e) => e.id !== expenseId);

    window.utils.showNotification("Expense deleted successfully!");
    loadExpensesData();

    // Force next dashboard stats fetch to bypass throttle/cache and update now
    window.forceStatsNext = true;
    if (typeof window.updateDashboardStats === "function") updateDashboardStats();
    if (window.currentSection === 'dashboard') {
      if (typeof window.createPaymentChart === 'function') window.createPaymentChart();
      if (typeof window.createWeeklyChart === 'function') window.createWeeklyChart();
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    window.utils.showNotification(`Failed to delete expense: ${error.message}`, 'error');
  }
}
