// Chart instances
let paymentChart = null;
let weeklyChart = null;

// Fetch data from local storage
function fetchData() {
    const salesData = localStorage.getItem('salesData');
    const debtsData = localStorage.getItem('debtsData');
    const expensesData = localStorage.getItem('expensesData');

    return {
        sales: salesData ? JSON.parse(salesData) : [],
        debts: debtsData ? JSON.parse(debtsData) : [],
        expenses: expensesData ? JSON.parse(expensesData) : []
    };
}

// Dashboard updates
function updateDashboard() {
    const data = fetchData(); // Fetch data from local storage
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
    
    const overdueDebts = data.debts.filter(debt => 
        debt.status === 'pending' && new Date(debt.dueDate) < new Date()
    ).reduce((sum, debt) => sum + debt.amount, 0);
    document.getElementById('overdue-debts').textContent = `KSh ${overdueDebts.toFixed(2)}`;
    
    // Update charts
    updateCharts(data);
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

function updateCharts(data) {
    if (!paymentChart || !weeklyChart) return;
    
    // Update payment distribution
    const cashTotal = data.sales.filter(sale => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
    const mpesaTotal = data.sales.filter(sale => sale.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0);
    const debtTotal = data.sales.filter(sale => sale.paymentMethod === 'debt').reduce((sum, sale) => sum + sale.total, 0);
    
    paymentChart.data.datasets[0].data = [cashTotal, mpesaTotal, debtTotal, 0];
    paymentChart.update();
    
    // Update weekly chart with actual data
    const weeklyData = getWeeklySalesData(data);
    weeklyChart.data.datasets[0].data = weeklyData.total;
    weeklyChart.data.datasets[1].data = weeklyData.cash;
    weeklyChart.data.datasets[2].data = weeklyData.mpesa;
    weeklyChart.update();
}

function getWeeklySalesData(data) {
    // Get dates for the current week (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust to Monday
    startOfWeek.setHours(0, 0, 0, 0); // Start of day
    
    // Initialize result arrays
    const result = {
        total: [0, 0, 0, 0, 0, 0, 0],
        cash: [0, 0, 0, 0, 0, 0, 0],
        mpesa: [0, 0, 0, 0, 0, 0, 0]
    };
    
    // Process each sale
    data.sales.forEach(sale => {
        try {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0, 0, 0, 0); // Normalize time
            
            // Check if sale is within the current week
            if (saleDate >= startOfWeek && saleDate <= now) {
                const dayIndex = (saleDate.getDay() + 6) % 7; // Convert to 0 (Mon) to 6 (Sun)
                
                // Add to totals
                result.total[dayIndex] += sale.total;
                
                // Add to payment method specific totals
                if (sale.paymentMethod === 'cash') {
                    result.cash[dayIndex] += sale.total;
                } else if (sale.paymentMethod === 'mpesa') {
                    result.mpesa[dayIndex] += sale.total;
                }
            }
        } catch (e) {
            console.error('Error processing sale:', sale, e);
        }
    });
    
    return result;
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    updateDashboard();
});

// Make sure these functions are available globally if needed by other scripts
window.updateDashboard = updateDashboard;
window.initializeCharts = initializeCharts;
