
let paymentChart, weeklyChart;

// Use global variables for consistency - no redeclaration
// Access global variables directly from window object

// Utility function for currency formatting
function formatCurrency(amount) {
  return "KSh " + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

async function fetchDashboardData() {
  console.log("📊 Initializing dashboard...");

  // Show loading indicator if available
  if (window.socketIOSync) {
    window.socketIOSync.showLoadingIndicator(true);
  }

  try {
    // Wait for DataManager initialization to complete
    if (window.dataManager) {
      console.log("⏳ Waiting for database connection...");
      await window.dataManager.initializationPromise;

      // Check if backend is available after initialization
      if (window.dataManager.isBackendAvailable) {
        console.log("📊 Loading dashboard data from database...");

        // Load all data from database with proper error handling
        const [salesResponse, debtsResponse, expensesResponse, productsResponse] = await Promise.allSettled([
          window.dataManager.getSales(),
          window.dataManager.getDebts(),
          window.dataManager.getExpenses(),
          window.dataManager.getProducts(),
        ]);

        // Process results and handle any individual failures - Extract data property from API responses
        window.sales = salesResponse.status === "fulfilled" ? (salesResponse.value?.data || salesResponse.value || []) : [];
        window.debts = debtsResponse.status === "fulfilled" ? (debtsResponse.value?.data || debtsResponse.value || []) : [];
        window.expenses = expensesResponse.status === "fulfilled" ? (expensesResponse.value?.data || expensesResponse.value || []) : [];
        window.products = productsResponse.status === "fulfilled" ? (productsResponse.value?.data || productsResponse.value || []) : [];

        // Log any individual failures
        if (salesResponse.status === "rejected")
          console.warn("⚠️ Failed to load sales:", salesResponse.reason);
        if (debtsResponse.status === "rejected")
          console.warn("⚠️ Failed to load debts:", debtsResponse.reason);
        if (expensesResponse.status === "rejected")
          console.warn("⚠️ Failed to load expenses:", expensesResponse.reason);
        if (productsResponse.status === "rejected")
          console.warn("⚠️ Failed to load products:", productsResponse.reason);

        console.log("✅ Dashboard data loaded from database");
        console.log("📊 Data summary:", {
          sales: window.sales.length,
          debts: window.debts.length,
          expenses: window.expenses.length,
          products: window.products.length
        });
      } else {
        throw new Error(
          "Database connection not available after initialization"
        );
      }
    } else {
      throw new Error("DataManager not initialized");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);

    // Show user-friendly error message
    showDatabaseConnectionError(error.message);

    // Initialize empty arrays as fallback
    window.sales = [];
    window.debts = [];
    window.expenses = [];
    window.products = [];
  }

  // Load dashboard UI regardless of data source
  loadDashboardData();

  // Hide loading indicator
  if (window.socketIOSync) {
    window.socketIOSync.showLoadingIndicator(false);
  }
}

// Enhanced error display function
function showDatabaseConnectionError(errorMessage) {
  const dashboardContainer =
    document.querySelector(".dashboard-content") ||
    document.querySelector("#dashboard") ||
    document.body;

  // Remove any existing error messages
  const existingError = dashboardContainer.querySelector(
    ".database-error-alert"
  );
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "alert alert-warning database-error-alert";
  errorDiv.style.cssText = `
    margin: 20px;
    padding: 15px;
    border: 1px solid #ffeaa7;
    background-color: #fff3cd;
    border-radius: 5px;
    color: #856404;
  `;

  errorDiv.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 10px;">
      <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
      <h4 style="margin: 0; color: #856404;">Database Connection Issue</h4>
    </div>
    <p style="margin: 10px 0;"><strong>Error:</strong> ${errorMessage}</p>
    <p style="margin: 10px 0;">The dashboard is running with limited functionality. Please verify:</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>PostgreSQL server is running (check services)</li>
      <li>Database 'zion_grocery_db' exists</li>
      <li>Connection credentials are correct in .env file</li>
      <li>Backend server is running on port 5000</li>
    </ul>
    <div style="margin-top: 15px;">
      <button onclick="retryDatabaseConnection()" style="
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
      ">🔄 Retry Connection</button>
      <button onclick="this.parentElement.parentElement.style.display='none'" style="
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">✕ Dismiss</button>
    </div>
  `;

  dashboardContainer.insertBefore(errorDiv, dashboardContainer.firstChild);
}

// Retry connection function
async function retryDatabaseConnection() {
  console.log("🔄 Retrying database connection...");

  // Show loading state
  const retryButton = document.querySelector(
    'button[onclick="retryDatabaseConnection()"]'
  );
  if (retryButton) {
    retryButton.innerHTML = "⏳ Connecting...";
    retryButton.disabled = true;
  }

  try {
    // Reinitialize DataManager
    if (window.dataManager) {
      window.dataManager.isBackendAvailable = false;
      window.dataManager.initializationPromise =
        window.dataManager.initialize();
    }

    // Retry dashboard data fetch
    await fetchDashboardData();

    // Remove error message if successful
    const errorAlert = document.querySelector(".database-error-alert");
    if (
      errorAlert &&
      window.dataManager &&
      window.dataManager.isBackendAvailable
    ) {
      errorAlert.remove();
    }
  } catch (error) {
    console.error("❌ Retry failed:", error.message);
  } finally {
    // Reset button state
    if (retryButton) {
      retryButton.innerHTML = "🔄 Retry Connection";
      retryButton.disabled = false;
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
  console.log(
    "📊 Dashboard loaded - auto-refresh disabled to prevent frequent requests"
  );
});
