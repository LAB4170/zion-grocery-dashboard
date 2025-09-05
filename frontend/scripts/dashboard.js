// Dashboard data and charts management - FIXED VERSION
let paymentChart, weeklyChart;

// Use global variables for consistency - no redeclaration
// Access global variables directly from window object

// Utility function for currency formatting
function formatCurrency(amount) {
  return "KSh " + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

async function fetchDashboardData() {
  try {
    // Show loading indicator while fetching data
    if (window.socketIOSync) {
      window.socketIOSync.showLoadingIndicator(true);
    }
    
    // Use data manager for database-only operations
    if (window.dataManager && window.dataManager.isBackendAvailable) {
      console.log('📊 Loading dashboard data from database...');
      
      // Load all data from database
      window.sales = await window.dataManager.getSales();
      window.debts = await window.dataManager.getDebts();
      window.expenses = await window.dataManager.getExpenses();
      window.products = await window.dataManager.getProducts();
      
      console.log('✅ Dashboard data loaded from database');
    } else {
      console.warn('⚠️ Database not available, dashboard may show empty data');
      // Initialize empty arrays if database not available
      window.sales = [];
      window.debts = [];
      window.expenses = [];
      window.products = [];
    }

    loadDashboardData();
    
  } catch (error) {
    console.error('❌ Dashboard data fetch failed:', error);
    
    // Initialize empty arrays on error
    window.sales = [];
    window.debts = [];
    window.expenses = [];
    window.products = [];
    
    loadDashboardData();
  } finally {
    // Hide loading indicator
    if (window.socketIOSync) {
      window.socketIOSync.showLoadingIndicator(false);
    }
  }
}

function loadDashboardData() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded");
    return;
  }

  // Ensure all global variables are synchronized
  window.sales = window.sales || [];
  window.debts = window.debts || [];
  window.expenses = window.expenses || [];
  window.products = window.products || [];

  updateDashboardStats();
  updateInventoryOverview();
  updateDetailedInventory();
  createCharts();
}

function updateDashboardStats() {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // FIX: Use global variables consistently
  const sales = window.sales || [];
  const debts = window.debts || [];
  const expenses = window.expenses || [];
  const products = window.products || [];

  // Total sales
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalSalesElement = document.getElementById("total-sales");
  if (totalSalesElement)
    totalSalesElement.textContent = window.utils.formatCurrency(totalSales);

  // Cash sales
  const cashSales = sales
    .filter((s) => s.paymentMethod === "cash")
    .reduce((sum, sale) => sum + (sale.total || 0), 0);
  const cashTotalElement = document.getElementById("cash-total");
  if (cashTotalElement)
    cashTotalElement.textContent = window.utils.formatCurrency(cashSales);

  // M-Pesa sales (removed from dashboard but kept for payment distribution)
  const mpesaSales = sales
    .filter((s) => s.paymentMethod === "mpesa")
    .reduce((sum, sale) => sum + (sale.total || 0), 0);

  // Today's debts
  const todaysDebts = debts
    .filter((d) => d.date === today && d.status === "pending")
    .reduce((sum, debt) => sum + (debt.amount || 0), 0);
  const todaysDebtsElement = document.getElementById("todays-debts");
  if (todaysDebtsElement)
    todaysDebtsElement.textContent = window.utils.formatCurrency(todaysDebts);

  // Daily expenses
  const dailyExpenses = expenses
    .filter((e) => e.date === today)
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const dailyExpensesElement = document.getElementById("daily-expenses");
  if (dailyExpensesElement)
    dailyExpensesElement.textContent =
      window.utils.formatCurrency(dailyExpenses);

  // Monthly sales
  const monthlySales = sales
    .filter((s) => {
      const saleDate = new Date(s.createdAt);
      return (
        saleDate.getMonth() === currentMonth &&
        saleDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, sale) => sum + (sale.total || 0), 0);
  const monthlySalesElement = document.getElementById("monthly-sales");
  if (monthlySalesElement)
    monthlySalesElement.textContent = window.utils.formatCurrency(monthlySales);

  // Monthly expenses
  const monthlyExpenses = expenses
    .filter((e) => {
      const expenseDate = new Date(e.createdAt);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const monthlyExpensesElement = document.getElementById("monthly-expenses");
  if (monthlyExpensesElement)
    monthlyExpensesElement.textContent =
      window.utils.formatCurrency(monthlyExpenses);

  // Outstanding debt
  const outstandingDebt = debts
    .filter((d) => d.status === "pending")
    .reduce((sum, debt) => sum + (debt.amount || 0), 0);
  const outstandingDebtElement = document.getElementById("outstanding-debt");
  if (outstandingDebtElement)
    outstandingDebtElement.textContent =
      window.utils.formatCurrency(outstandingDebt);
}

function updateInventoryOverview() {
  const container = document.getElementById("inventoryOverview");
  if (!container) return;

  // FIX: Use consistent global variable access
  const products = window.products || [];

  const lowStockProducts = products.filter((p) => (p.stock || 0) <= 5);

  container.innerHTML =
    lowStockProducts.length > 0
      ? lowStockProducts
          .map(
            (product) => `
            <div class="inventory-item low-stock">
                <h4>${product.name || "Unknown Product"}</h4>
                <p>Stock: ${product.stock || 0}</p>
                <p class="warning">Low Stock!</p>
            </div>
        `
          )
          .join("")
      : '<p style="color: white;">All products have sufficient stock</p>';
}

function updateDetailedInventory() {
  const container = document.getElementById("detailedInventory");
  if (!container) return;

  // FIX: Use consistent global variable access
  const products = window.products || [];

  container.innerHTML = products
    .map(
      (product) => `
        <div class="inventory-item ${
          (product.stock || 0) <= 5 ? "low-stock" : ""
        }">
            <h4>${product.name || "Unknown Product"}</h4>
            <p>Category: ${product.category || "Uncategorized"}</p>
            <p>Price: ${window.utils.formatCurrency(product.price || 0)}</p>
            <p>Stock: ${product.stock || 0}</p>
        </div>
    `
    )
    .join("");
}

function createCharts() {
  createPaymentChart();
  createWeeklyChart();
}

function createPaymentChart() {
  const ctx = document.getElementById("paymentChart");
  if (!ctx) return;

  if (paymentChart) {
    paymentChart.destroy();
  }

  // FIX: Use consistent global variable access
  const sales = window.sales || [];

  const cashTotal = sales
    .filter((s) => s.paymentMethod === "cash")
    .reduce((sum, sale) => sum + (sale.total || 0), 0);
  const mpesaTotal = sales
    .filter((s) => s.paymentMethod === "mpesa")
    .reduce((sum, sale) => sum + (sale.total || 0), 0);
  const debtTotal = sales
    .filter((s) => s.paymentMethod === "debt")
    .reduce((sum, sale) => sum + (sale.total || 0), 0);

  paymentChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Cash", "M-Pesa", "Debt"],
      datasets: [
        {
          data: [cashTotal, mpesaTotal, debtTotal],
          backgroundColor: ["#4CAF50", "#2196F3", "#FF9800"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });
}

function createWeeklyChart() {
  const ctx = document.getElementById("weeklyChart");
  if (!ctx) return;

  if (weeklyChart) {
    weeklyChart.destroy();
  }

  // Get current week's dates (Monday to Sunday)
  const currentWeekDates = [];
  const salesByDay = [];

  // Get current date
  const today = new Date();

  // Find Monday of current week
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  // Generate current week's dates (Monday to Sunday)
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateString = date.toISOString().split("T")[0];

    // Format as "Mon 12/08" (day and date)
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateFormat = date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
    });
    currentWeekDates.push(`${dayName} ${dateFormat}`);

    // Calculate daily sales for this date - FIX: Use consistent global variable access
    const sales = window.sales || [];
    const dailySales = sales
      .filter((s) => {
        const saleDate = new Date(s.date || s.createdAt);
        return saleDate.toISOString().split("T")[0] === dateString;
      })
      .reduce((sum, sale) => sum + (sale.total || 0), 0);

    salesByDay.push(dailySales);
  }

  // Find maximum sales value to set appropriate scale
  const maxSales = Math.max(...salesByDay, 0);
  const yAxisMax = Math.ceil(maxSales / 100) * 100 + 100; // Round up to next 100

  weeklyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: currentWeekDates,
      datasets: [
        {
          label: "Daily Sales (KSh)",
          data: salesByDay,
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#4CAF50",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: yAxisMax,
          ticks: {
            stepSize: 100,
            color: "white",
            callback: function (value) {
              return "KSh " + value.toLocaleString();
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          ticks: {
            color: "white",
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "white",
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return "Sales: KSh " + context.parsed.y.toLocaleString();
            },
          },
        },
      },
      elements: {
        line: {
          borderWidth: 3,
        },
      },
    },
  });
}

// Export functions for global access
window.updateDashboardStats = updateDashboardStats;
window.updateInventoryOverview = updateInventoryOverview;
window.updateDetailedInventory = updateDetailedInventory;
window.fetchDashboardData = fetchDashboardData;
window.loadDashboardData = loadDashboardData;

// Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  fetchDashboardData();
  // TEMPORARILY DISABLED - Contributing to frequent requests
  // Set up periodic refresh (every 5 minutes)
  // setInterval(fetchDashboardData, 300000);
  console.log('📊 Dashboard loaded - auto-refresh disabled to prevent frequent requests');
});
