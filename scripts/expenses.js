// Expenses management functions

let expenses = getFromStorage('expenses', []);

function addExpense(event) {
    event.preventDefault();
    
    const description = document.getElementById('expenseDescription').value;
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    
    // Input validation for amount
    if (isNaN(amount) || amount <= 0) {
        showNotification('Please enter a valid amount greater than zero.');
        return; // Exit the function if the amount is invalid
    }
    
    const expense = {
        id: generateId(),
        description,
        category,
        amount,
        createdAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
    };
    
    expenses.push(expense);
    saveToStorage('expenses', expenses);
    
    closeModal('expenseModal');
    showNotification('Expense added successfully!');
    
    if (currentSection === 'expenses') {
        loadExpensesData();
    }
    
    updateDashboardStats();
}


function loadExpensesData() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>${formatDate(expense.createdAt)}</td>
            <td>${expense.description}</td>
            <td>${expense.category}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>
                <button class="btn-small btn-danger" onclick="deleteExpense('${expense.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(e => e.id !== expenseId);
        saveToStorage('expenses', expenses);
        loadExpensesData();
        showNotification('Expense deleted successfully!');
        updateDashboardStats();
    }
}
