// Global data storage
const data = {
    products: [],
    sales: [],
    expenses: [],
    debts: [],
    mpesaTransactions: []
};

// Initialize charts
let paymentChart = null;
let weeklyChart = null;

// Navigation with submenu support
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Add active class to clicked nav item
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Initialize charts if dashboard is selected
    if (sectionId === 'dashboard') {
        setTimeout(initializeCharts, 100);
    }
}

function toggleSubmenu(menuId) {
    const submenu = document.getElementById(menuId.replace('-management', '-submenu'));
    const arrow = document.getElementById('debt-arrow');
    
    if (submenu.classList.contains('show')) {
        submenu.classList.remove('show');
        arrow.textContent = '▼';
    } else {
        submenu.classList.add('show');
        arrow.textContent = '▲';
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    // Populate product dropdown if sales modal
    if (modalId === 'salesModal') {
        populateProductDropdown();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Reset forms when closing
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
    }
}

// Product management
function addProduct(event) {
    event.preventDefault();
    
    const product = {
        id: Date.now(),
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value)
    };
    
    data.products.push(product);
    renderProductsTable();
    updateDashboard();
    closeModal('productModal');
    event.target.reset();
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    data.products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>KSh ${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        data.products = data.products.filter(product => product.id !== id);
        renderProductsTable();
        updateDashboard();
    }
}

function populateProductDropdown() {
    const select = document.getElementById('saleProduct');
    select.innerHTML = '<option value="">Select Product</option>';
    
    data.products.forEach(product => {
        if (product.stock > 0) { // Only show products with stock
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - KSh ${product.price.toFixed(2)} (Stock: ${product.stock})`;
            option.style.background = '#2c3e50';
            option.style.color = 'white';
            select.appendChild(option);
        }
    });
}

// Sales management
document.getElementById('salePaymentMethod').addEventListener('change', function() {
    const method = this.value;
    const customerInfo = document.getElementById('customerInfoGroup');
    const customerPhone = document.getElementById('customerPhoneGroup');
    
    if (method === 'debt') {
        customerInfo.style.display = 'block';
        customerPhone.style.display = 'block';
        document.getElementById('customerName').required = true;
        document.getElementById('customerPhone').required = true;
    } else {
        customerInfo.style.display = 'none';
        customerPhone.style.display = 'none';
        document.getElementById('customerName').required = false;
        document.getElementById('customerPhone').required = false;
    }
});

function addSale(event) {
    event.preventDefault();
    
    const productId = parseInt(document.getElementById('saleProduct').value);
    const product = data.products.find(p => p.id === productId);
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const paymentMethod = document.getElementById('salePaymentMethod').value;
    
    if (!product) {
        alert('Please select a valid product');
        return;
    }
    
    if (product.stock < quantity) {
        alert('Insufficient stock available');
        return;
    }
    
    const total = product.price * quantity;
    const sale = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        productId: productId,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.price,
        total: total,
        paymentMethod: paymentMethod,
        status: paymentMethod === 'debt' ? 'pending' : 'completed',
        customerName: document.getElementById('customerName').value || '',
        customerPhone: document.getElementById('customerPhone').value || ''
    };
    
    // Update product stock
    product.stock -= quantity;
    
    // Add debt record if payment method is debt
    if (paymentMethod === 'debt') {
        const debt = {
            id: Date.now() + 1,
            date: new Date().toISOString().split('T')[0],
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            amount: total,
            status: 'pending',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
        };
        data.debts.push(debt);
        renderDebtsTable();
    }
    
    // Simulate M-Pesa transaction if payment method is mpesa
    if (paymentMethod === 'mpesa') {
        const mpesaTransaction = {
            id: 'MP' + Date.now(),
            date: new Date().toLocaleString(),
            amount: total,
            customerPhone: '254' + Math.floor(Math.random() * 1000000000),
            status: 'completed'
        };
        data.mpesaTransactions.push(mpesaTransaction);
        renderMpesaTable();
    }
    
    data.sales.push(sale);
    renderSalesTable();
    renderProductsTable();
    updateDashboard();
    closeModal('salesModal');
    event.target.reset();
}

function renderSalesTable() {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    
    data.sales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>KSh ${sale.unitPrice.toFixed(2)}</td>
            <td>KSh ${sale.total.toFixed(2)}</td>
            <td>${sale.paymentMethod.toUpperCase()}</td>
            <td><span class="${sale.status === 'completed' ? 'mpesa-status' : 'debt-status-pending'}">${sale.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="editSale(${sale.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteSale(${sale.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale?')) {
        const sale = data.sales.find(s => s.id === id);
        if (sale) {
            // Restore product stock
            const product = data.products.find(p => p.id === sale.productId);
            if (product) {
                product.stock += sale.quantity;
            }
        }
        data.sales = data.sales.filter(sale => sale.id !== id);
        renderSalesTable();
        renderProductsTable();
        updateDashboard();
    }
}

// Expense management
function addExpense(event) {
    event.preventDefault();
    
    const expense = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        description: document.getElementById('expenseDescription').value,
        category: document.getElementById('expenseCategory').value,
        amount: parseFloat(document.getElementById('expenseAmount').value)
    };
    
    data.expenses.push(expense);
    renderExpensesTable();
    updateDashboard();
    closeModal('expenseModal');
    event.target.reset();
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

// Debt management
function addDebt(event) {
    event.preventDefault();
    
    const debt = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        customerName: document.getElementById('debtCustomerName').value,
        customerPhone: document.getElementById('debtCustomerPhone').value,
        amount: parseFloat(document.getElementById('debtAmount').value),
        status: 'pending',
        dueDate: document.getElementById('debtDueDate').value
    };
    
    data.debts.push(debt);
    renderDebtsTable();
    updateDashboard();
    closeModal('debtModal');
    event.target.reset();
}

function renderDebtsTable() {
    const tbody = document.getElementById('debtsTableBody');
    tbody.innerHTML = '';
    
    data.debts.forEach(debt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${debt.date}</td>
            <td>${debt.customerName}</td>
            <td>${debt.customerPhone}</td>
            <td>KSh ${debt.amount.toFixed(2)}</td>
            <td><span class="debt-status-${debt.status}">${debt.status}</span></td>
            <td>${debt.dueDate}</td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="markDebtPaid(${debt.id})">Mark Paid</button>
                <button class="btn btn-danger btn-small" onclick="deleteDebt(${debt.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update grouped debts
    updateGroupedDebts();
}

function updateGroupedDebts() {
    const groupedDebtsContainer = document.getElementById('groupedDebtsContent');
    
    // Group debts by customer
    const groupedDebts = {};
    data.debts.filter(debt => debt.status === 'pending').forEach(debt => {
        const key = `${debt.customerName}_${debt.customerPhone}`;
        if (!groupedDebts[key]) {
            groupedDebts[key] = {
                customerName: debt.customerName,
                customerPhone: debt.customerPhone,
                debts: [],
                totalAmount: 0
            };
        }
        groupedDebts[key].debts.push(debt);
        groupedDebts[key].totalAmount += debt.amount;
    });
    
    // Filter customers with multiple debts
    const multipleDebts = Object.values(groupedDebts).filter(group => group.debts.length > 1);
    
    if (multipleDebts.length === 0) {
        groupedDebtsContainer.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">No customers with multiple pending debts found.</p>';
        return;
    }
    
    let html = '<h3 style="color: white; margin-bottom: 20px;">Customers with Multiple Pending Debts</h3>';
    html += '<table class="table"><thead><tr><th>Customer</th><th>Phone</th><th>Number of Debts</th><th>Total Amount</th><th>Actions</th></tr></thead><tbody>';
    
    multipleDebts.forEach(group => {
        html += `
            <tr>
                <td>${group.customerName}</td>
                <td>${group.customerPhone}</td>
                <td>${group.debts.length}</td>
                <td>KSh ${group.totalAmount.toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn btn-small" onclick="viewCustomerDebts('${group.customerName}', '${group.customerPhone}')">View Details</button>
                    <button class="btn btn-small" onclick="markAllCustomerDebtsPaid('${group.customerName}', '${group.customerPhone}')">Mark All Paid</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    groupedDebtsContainer.innerHTML = html;
}

function viewCustomerDebts(customerName, customerPhone) {
    const customerDebts = data.debts.filter(debt => 
        debt.customerName === customerName && 
        debt.customerPhone === customerPhone && 
        debt.status === 'pending'
    );
    
    let details = `Customer: ${customerName}\nPhone: ${customerPhone}\n\nPending Debts:\n`;
    customerDebts.forEach((debt, index) => {
        details += `${index + 1}. Date: ${debt.date}, Amount: KSh ${debt.amount.toFixed(2)}, Due: ${debt.dueDate}\n`;
    });
    
    alert(details);
}

function markAllCustomerDebtsPaid(customerName, customerPhone) {
    if (confirm(`Mark all debts for ${customerName} as paid?`)) {
        data.debts.forEach(debt => {
            if (debt.customerName === customerName && 
                debt.customerPhone === customerPhone && 
                debt.status === 'pending') {
                debt.status = 'paid';
            }
        });
        renderDebtsTable();
        updateDashboard();
    }
}

function markDebtPaid(id) {
    const debt = data.debts.find(d => d.id === id);
    if (debt) {
        debt.status = 'paid';
        renderDebtsTable();
        updateDashboard();
    }
}

function deleteDebt(id) {
    if (confirm('Are you sure you want to delete this debt record?')) {
        data.debts = data.debts.filter(debt => debt.id !== id);
        renderDebtsTable();
        updateDashboard();
    }
}

// M-Pesa management
function renderMpesaTable() {
    const tbody = document.getElementById('mpesaTableBody');
    tbody.innerHTML = '';
    
    data.mpesaTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.date}</td>
            <td>KSh ${transaction.amount.toFixed(2)}</td>
            <td>${transaction.customerPhone}</td>
            <td><span class="mpesa-status">${transaction.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-small" onclick="viewTransaction('${transaction.id}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function refreshMpesaTransactions() {
    // Simulate API call to fetch M-Pesa transactions
    alert('Fetching latest M-Pesa transactions from Pochi La Biashara (0117511337)...');
    
    // Simulate some new transactions
    const newTransactions = [
        {
            id: 'MP' + Date.now(),
            date: new Date().toLocaleString(),
            amount: Math.floor(Math.random() * 5000) + 100,
            customerPhone: '254' + Math.floor(Math.random() * 1000000000),
            status: 'completed'
        }
    ];
    
    data.mpesaTransactions.push(...newTransactions);
    renderMpesaTable();
    updateDashboard();
}

// Search functionality
function searchTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].textContent.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

// Dashboard updates
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate totals
    const totalSales = data.sales.reduce((sum, sale) => sum + sale.total, 0);
    const mpesaTotal = data.sales.filter(sale => sale.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0);
    const cashTotal = data.sales.filter(sale => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
    const todaysDebts = data.debts.filter(debt => debt.date === today).reduce((sum, debt) => sum + debt.amount, 0);
    const dailyExpenses = data.expenses.filter(expense => expense.date === today).reduce((sum, expense) => sum + expense.amount, 0);
    
    const monthlySales = data.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    }).reduce((sum, sale) => sum + sale.total, 0);
    
    const monthlyExpenses = data.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => sum + expense.amount, 0);
    
    const outstandingDebt = data.debts.filter(debt => debt.status === 'pending').reduce((sum, debt) => sum + debt.amount, 0);
    
    // Update dashboard stats
    document.getElementById('total-sales').textContent = `KSh ${totalSales.toFixed(2)}`;
    document.getElementById('mpesa-total').textContent = `KSh ${mpesaTotal.toFixed(2)}`;
    document.getElementById('cash-total').textContent = `KSh ${cashTotal.toFixed(2)}`;
    document.getElementById('todays-debts').textContent = `KSh ${todaysDebts.toFixed(2)}`;
    document.getElementById('daily-expenses').textContent = `KSh ${dailyExpenses.toFixed(2)}`;
    document.getElementById('monthly-sales').textContent = `KSh ${monthlySales.toFixed(2)}`;
    document.getElementById('monthly-expenses').textContent = `KSh ${monthlyExpenses.toFixed(2)}`;
    document.getElementById('outstanding-debt').textContent = `KSh ${outstandingDebt.toFixed(2)}`;
    
    // Update debt management stats
    document.getElementById('total-outstanding').textContent = `KSh ${outstandingDebt.toFixed(2)}`;
    document.getElementById('total-debtors').textContent = data.debts.filter(debt => debt.status === 'pending').length;
    
    const overdueDe = data.debts.filter(debt => 
        debt.status === 'pending' && new Date(debt.dueDate) < new Date()
    ).reduce((sum, debt) => sum + debt.amount, 0);
    document.getElementById('overdue-debts').textContent = `KSh ${overdueDe.toFixed(2)}`;
    
    // Update charts
    updateCharts();
}

// Chart functions
function initializeCharts() {
    const paymentCtx = document.getElementById('paymentChart').getContext('2d');
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    
    // Destroy existing charts
    if (paymentChart) paymentChart.destroy();
    if (weeklyChart) weeklyChart.destroy();
    
    // Payment distribution chart
    paymentChart = new Chart(paymentCtx, {
        type: 'pie',
        data: {
            labels: ['Cash', 'M-Pesa', 'Debts', 'Unresolved'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FF9800',
                    '#F44336'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
    
    // Weekly sales chart
    weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Total Sales',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4
            }, {
                label: 'Cash',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4
            }, {
                label: 'M-Pesa',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
    
    updateCharts();
}

function updateCharts() {
    if (!paymentChart || !weeklyChart) return;
    
    // Update payment distribution
    const cashTotal = data.sales.filter(sale => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
    const mpesaTotal = data.sales.filter(sale => sale.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0);
    const debtTotal = data.sales.filter(sale => sale.paymentMethod === 'debt').reduce((sum, sale) => sum + sale.total, 0);
    
    paymentChart.data.datasets[0].data = [cashTotal, mpesaTotal, debtTotal, 0];
    paymentChart.update();
    
    // Update weekly chart with sample data
    const weeklyData = generateWeeklyData();
    weeklyChart.data.datasets[0].data = weeklyData.total;
    weeklyChart.data.datasets[1].data = weeklyData.cash;
    weeklyChart.data.datasets[2].data = weeklyData.mpesa;
    weeklyChart.update();
}

function generateWeeklyData() {
    // Generate sample weekly data based on current sales
    const total = data.sales.reduce((sum, sale) => sum + sale.total, 0);
    const baseDaily = total / 30; // Assume 30 days average
    
    return {
        total: Array.from({length: 7}, () => Math.floor(Math.random() * baseDaily * 2)),
        cash: Array.from({length: 7}, () => Math.floor(Math.random() * baseDaily)),
        mpesa: Array.from({length: 7}, () => Math.floor(Math.random() * baseDaily))
    };
}

// Report functions
function generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = data.sales.filter(sale => sale.date === today);
    const todaysExpenses = data.expenses.filter(expense => expense.date === today);
    
    const totalSales = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const reportContent = `
        <h3 style="color: white;">Daily Report - ${today}</h3>
        <div style="color: white; line-height: 1.6;">
            <p><strong>Total Sales:</strong> KSh ${totalSales.toFixed(2)}</p>
            <p><strong>Total Expenses:</strong> KSh ${totalExpenses.toFixed(2)}</p>
            <p><strong>Net Profit:</strong> KSh ${(totalSales - totalExpenses).toFixed(2)}</p>
            <p><strong>Number of Transactions:</strong> ${todaysSales.length}</p>
            <hr style="border-color: rgba(255,255,255,0.3); margin: 20px 0;">
            <h4>Payment Method Breakdown:</h4>
            <p>Cash: KSh ${todaysSales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}</p>
            <p>M-Pesa: KSh ${todaysSales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}</p>
            <p>Debts: KSh ${todaysSales.filter(s => s.paymentMethod === 'debt').reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}</p>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

function generateWeeklyReport() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklySales = data.sales.filter(sale => new Date(sale.date) >= weekAgo);
    const weeklyExpenses = data.expenses.filter(expense => new Date(expense.date) >= weekAgo);
    
    const totalSales = weeklySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const reportContent = `
        <h3 style="color: white;">Weekly Report - Last 7 Days</h3>
        <div style="color: white; line-height: 1.6;">
            <p><strong>Total Sales:</strong> KSh ${totalSales.toFixed(2)}</p>
            <p><strong>Total Expenses:</strong> KSh ${totalExpenses.toFixed(2)}</p>
            <p><strong>Net Profit:</strong> KSh ${(totalSales - totalExpenses).toFixed(2)}</p>
            <p><strong>Number of Transactions:</strong> ${weeklySales.length}</p>
            <p><strong>Average Daily Sales:</strong> KSh ${(totalSales / 7).toFixed(2)}</p>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

function generateMonthlyReport() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlySales = data.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });
    
    const monthlyExpenses = data.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const totalSales = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const reportContent = `
        <h3 style="color: white;">Monthly Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <div style="color: white; line-height: 1.6;">
            <p><strong>Total Sales:</strong> KSh ${totalSales.toFixed(2)}</p>
            <p><strong>Total Expenses:</strong> KSh ${totalExpenses.toFixed(2)}</p>
            <p><strong>Net Profit:</strong> KSh ${(totalSales - totalExpenses).toFixed(2)}</p>
            <p><strong>Number of Transactions:</strong> ${monthlySales.length}</p>
            <p><strong>Outstanding Debts:</strong> KSh ${data.debts.filter(debt => debt.status === 'pending').reduce((sum, debt) => sum + debt.amount, 0).toFixed(2)}</p>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

function exportReport() {
    alert('Report export functionality would integrate with a PDF generation service in production.');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    setTimeout(initializeCharts, 500);
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}
