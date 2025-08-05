// Expense Management with Auto-Save
function addExpense(event) {
    event.preventDefault();
    
    const form = event.target;
    const editingId = form.dataset.editingId;
    
    // Validate inputs
    const description = document.getElementById('expenseDescription').value.trim();
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    
    if (!description || !category || isNaN(amount)) {
        alert('Please fill all fields with valid values');
        return;
    }
    
    if (amount <= 0) {
        alert('Expense amount must be positive');
        return;
    }

    const expenseData = {
        date: new Date().toISOString().split('T')[0],
        description: description,
        category: category,
        amount: amount
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
    data.save(); // Auto-save to LocalStorage
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
    
    // Sort expenses by date (newest first)
    const sortedExpenses = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach(expense => {
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
        data.save(); // Auto-save to LocalStorage
    }
}
