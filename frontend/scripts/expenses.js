// Expenses management functions - FIXED VERSION

// Use global expenses variable for consistency - no redeclaration needed
// Access window.expenses directly to avoid conflicts

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
      id: window.utils.generateId(),
      description: description.trim(),
      category: category,
      amount: amount,
      created_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // DATABASE-FIRST OPERATION: Send to database first, then update cache
    const savedExpense = await window.dataManager.createData("expenses", expense);
    
    // Update global variable only after successful database save
    window.expenses = window.expenses || [];
    window.expenses.push(savedExpense);

    // Close modal and refresh data
    closeModal("expenseModal");
    loadExpensesData();
    
    // Update dashboard if visible
    if (typeof updateDashboardStats === "function") {
      updateDashboardStats();
    }

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

function loadExpensesData() {
  const tbody = document.getElementById("expensesTableBody");
  if (!tbody) return;

  // FIX: Use consistent global variable access
  const expenses = window.expenses || [];

  tbody.innerHTML = expenses
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
}

async function deleteExpense(expenseId) {
  if (confirm("Are you sure you want to delete this expense?")) {
    // FIX: Use consistent global variable access
    window.expenses = (window.expenses || []).filter((e) => e.id !== expenseId);
    await window.dataManager.removeData("expenses", expenseId);
    loadExpensesData();
    window.utils.showNotification("Expense deleted successfully!");

    // Update dashboard
    if (typeof window.updateDashboardStats === "function") {
      window.updateDashboardStats();
    }
  }
}
