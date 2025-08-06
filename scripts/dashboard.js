// Chart instances
let paymentChart = null;
let weeklyChart = null;

// DOM Element IDs that actually exist in your HTML
const EXISTING_ELEMENTS = [
    'total-sales', 'mpesa-total', 'cash-total', 'todays-debts',
    'daily-expenses', 'monthly-sales', 'monthly-expenses',
    'outstanding-debt', 'paymentChart', 'weeklyChart'
];

// Enhanced fetch data function
function fetchData() {
    try {
        const salesData = localStorage.getItem('salesData');
        const debtsData = localStorage.getItem('debtsData');
        const expensesData = localStorage.getItem('expensesData');

        return {
            sales: salesData ? safeJsonParse(salesData) : [],
            debts: debtsData ? safeJsonParse(debtsData) : [],
            expenses: expensesData ? safeJsonParse(expensesData) : []
        };
    } catch (error) {
        console.error('Error fetching data from localStorage:', error);
        return { sales: [], debts: [], expenses: [] };
    }
}

// Safe JSON parsing
function safeJsonParse(data) {
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('Error parsing JSON:', e);
        return [];
    }
}

// Dashboard updates
function updateDashboard() {
    try {
        const data = fetchData();
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Calculate totals with proper fallbacks
        const totals = calculateTotals(data, today, currentMonth, currentYear);
        
        // Update only the elements that exist in the DOM
        updateElementText('total-sales', formatCurrency(totals.totalSales));
        updateElementText('mpesa-total', formatCurrency(totals.mpesaTotal));
        updateElementText('cash-total', formatCurrency(totals.cashTotal));
        updateElementText('todays-debts', formatCurrency(totals.todaysDebts));
        updateElementText('daily-expenses', formatCurrency(totals.dailyExpenses));
        updateElementText('monthly-sales', formatCurrency(totals.monthlySales));
        updateElementText('monthly-expenses', formatCurrency(totals.monthlyExpenses));
        updateElementText('outstanding-debt', formatCurrency(totals.outstandingDebt));
        
        // Update charts
        updateCharts(data);
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Calculate all totals in one function
function calculateTotals(data, today, currentMonth, currentYear) {
    return {
        totalSales: calculateTotal(data.sales),
        mpesaTotal: calculatePaymentTotal(data.sales, 'mpesa'),
        cashTotal: calculatePaymentTotal(data.sales, 'cash'),
        todaysDebts: calculateDailyTotal(data.debts, today),
        dailyExpenses: calculateDailyTotal(data.expenses, today),
        monthlySales: calculateMonthlyTotal(data.sales, currentMonth, currentYear),
        monthlyExpenses: calculateMonthlyTotal(data.expenses, currentMonth, currentYear),
        outstandingDebt: calculateOutstandingDebt(data.debts)
    };
}

// Helper calculation functions
function calculateTotal(items = []) {
    return items.reduce((sum, item) => sum + (Number(item?.total) || 0), 0);
}

function calculatePaymentTotal(sales = [], method) {
    return sales.filter(sale => sale?.paymentMethod === method)
               .reduce((sum, sale) => sum + (Number(sale?.total) || 0), 0);
}

function calculateDailyTotal(items = [], date) {
    return items.filter(item => item?.date === date)
               .reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
}

function calculateMonthlyTotal(items = [], month, year) {
    return items.filter(item => {
        try {
            const itemDate = new Date(item?.date);
            return itemDate.getMonth() === month && itemDate.getFullYear() === year;
        } catch {
            return false;
        }
    }).reduce((sum, item) => sum + (Number(item?.amount || item?.total) || 0), 0);
}

function calculateOutstandingDebt(debts = []) {
    return debts.filter(debt => debt?.status === 'pending')
               .reduce((sum, debt) => sum + (Number(debt?.amount) || 0), 0);
}

function formatCurrency(amount) {
    return `KSh ${Number(amount).toFixed(2)}`;
}

// Enhanced element text updater
function updateElementText(elementId, text) {
    try {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        } else if (EXISTING_ELEMENTS.includes(elementId)) {
            console.warn(`Element ${elementId} not found but expected in HTML`);
        }
    } catch (error) {
        console.error(`Error updating element ${elementId}:`, error);
    }
}

// Chart functions
function initializeCharts() {
    try {
        const paymentCanvas = document.getElementById('paymentChart');
        const weeklyCanvas = document.getElementById('weeklyChart');
        
        if (!paymentCanvas || !weeklyCanvas) {
            console.error('Chart canvases not found');
            return;
        }
        
        // Destroy existing charts
        if (paymentChart) paymentChart.destroy();
        if (weeklyChart) weeklyChart.destroy();
        
        // Payment distribution chart
        paymentChart = new Chart(paymentCanvas.getContext('2d'), getPaymentChartConfig());
        
        // Weekly sales chart
        weeklyChart = new Chart(weeklyCanvas.getContext('2d'), getWeeklyChartConfig());
        
        updateCharts(fetchData());
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

function getPaymentChartConfig() {
    return {
        type: 'pie',
        data: {
            labels: ['Cash', 'M-Pesa', 'Debts', 'Unresolved'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#F44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                },
                title: {
                    display: true,
                    text: 'Payment Distribution',
                    color: 'white',
                    font: {
                        size: 16
                    }
                }
            }
        }
    };
}

function getWeeklyChartConfig() {
    return {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Total Sales',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Cash',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'M-Pesa',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                },
                title: {
                    display: true,
                    text: 'Weekly Sales Trends',
                    color: 'white',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    };
}

function updateCharts(data) {
    try {
        if (!paymentChart || !weeklyChart) return;
        
        // Update payment distribution
        const cashTotal = calculatePaymentTotal(data.sales, 'cash');
        const mpesaTotal = calculatePaymentTotal(data.sales, 'mpesa');
        const debtTotal = calculatePaymentTotal(data.sales, 'debt');
        
        paymentChart.data.datasets[0].data = [cashTotal, mpesaTotal, debtTotal, 0];
        paymentChart.update();
        
        // Update weekly chart
        const weeklyData = getWeeklySalesData(data);
        weeklyChart.data.datasets[0].data = weeklyData.total;
        weeklyChart.data.datasets[1].data = weeklyData.cash;
        weeklyChart.data.datasets[2].data = weeklyData.mpesa;
        weeklyChart.update();
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function getWeeklySalesData(data) {
    const result = {
        total: [0, 0, 0, 0, 0, 0, 0],
        cash: [0, 0, 0, 0, 0, 0, 0],
        mpesa: [0, 0, 0, 0, 0, 0, 0]
    };
    
    try {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);

        data.sales?.forEach(sale => {
            try {
                const saleDate = new Date(sale?.date);
                saleDate.setHours(0, 0, 0, 0);
                
                if (saleDate >= startOfWeek && saleDate <= now) {
                    const dayIndex = (saleDate.getDay() + 6) % 7;
                    const amount = Number(sale?.total) || 0;
                    
                    result.total[dayIndex] += amount;
                    
                    if (sale?.paymentMethod === 'cash') {
                        result.cash[dayIndex] += amount;
                    } else if (sale?.paymentMethod === 'mpesa') {
                        result.mpesa[dayIndex] += amount;
                    }
                }
            } catch (e) {
                console.error('Error processing sale:', sale, e);
            }
        });
    } catch (error) {
        console.error('Error generating weekly sales data:', error);
    }
    
    return result;
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    updateDashboard();
});

// Make functions available globally
window.updateDashboard = updateDashboard;
window.initializeCharts = initializeCharts;
