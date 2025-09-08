// Fixed fetchDashboardData function for dashboard.js
async function fetchDashboardData() {
  console.log("📊 Initializing dashboard...");

  // Show loading indicator if available
  if (window.socketIOSync) {
    window.socketIOSync.showLoadingIndicator(true);
  }

  try {
    // Check if API client is available
    if (!window.apiClient) {
      throw new Error("API Client not available");
    }

    // Test API client health first
    console.log("🔍 Checking API client health...");
    const isHealthy = await window.apiClient.checkHealth();
    if (!isHealthy) {
      throw new Error("Database connection not available after initialization");
    }

    console.log("📊 Loading dashboard data from database...");

    // Use the correct API client methods directly
    const [salesResult, debtsResult, expensesResult, productsResult] =
      await Promise.allSettled([
        window.apiClient.getSales(),
        window.apiClient.getDebts(),
        window.apiClient.getExpenses(),
        window.apiClient.getProducts(),
      ]);

    // Process results and handle any individual failures
    window.sales = salesResult.status === "fulfilled" ? salesResult.value : [];
    window.debts = debtsResult.status === "fulfilled" ? debtsResult.value : [];
    window.expenses =
      expensesResult.status === "fulfilled" ? expensesResult.value : [];
    window.products =
      productsResult.status === "fulfilled" ? productsResult.value : [];

    // Log any individual failures
    if (salesResult.status === "rejected") {
      console.warn("⚠️ Failed to load sales:", salesResult.reason.message);
    }
    if (debtsResult.status === "rejected") {
      console.warn("⚠️ Failed to load debts:", debtsResult.reason.message);
    }
    if (expensesResult.status === "rejected") {
      console.warn(
        "⚠️ Failed to load expenses:",
        expensesResult.reason.message
      );
    }
    if (productsResult.status === "rejected") {
      console.warn(
        "⚠️ Failed to load products:",
        productsResult.reason.message
      );
    }

    console.log("✅ Dashboard data loaded from database");
    console.log("📊 Data summary:", {
      sales: window.sales.length,
      debts: window.debts.length,
      expenses: window.expenses.length,
      products: window.products.length,
    });
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

// Updated retry function to use correct API client methods
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
    // Test API client health
    const isHealthy = await window.apiClient.checkHealth();
    if (isHealthy) {
      // Retry dashboard data fetch
      await fetchDashboardData();

      // Remove error message if successful
      const errorAlert = document.querySelector(".database-error-alert");
      if (errorAlert) {
        errorAlert.remove();
      }
    } else {
      throw new Error("API client health check failed");
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
