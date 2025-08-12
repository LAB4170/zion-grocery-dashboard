// Expenses management functions

// Use global expenses variable for consistency
let expenses = window.expenses || [];

function addExpense(event) {
    event.preventDefault();
    
    const description = document.getElementById('expenseDescription').value;
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    
    // Input validation for amount
    if (isNaN(amount) || amount <= 0) {
        window.utils.showNotification('Please enter a valid amount greater than zero.', 'error');
        return; // Exit the function if the amount is invalid
    }
    
    const expense = {
        id: window.utils.generateId(),
        description,
        category,
        amount,
        createdAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
    };
    
    expenses.push(expense);
    window.expenses = expenses;
    window.utils.saveToStorage('expenses', expenses);
    
    window.utils.closeModal('expenseModal');
    window.utils.showNotification('Expense added successfully!');
    
    if (window.currentSection === 'expenses') {
        loadExpensesData();
    }
    
    // Update dashboard
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}


function loadExpensesData() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    
    // Sync with global variables
    expenses = window.expenses || [];
    
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>${window.utils.formatDate(expense.createdAt)}</td>
            <td>${expense.description || 'No description'}</td>
            <td><span class="category-badge">${expense.category || 'Uncategorized'}</span></td>
            <td>${window.utils.formatCurrency(expense.amount || 0)}</td>
            <td>
                <button class="btn-small btn-danger" onclick="deleteExpense('${expense.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(e => e.id !== expenseId);
        window.utils.saveToStorage('expenses', expenses);
        loadExpensesData();
        window.utils.showNotification('Expense deleted successfully!');
        updateDashboardStats();
    }
}
