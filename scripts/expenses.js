// Expense management
function addExpense(event) {
    event.preventDefault();
    
    const form = event.target;
    const editingId = form.dataset.editingId;
    
    const expenseData = {
        date: new Date().toISOString().split('T')[0],
        description: document.getElementById('expenseDescription').value,
        category: document.getElementById('expenseCategory').value,
        amount: parseFloat(document.getElementById('expenseAmount').value)
    };
    
    if (editingId) {
        // Update existing expense
        const expenseIndex = data.expenses.findIndex(e => e.id === parseInt(editingId));
        if (expenseIndex !== -1) {
            data.expenses[expenseIndex] = { 
                ...data.expenses[expenseIndex], 
                ...expenseData 
            };
        }
        
        // Reset the editing state
        delete form.dataset.editingId;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Add Expense';
    } else {
        // Add new expense
        const expense = {
            id: Date.now(),
            ...expenseData
        };
        data.expenses.push(expense);
    }
    
    renderExpensesTable();
    updateDashboard();
    closeModal('expenseModal');
    form.reset();
}

function editExpense(id) {
    const expense = data.expenses.find(e => e.id === id);
    if (!expense) return;

    // Populate the form fields
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('expenseAmount').value = expense.amount;

    // Store the expense ID in the form dataset
    const form = document.querySelector('#expenseModal form');
    form.dataset.editingId = id;

    // Change button text
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Expense';

    openModal('expenseModal');
}

function renderExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    tbody.innerHTML = '';
    
    data.expenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.description}</td>
            <td>${expense.category}</td>
            <td>KSh ${expense.amount.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="editExpense(${expense.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteExpense(${expense.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        data.expenses = data.expenses.filter(expense => expense.id !== id);
        renderExpensesTable();
        updateDashboard();
    }
}
