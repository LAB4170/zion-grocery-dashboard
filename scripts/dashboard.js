// Dashboard data and charts management
let paymentChart, weeklyChart;
let sales = []; // Declare sales only once
let debts = [];
let expenses = [];
let products = [];

// Utility function for currency formatting
function formatCurrency(amount) {
    return 'KSh ' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

async function fetchDashboardData() {
    try {
        const responses = await Promise.all([
            fetch('/api/sales'),
            fetch('/api/debts'),
            fetch('/api/expenses'),
            fetch('/api/products')
        ]);
        
        sales = await responses[0].json(); // Assigning value to existing sales variable
        debts = await responses[1].json();
        expenses = await responses[2].json();
        products = await responses[3].json();
        
        loadDashboardData();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show error to user
        alert('Failed to load dashboard data. Please try again later.');
    }
}

function loadDashboardData() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }
    
    updateDashboardStats();
    updateInventoryOverview();
    updateDetailedInventory();
    createCharts();
}

function updateDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Total sales
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('total-sales').textContent = formatCurrency(totalSales);
    
    // M-Pesa sales
    const mpesaSales = sales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('mpesa-total').textContent = formatCurrency(mpesaSales);
    
    // Cash sales
    const cashSales = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('cash-total').textContent = formatCurrency(cashSales);
    
    // Today's debts
    const todaysDebts = debts.filter(d => d.date === today && d.status === 'pending').reduce((sum, debt) => sum + debt.amount, 0);
    document.getElementById('todays-debts').textContent = formatCurrency(todaysDebts);
    
    // Daily expenses
    const dailyExpenses = expenses.filter(e => e.date === today).reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('daily-expenses').textContent = formatCurrency(dailyExpenses);
    
    // Monthly sales
    const monthlySales = sales.filter(s => {
        const saleDate = new Date(s.createdAt);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    }).reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('monthly-sales').textContent = formatCurrency(monthlySales);
    
    // Monthly expenses
    const monthlyExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.createdAt);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('monthly-expenses').textContent = formatCurrency(monthlyExpenses);
    
    // Outstanding debt
    const outstandingDebt = debts.filter(d => d.status === 'pending').reduce((sum, debt) => sum + debt.amount, 0);
    document.getElementById('outstanding-debt').textContent = formatCurrency(outstandingDebt);
}

function updateInventoryOverview() {
    const container = document.getElementById('inventoryOverview');
    if (!container) return;
    
    const lowStockProducts = products.filter(p => p.stock <= 5);
    
    container.innerHTML = lowStockProducts.length > 0 
        ? lowStockProducts.map(product => `
            <div class="inventory-item low-stock">
                <h4>${product.name}</h4>
                <p>Stock: ${product.stock}</p>
                <p class="warning">Low Stock!</p>
            </div>
        `).join('')
        : '<p style="color: white;">All products have sufficient stock</p>';
}

function updateDetailedInventory() {
    const container = document.getElementById('detailedInventory');
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="inventory-item ${product.stock <= 5 ? 'low-stock' : ''}">
            <h4>${product.name}</h4>
            <p>Category: ${product.category}</p>
            <p>Price: ${formatCurrency(product.price)}</p>
            <p>Stock: ${product.stock}</p>
        </div>
    `).join('');
}

function createCharts() {
    createPaymentChart();
    createWeeklyChart();
}

function createPaymentChart() {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;
    
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    const cashTotal = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
    const mpesaTotal = sales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0);
    const debtTotal = sales.filter(s => s.paymentMethod === 'debt').reduce((sum, sale) => sum + sale.total, 0);
    
    paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cash', 'M-Pesa', 'Debt'],
            datasets: [{
                data: [cashTotal, mpesaTotal, debtTotal],
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800']
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
}

function createWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    
    // Get last 7 days of sales data
    const last7Days = [];
    const salesByDay = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        last7Days.push(date.toLocaleDateString('en-KE', { weekday: 'short' }));
        const dailySales = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate.toISOString().split('T')[0] === dateString;
        }).reduce((sum, sale) => sum + sale.total, 0);
        salesByDay.push(dailySales);
    }
    
    weeklyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Sales',
                data: salesByDay,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    fetchDashboardData();
    // Set up periodic refresh (every 5 minutes)
    setInterval(fetchDashboardData, 300000);
});
