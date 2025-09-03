// Expenses management functions - FIXED VERSION

// Use global expenses variable for consistency - no redeclaration needed
// Access window.expenses directly to avoid conflicts

async function addExpense(event) {
  event.preventDefault();

  const description = document.getElementById("expenseDescription").value;
  const category = document.getElementById("expenseCategory").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);

  // Input validation for amount
  if (isNaN(amount) || amount <= 0) {
    window.utils.showNotification(
      "Please enter a valid amount greater than zero.",
      "error"
    );
    return; // Exit the function if the amount is invalid
  }

  const expense = {
    id: window.utils.generateId(),
    description,
    category,
    amount,
    createdAt: new Date().toISOString(),
    date: new Date().toISOString().split("T")[0],
  };

  // FIX: Use consistent global variable access
  window.expenses = window.expenses || [];
  window.expenses.push(expense);
  await window.dataManager.addData("expenses", expense);

  loadExpensesData();
  document.getElementById("expenseForm").reset();
  window.utils.closeModal("expenseModal");
  window.utils.showNotification("Expense added successfully!");

  if (window.currentSection === "expenses") {
    loadExpensesData();
  }

  // Update dashboard
  if (typeof window.updateDashboardStats === "function") {
    window.updateDashboardStats();
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
