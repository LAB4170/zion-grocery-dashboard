let paymentChart, weeklyChart;
// Week navigation state (Monday-based)
let selectedWeekMonday = null; // Date object representing the Monday of the selected week

// Utility function for currency formatting
function formatCurrency(amount) {
  return "KSh " + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

// Helper accessors to normalize backend/Frontend field names
function getPaymentMethod(rec) {
  return rec.paymentMethod || rec.payment_method || rec.payment || rec.method || '';
}
function getTotalAmount(rec) {
  const n = Number(rec.total ?? rec.total_amount ?? rec.amount ?? 0);
  return Number.isFinite(n) ? n : 0;
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

        // Enhanced debugging for products response
        console.log("🔍 Debug - Raw productsResponse:", productsResponse);
        if (productsResponse.status === "fulfilled") {
          console.log("🔍 Debug - Products value:", productsResponse.value);
          console.log("🔍 Debug - Products value type:", typeof productsResponse.value);
          console.log("🔍 Debug - Products value.data:", productsResponse.value?.data);
        }

        // Process results and handle any individual failures - Extract data property from API responses
        // FIX: Ensure we extract arrays properly from API response structure
        window.sales = salesResponse.status === "fulfilled" ? 
          (Array.isArray(salesResponse.value?.data) ? salesResponse.value.data : 
           Array.isArray(salesResponse.value) ? salesResponse.value : []) : [];
        
        window.debts = debtsResponse.status === "fulfilled" ? 
          (Array.isArray(debtsResponse.value?.data) ? debtsResponse.value.data : 
           Array.isArray(debtsResponse.value) ? debtsResponse.value : []) : [];
        
        window.expenses = expensesResponse.status === "fulfilled" ? 
          (Array.isArray(expensesResponse.value?.data) ? expensesResponse.value.data : 
           Array.isArray(expensesResponse.value) ? expensesResponse.value : []) : [];
        
        window.products = productsResponse.status === "fulfilled" ? 
          (Array.isArray(productsResponse.value?.data) ? productsResponse.value.data : 
           Array.isArray(productsResponse.value) ? productsResponse.value : []) : [];

        // Additional debugging after assignment
        console.log("🔍 Debug - Final window.products:", window.products);
        console.log("🔍 Debug - Final window.products type:", typeof window.products);
        console.log("🔍 Debug - Final window.products is array:", Array.isArray(window.products));

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

async function loadDashboardData() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded");
    return;
  }

  try {
    console.log('📥 Rendering dashboard using existing in-memory data (no network calls)...');

    // Ensure globals are arrays (defensive)
    window.sales = Array.isArray(window.sales) ? window.sales : [];
    window.debts = Array.isArray(window.debts) ? window.debts : [];
    window.expenses = Array.isArray(window.expenses) ? window.expenses : [];
    window.products = Array.isArray(window.products) ? window.products : [];

    console.log('✅ Dashboard data (from memory):', {
      sales: window.sales.length,
      debts: window.debts.length,
      expenses: window.expenses.length,
      products: window.products.length
    });

    updateDashboardStats();
    updateInventoryOverview();
    updateDetailedInventory();
    createCharts();
  } catch (error) {
    console.error('❌ Failed to render dashboard:', error);

    // Fallback to empty arrays to prevent crashes
    window.sales = window.sales || [];
    window.debts = window.debts || [];
    window.expenses = window.expenses || [];
    window.products = window.products || [];

    updateDashboardStats();
    updateInventoryOverview();
    updateDetailedInventory();
    createCharts();
  }
}

async function updateDashboardStats() {
  // Use Nairobi local date (YYYY-MM-DD) to avoid UTC off-by-one
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const today = `${map.year}-${map.month}-${map.day}`;
  const nowEat = new Date(`${today}T00:00:00+03:00`);
  const currentMonth = nowEat.getMonth();
  const currentYear = nowEat.getFullYear();

  // Helper to mirror reports' effective date logic
  const effectiveSaleYmd = (s) => {
    const dateField = (typeof s.date === 'string' && s.date.length >= 10) ? s.date.slice(0,10) : null;
    const ts = s.createdAt || s.created_at;
    let fromTs = null;
    if (ts) {
      try {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
          const m = Object.fromEntries(p.map(pp => [pp.type, pp.value]));
          fromTs = `${m.year}-${m.month}-${m.day}`;
        }
      } catch {}
    }
    if (!dateField) return fromTs;
    if (!fromTs) return dateField;
    return (dateField !== fromTs) ? fromTs : dateField;
  };

  try {
    // Prefer server stats when available
    if (window.apiClient && typeof window.apiClient.getDashboardStats === 'function') {
      // Use UNTHROTTLED fetch if a force flag is set (e.g., right after CRUD), else throttled fetch
      const resp = (window.forceStatsNext === true)
        ? await window.apiClient.getDashboardStats()
        : await getDashboardStatsThrottled();
      // Clear the force flag after using it once
      if (window.forceStatsNext === true) window.forceStatsNext = false;
      const stats = resp && resp.data ? resp.data : null;
      if (stats && stats.sales && stats.expenses && stats.debts) {
        // CLIENT-FIRST ACCURACY: ensure in-memory arrays are present, then recompute tiles to match reports exactly
        try {
          await ensureSalesLoaded();
          const salesArr = Array.isArray(window.sales) ? window.sales : [];

          // Total sales (all-time) and Monthly Sales from client for instant accuracy
          let totalAll = 0, monthly = 0, cashToday = 0, mpesaToday = 0;
          for (const s of salesArr) {
            const amt = Number(s.total ?? s.total_amount ?? s.amount ?? 0) || 0;
            totalAll += amt;
            const ymd = effectiveSaleYmd(s);
            if (ymd) {
              if (ymd === today) {
                const pm = (s.paymentMethod || s.payment_method || s.payment || s.method || '').toString().toLowerCase();
                if (pm === 'cash') cashToday += amt;
                else if (pm === 'mpesa') mpesaToday += amt;
              }
              const d = new Date(`${ymd}T00:00:00+03:00`);
              if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) monthly += amt;
            }
          }
          const totalSalesElement2 = document.getElementById("total-sales");
          if (totalSalesElement2) totalSalesElement2.textContent = window.utils.formatCurrency(totalAll);
          const monthlySalesElement2 = document.getElementById("monthly-sales");
          if (monthlySalesElement2) monthlySalesElement2.textContent = window.utils.formatCurrency(monthly);
          const cashTotalElement = document.getElementById("cash-total");
          if (cashTotalElement) cashTotalElement.textContent = window.utils.formatCurrency(cashToday);
          const mpesaTotalElement = document.getElementById("mpesa-total");
          if (mpesaTotalElement) mpesaTotalElement.textContent = window.utils.formatCurrency(mpesaToday);

          // Today Debts and Daily Expenses from client if arrays available
          await Promise.all([ensureExpensesLoaded(), ensureDebtsLoaded()]);
          const exps = Array.isArray(window.expenses) ? window.expenses : [];
          const dbts = Array.isArray(window.debts) ? window.debts : [];
          const todayExp = exps.filter(e => (typeof e.date === 'string' ? e.date.slice(0,10) : (e.createdAt || e.created_at || '')).slice(0,10) === today)
                               .reduce((s,e)=> s + (Number(e.amount)||0), 0);
          const todayDeb = dbts.filter(d => (typeof d.date === 'string' ? d.date.slice(0,10) : (d.createdAt || d.created_at || '')).slice(0,10) === today)
                               .reduce((s,d)=> s + (Number(d.amount)||0), 0);
          const todaysDebtsElement2 = document.getElementById("todays-debts");
          if (todaysDebtsElement2) todaysDebtsElement2.textContent = window.utils.formatCurrency(todayDeb);
          const dailyExpensesElement2 = document.getElementById("daily-expenses");
          if (dailyExpensesElement2) dailyExpensesElement2.textContent = window.utils.formatCurrency(todayExp);
        } catch (__) {}

        // Done with server-provided stats
        return;
      }
    }
  } catch (e) {
    console.warn('Falling back to client-side dashboard stats due to error:', e?.message || e);
  }

  // Fallback path (no server stats): ensure TODAY's Cash and M‑Pesa are shown
  try {
    await ensureSalesLoaded();
    const cashEl = document.getElementById('cash-total');
    const mpesaEl = document.getElementById('mpesa-total');
    if (cashEl || mpesaEl) {
      const salesArr = Array.isArray(window.sales) ? window.sales : [];
      let cashToday = 0, mpesaToday = 0, totalAll = 0, monthly = 0;
      for (const s of salesArr) {
        const amt = Number(s.total ?? s.total_amount ?? s.amount ?? 0) || 0;
        totalAll += amt;
        const ymd = effectiveSaleYmd(s);
        if (ymd) {
          if (ymd === today) {
            const pm = (s.paymentMethod || s.payment_method || s.payment || s.method || '').toString().toLowerCase();
            if (pm === 'cash') cashToday += amt;
            else if (pm === 'mpesa') mpesaToday += amt;
          }
          const d = new Date(`${ymd}T00:00:00+03:00`);
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) monthly += amt;
        }
      }
      const totalSalesElement = document.getElementById('total-sales');
      if (totalSalesElement) totalSalesElement.textContent = window.utils.formatCurrency(totalAll);
      const monthlySalesElement = document.getElementById('monthly-sales');
      if (monthlySalesElement) monthlySalesElement.textContent = window.utils.formatCurrency(monthly);
      if (cashEl) cashEl.textContent = window.utils.formatCurrency(cashToday);
      if (mpesaEl) mpesaEl.textContent = window.utils.formatCurrency(mpesaToday);
    }

    // Client-side Today Debts & Expenses
    await Promise.all([ensureExpensesLoaded(), ensureDebtsLoaded()]);
    const exps = Array.isArray(window.expenses) ? window.expenses : [];
    const dbts = Array.isArray(window.debts) ? window.debts : [];
    const todayExp = exps.filter(e => (typeof e.date === 'string' ? e.date.slice(0,10) : (e.createdAt || e.created_at || '')).slice(0,10) === today)
                         .reduce((s,e)=> s + (Number(e.amount)||0), 0);
    const todayDeb = dbts.filter(d => (typeof d.date === 'string' ? d.date.slice(0,10) : (d.createdAt || d.created_at || '')).slice(0,10) === today)
                         .reduce((s,d)=> s + (Number(d.amount)||0), 0);
    const todaysDebtsElement2 = document.getElementById("todays-debts");
    if (todaysDebtsElement2) todaysDebtsElement2.textContent = window.utils.formatCurrency(todayDeb);
    const dailyExpensesElement2 = document.getElementById("daily-expenses");
    if (dailyExpensesElement2) dailyExpensesElement2.textContent = window.utils.formatCurrency(todayExp);
  } catch (_) {}

  // Any additional UI updates...
}

// ---- Single-flight loaders to avoid duplicate requests ----
window.__salesLoadPromise = null;
window.__productsLoadPromise = null;
window.__expensesLoadPromise = null;
window.__debtsLoadPromise = null;
async function ensureSalesLoaded() {
  if (Array.isArray(window.sales) && window.sales.length > 0) return;
  if (window.__salesLoadPromise) return window.__salesLoadPromise;
  if (!window.dataManager) return;
  window.__salesLoadPromise = window.dataManager.getData('sales')
    .then(res => {
      const raw = Array.isArray(res?.data) ? res.data : [];
      window.sales = (typeof window.normalizeSale === 'function') ? raw.map(window.normalizeSale) : raw;
    })
    .catch(e => console.warn('ensureSalesLoaded failed:', e?.message || e))
    .finally(() => { setTimeout(() => { window.__salesLoadPromise = null; }, 0); });
  return window.__salesLoadPromise;
}
async function ensureProductsLoaded() {
  if (Array.isArray(window.products) && window.products.length > 0) return;
  if (window.__productsLoadPromise) return window.__productsLoadPromise;
  if (!window.dataManager) return;
  window.__productsLoadPromise = window.dataManager.getData('products')
    .then(res => { window.products = Array.isArray(res?.data) ? res.data : []; })
    .catch(e => console.warn('ensureProductsLoaded failed:', e?.message || e))
    .finally(() => { setTimeout(() => { window.__productsLoadPromise = null; }, 0); });
  return window.__productsLoadPromise;
}
async function ensureExpensesLoaded() {
  if (Array.isArray(window.expenses) && window.expenses.length > 0) return;
  if (window.__expensesLoadPromise) return window.__expensesLoadPromise;
  if (!window.dataManager) return;
  window.__expensesLoadPromise = window.dataManager.getData('expenses')
    .then(res => { window.expenses = Array.isArray(res?.data) ? res.data : []; })
    .catch(e => console.warn('ensureExpensesLoaded failed:', e?.message || e))
    .finally(() => { setTimeout(() => { window.__expensesLoadPromise = null; }, 0); });
  return window.__expensesLoadPromise;
}
async function ensureDebtsLoaded() {
  if (Array.isArray(window.debts) && window.debts.length > 0) return;
  if (window.__debtsLoadPromise) return window.__debtsLoadPromise;
  if (!window.dataManager) return;
  window.__debtsLoadPromise = window.dataManager.getData('debts')
    .then(res => { window.debts = Array.isArray(res?.data) ? res.data : []; })
    .catch(e => console.warn('ensureDebtsLoaded failed:', e?.message || e))
    .finally(() => { setTimeout(() => { window.__debtsLoadPromise = null; }, 0); });
  return window.__debtsLoadPromise;
}

function updateInventoryOverview() {
  const container = document.getElementById("inventoryOverview");
  if (!container) return;

  // FIX: Use consistent global variable access with defensive programming
  let products = window.products || [];
  
  // Debug logging to identify the issue
  console.log('🔍 Debug - Products in updateInventoryOverview:', products);
  console.log('🔍 Debug - Type:', typeof products);
  console.log('🔍 Debug - Is array:', Array.isArray(products));
  
  // Ensure products is always an array
  if (!Array.isArray(products)) {
    console.warn('⚠️ Products is not an array. Converting to array or using empty array.');
    // If products is an object with a data property, use that
    if (products && products.data && Array.isArray(products.data)) {
      products = products.data;
    } else if (products && typeof products === 'object') {
      // If it's an object, try to extract array values
      products = Object.values(products).filter(item => item && typeof item === 'object');
    } else {
      // Fallback to empty array
      products = [];
    }
  }

  const lowStockProducts = products.filter((p) => (p.stockQuantity || 0) <= 5);

  container.innerHTML =
    lowStockProducts.length > 0
      ? lowStockProducts
          .map(
            (product) => `
            <div class="inventory-item low-stock">
                <h4>${product.name || "Unknown Product"}</h4>
                <p>Stock: ${product.stockQuantity || 0}</p>
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

  // FIX: Use consistent global variable access with defensive programming
  let products = window.products || [];
  
  // Debug logging to identify the issue
  console.log('🔍 Debug - Products in updateDetailedInventory:', products);
  console.log('🔍 Debug - Type:', typeof products);
  console.log('🔍 Debug - Is array:', Array.isArray(products));
  
  // Ensure products is always an array
  if (!Array.isArray(products)) {
    console.warn('⚠️ Products is not an array. Converting to array or using empty array.');
    // If products is an object with a data property, use that
    if (products && products.data && Array.isArray(products.data)) {
      products = products.data;
    } else if (products && typeof products === 'object') {
      // If it's an object, try to extract array values
      products = Object.values(products).filter(item => item && typeof item === 'object');
    } else {
      // Fallback to empty array
      products = [];
    }
  }

  container.innerHTML = products
    .map(
      (product) => `
        <div class="inventory-item ${
          (product.stockQuantity || 0) <= 5 ? "low-stock" : ""
        }">
            <h4>${product.name || "Unknown Product"}</h4>
            <p>Category: ${product.category || "Uncategorized"}</p>
            <p>Price: ${window.utils.formatCurrency(product.price || 0)}</p>
            <p>Stock: ${product.stockQuantity || 0}</p>
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

  // Use normalized accessors for accurate distribution
  const cashTotal = sales
    .filter((s) => getPaymentMethod(s) === "cash")
    .reduce((sum, s) => sum + getTotalAmount(s), 0);
  const mpesaTotal = sales
    .filter((s) => getPaymentMethod(s) === "mpesa")
    .reduce((sum, s) => sum + getTotalAmount(s), 0);
  const debtTotal = sales
    .filter((s) => getPaymentMethod(s) === "debt")
    .reduce((sum, s) => sum + getTotalAmount(s), 0);

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

  // Build Monday–Sunday labels for the selected or current week
  const today = new Date();
  const base = selectedWeekMonday ? new Date(selectedWeekMonday) : (function () {
    const d = new Date();
    const dow = d.getDay(); // 0=Sun,1=Mon
    const offset = (dow === 0) ? -6 : (1 - dow);
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  // Use Nairobi timezone for day keys to match how dates are stored/displayed
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateKey = (d) => {
    const parts = fmt.formatToParts(d);
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`; // YYYY-MM-DD
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });

  const labels = days.map(d => dateKey(d));

  // Source data from in-memory sales (already normalized by sales.js)
  const sales = Array.isArray(window.sales) ? window.sales : [];

  // Initialize series
  const totalSeries = Array(7).fill(0);
  const cashSeries = Array(7).fill(0);
  const mpesaSeries = Array(7).fill(0);
  const debtSeries = Array(7).fill(0);

  // Index labels for quick lookup
  const indexByDate = new Map(labels.map((d, i) => [d, i]));

  for (const s of sales) {
    const v = s.date ?? s.createdAt ?? s.created_at;
    let date = null;
    if (v instanceof Date) {
      date = dateKey(v);
    } else if (typeof v === 'string') {
      date = v.slice(0,10);
    }
    if (!date) continue;
    const idx = indexByDate.get(date);
    if (idx === undefined) continue; // not in this week

    const amt = getTotalAmount(s);
    totalSeries[idx] += amt;
    const pm = (getPaymentMethod(s) || '').toLowerCase();
    if (pm === 'cash') cashSeries[idx] += amt;
    else if (pm === 'mpesa') mpesaSeries[idx] += amt;
    else if (pm === 'debt') debtSeries[idx] += amt;
  }

  // Update week label if present
  const weekLabelEl = document.getElementById('weekRangeLabel') || document.getElementById('weekLabel');
  if (weekLabelEl) {
    const start = labels[0];
    const end = labels[6];
    weekLabelEl.textContent = `${start} → ${end}`;
  }

  // Ensure chart container has some height to render
  try {
    const container = ctx.closest('.chart-container');
    if (container && (!container.style.height || container.clientHeight < 120)) {
      container.style.minHeight = '260px';
    }
  } catch (_) {}

  // Debug: log series to help diagnose empty lines
  try {
    const sum = arr => arr.reduce((a, b) => a + b, 0);
    console.log('📈 Weekly chart debug:', {
      labels,
      totals: { total: sum(totalSeries), cash: sum(cashSeries), mpesa: sum(mpesaSeries), debt: sum(debtSeries) },
      salesCount: sales.length
    });
  } catch (_) {}

  // Render multi-line chart
  weeklyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.map(d => window.utils ? window.utils.formatDate(d) : d),
      datasets: [
        {
          label: 'Total Sales',
          data: totalSeries,
          borderColor: '#E53935', // red
          backgroundColor: 'rgba(229,57,53,0.15)',
          tension: 0.2,
          fill: false,
        },
        {
          label: 'Cash',
          data: cashSeries,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76,175,80,0.15)',
          tension: 0.2,
          fill: false,
        },
        {
          label: 'M-Pesa',
          data: mpesaSeries,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33,150,243,0.15)',
          tension: 0.2,
          fill: false,
        },
        {
          label: 'Debt',
          data: debtSeries,
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255,152,0,0.15)',
          tension: 0.2,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: 'white' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: 'white',
            callback: function (value) {
              try { return 'KSh ' + Number(value).toLocaleString(); } catch (_) { return value; }
            }
          },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      plugins: {
        legend: {
          labels: { color: 'white' }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.parsed.y || 0;
              return `${context.dataset.label}: KSh ${val.toLocaleString()}`;
            }
          }
        }
      },
      elements: { line: { borderWidth: 3 } }
    }
  });
}

// Throttling controls for dashboard API calls (configurable via CONFIG)
const DASHBOARD_THROTTLE_MS = (window.CONFIG && window.CONFIG.DASHBOARD_THROTTLE_MS) ? window.CONFIG.DASHBOARD_THROTTLE_MS : 15000; // default 15s
const WEEKLY_THROTTLE_MS = (window.CONFIG && window.CONFIG.WEEKLY_THROTTLE_MS) ? window.CONFIG.WEEKLY_THROTTLE_MS : 15000; // default 15s
let _lastStatsFetchAt = 0;
let _lastWeeklyFetchAt = 0;
let _statsInFlight = null;
let _weeklyInFlight = null;

// Small in-memory cache for last successful dashboard stats (60s TTL)
const DASHBOARD_STATS_CACHE_TTL_MS = 60000; // 60 seconds
let _statsCache = { data: null, ts: 0 };

// Weekly data cache (60s TTL)
const WEEKLY_CACHE_TTL_MS = 60000; // 60 seconds
let _weeklyCache = { data: null, ts: 0 };

async function getDashboardStatsThrottled() {
  const now = Date.now();
  if (_statsInFlight) {
    return _statsInFlight;
  }
  const since = now - _lastStatsFetchAt;
  if (since < DASHBOARD_THROTTLE_MS) {
    // Serve cached if available; otherwise wait until throttle window elapses then fetch
    if (_statsCache.data && (now - _statsCache.ts) < DASHBOARD_STATS_CACHE_TTL_MS) {
      return Promise.resolve({ data: _statsCache.data, fromCache: true });
    }
    const wait = Math.max(0, DASHBOARD_THROTTLE_MS - since);
    return new Promise(resolve => setTimeout(() => resolve(getDashboardStatsThrottled()), wait));
  }
  _lastStatsFetchAt = now;
  _statsInFlight = window.apiClient.getDashboardStats()
    .then(resp => {
      // Update cache on successful fetch
      const stats = resp && resp.data ? resp.data : null;
      if (stats) {
        _statsCache = { data: stats, ts: Date.now() };
      }
      return resp;
    })
    .catch(err => {
      // If rate-limited or other transient error, fall back to cache (if any)
      if (_statsCache.data && (Date.now() - _statsCache.ts) < DASHBOARD_STATS_CACHE_TTL_MS) {
        console.warn('Stats request failed; serving cached data:', err?.message || err);
        return { data: _statsCache.data, fromCache: true };
      }
      throw err;
    })
    .finally(() => {
      _statsInFlight = null;
    });
  return _statsInFlight;
}

async function getWeeklySalesThrottled() {
  const now = Date.now();
  if (_weeklyInFlight) {
    return _weeklyInFlight;
  }
  const since = now - _lastWeeklyFetchAt;
  if (since < WEEKLY_THROTTLE_MS) {
    // Serve cached weekly if available; otherwise wait until throttle window elapses then fetch
    if (_weeklyCache.data && (now - _weeklyCache.ts) < WEEKLY_CACHE_TTL_MS) {
      return Promise.resolve({ data: _weeklyCache.data, fromCache: true });
    }
    const wait = Math.max(0, WEEKLY_THROTTLE_MS - since);
    return new Promise(resolve => setTimeout(() => resolve(getWeeklySalesThrottled()), wait));
  }
  _lastWeeklyFetchAt = now;
  _weeklyInFlight = window.apiClient.getSalesWeekly()
    .then(resp => {
      const weekly = resp && resp.data ? resp.data : null;
      if (weekly) {
        _weeklyCache = { data: weekly, ts: Date.now() };
      }
      return resp;
    })
    .catch(err => {
      if (_weeklyCache.data && (Date.now() - _weeklyCache.ts) < WEEKLY_CACHE_TTL_MS) {
        console.warn('Weekly request failed; serving cached data:', err?.message || err);
        return { data: _weeklyCache.data, fromCache: true };
      }
      throw err;
    })
    .finally(() => {
      _weeklyInFlight = null;
    });
  return _weeklyInFlight;
}

// Week navigation controls
function prevWeek() {
  // Move selectedWeekMonday back by 7 days
  if (!selectedWeekMonday) {
    // Initialize to current week Monday first
    const init = new Date();
    const dow = init.getDay(); // 0=Sun,1=Mon
    const offset = (dow === 0) ? -6 : (1 - dow);
    selectedWeekMonday = new Date(init);
    selectedWeekMonday.setDate(init.getDate() + offset);
  }
  selectedWeekMonday = new Date(selectedWeekMonday.getFullYear(), selectedWeekMonday.getMonth(), selectedWeekMonday.getDate() - 7);
  createWeeklyChart();
}

function nextWeek() {
  if (!selectedWeekMonday) {
    const init = new Date();
    const dow = init.getDay();
    const offset = dow === 0 ? -6 : 1 - dow;
    selectedWeekMonday = new Date(init);
    selectedWeekMonday.setDate(init.getDate() + offset);
  }
  selectedWeekMonday = new Date(selectedWeekMonday.getFullYear(), selectedWeekMonday.getMonth(), selectedWeekMonday.getDate() + 7);
  createWeeklyChart();
}

function thisWeek() {
  selectedWeekMonday = null;
  createWeeklyChart();
}

// Export functions for global access
window.updateDashboardStats = updateDashboardStats;
window.updateInventoryOverview = updateInventoryOverview;
window.updateDetailedInventory = updateDetailedInventory;
window.fetchDashboardData = fetchDashboardData;
window.loadDashboardData = loadDashboardData;
window.prevWeek = prevWeek;
window.nextWeek = nextWeek;
window.thisWeek = thisWeek;
// New: export chart functions so other modules can refresh immediately
window.createPaymentChart = createPaymentChart;
window.createWeeklyChart = createWeeklyChart;

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

// ==== Auto-refresh at Nairobi midnight (EAT) ====
(function setupMidnightEATScheduler() {
  if (window.__midnightEATSchedulerInitialized) return;
  window.__midnightEATSchedulerInitialized = true;

  function getNairobiYMD(d = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(d);
    const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${m.year}-${m.month}-${m.day}`;
  }

  function msUntilNextMidnightEAT() {
    const todayYMD = getNairobiYMD();
    const next = new Date(`${todayYMD}T00:00:00+03:00`);
    // If already past today's midnight, move to next day midnight
    const now = new Date();
    while (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    return next.getTime() - now.getTime();
  }

  function refreshDashboardNow() {
    try {
      if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
      if (window.currentSection === 'dashboard') {
        if (typeof window.createPaymentChart === 'function') window.createPaymentChart();
        if (typeof window.createWeeklyChart === 'function') window.createWeeklyChart();
      }
    } catch (e) {
      console.warn('Midnight EAT refresh failed:', e?.message || e);
    }
  }

  function scheduleNext() {
    const wait = msUntilNextMidnightEAT();
    // Safety cap: if calculation is weird, default to 1 hour
    const delay = Number.isFinite(wait) && wait > 0 ? wait : 60 * 60 * 1000;
    setTimeout(() => {
      refreshDashboardNow();
      // After first tick, repeat every 24h
      setInterval(refreshDashboardNow, 24 * 60 * 60 * 1000);
    }, delay);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    scheduleNext();
  } else {
    window.addEventListener('load', scheduleNext, { once: true });
  }
})();
// ==== End midnight scheduler ====
