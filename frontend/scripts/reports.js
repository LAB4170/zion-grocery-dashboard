// Reports generation and management - FIXED VERSION

// Use Nairobi timezone (EAT) for "today" to match how sales dates are stored/displayed
function getNairobiDateString(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

async function generateDailyReport() {
  // Ensure backend data is loaded before generating
  try {
    if (window.dataManager) {
      const [salesRes, expensesRes, debtsRes] = await Promise.all([
        window.dataManager.getData("sales"),
        window.dataManager.getData("expenses"),
        window.dataManager.getData("debts")
      ]);
      window.sales = Array.isArray(salesRes?.data) ? salesRes.data : (window.sales || []);
      window.expenses = Array.isArray(expensesRes?.data) ? expensesRes.data : (window.expenses || []);
      window.debts = Array.isArray(debtsRes?.data) ? debtsRes.data : (window.debts || []);
    }
  } catch (e) {
    console.warn('Daily report: failed to refresh data from backend:', e?.message || e);
  }

  const today = getNairobiDateString();
  const sales = Array.isArray(window.sales) ? window.sales : [];
  const expenses = Array.isArray(window.expenses) ? window.expenses : [];
  const debts = Array.isArray(window.debts) ? window.debts : [];

  const todaySales = sales.filter((s) => s.date === today);
  const todayExpenses = expenses.filter((e) => e.date === today);
  const todayDebts = debts.filter((d) => d.date === today);

  const totalSales = todaySales.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0
  );
  const totalExpenses = todayExpenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );
  const totalDebts = todayDebts.reduce(
    (sum, debt) => sum + (debt.amount || 0),
    0
  );

  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  reportContent.innerHTML = `
        <div class="report">
            <h3>Daily Report - ${window.utils.formatDate(today)}</h3>
            <div class="report-stats">
                <div class="report-stat">
                    <h4>Sales Summary</h4>
                    <p>Total Sales: ${window.utils.formatCurrency(
                      totalSales
                    )}</p>
                    <p>Number of Transactions: ${todaySales.length}</p>
                    <p>Cash Sales: ${window.utils.formatCurrency(
                      todaySales
                        .filter((s) => s.paymentMethod === "cash")
                        .reduce((sum, s) => sum + (s.total || 0), 0)
                    )}</p>
                    <p>M-Pesa Sales: ${window.utils.formatCurrency(
                      todaySales
                        .filter((s) => s.paymentMethod === "mpesa")
                        .reduce((sum, s) => sum + (s.total || 0), 0)
                    )}</p>
                    <p>Credit Sales: ${window.utils.formatCurrency(
                      todaySales
                        .filter((s) => s.paymentMethod === "debt")
                        .reduce((sum, s) => sum + (s.total || 0), 0)
                    )}</p>
                </div>
                <div class="report-stat">
                    <h4>Expenses Summary</h4>
                    <p>Total Expenses: ${window.utils.formatCurrency(
                      totalExpenses
                    )}</p>
                    <p>Number of Expenses: ${todayExpenses.length}</p>
                </div>
                <div class="report-stat">
                    <h4>Net Profit</h4>
                    <p>Net Profit: ${window.utils.formatCurrency(
                      totalSales - totalExpenses
                    )}</p>
                </div>
            </div>
            <div class="report-details">
                <h4>Transaction Details</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${todaySales
                          .map(
                            (sale) => `
                            <tr>
                                <td>${
                                  sale.productName || "Unknown Product"
                                }</td>
                                <td>${sale.quantity || 0}</td>
                                <td>${window.utils.formatCurrency(
                                  sale.total || 0
                                )}</td>
                                <td>${(
                                  sale.paymentMethod || "unknown"
                                ).toUpperCase()}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function generateWeeklyReport() {
  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  try {
    const resp = await window.apiClient.getSalesWeekly();
    const weekly = resp && resp.data ? resp.data : null;
    if (!weekly || !Array.isArray(weekly.days)) {
      throw new Error('Unexpected weekly payload');
    }

    const totalSales = weekly.days.reduce((sum, d) => sum + (parseFloat(d.total_revenue) || 0), 0);

    reportContent.innerHTML = `
      <div class="report">
        <h3>Weekly Report - ${window.utils.formatDate(weekly.week.start)} to ${window.utils.formatDate(weekly.week.end)}</h3>
        <div class="report-stats">
          <div class="report-stat">
            <h4>Sales Summary</h4>
            <p>Total Sales: ${window.utils.formatCurrency(totalSales)}</p>
            <p>Average Daily Sales: ${window.utils.formatCurrency(totalSales / 7)}</p>
            <p>Number of Days: 7</p>
          </div>
        </div>
        <div class="report-details">
          <h4>Daily Breakdown</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              ${weekly.days.map(d => `
                <tr>
                  <td>${window.utils.formatDate(d.date)}</td>
                  <td>${window.utils.formatCurrency(parseFloat(d.total_revenue) || 0)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    console.error('Failed to generate weekly report:', e?.message || e);
    reportContent.innerHTML = `<p style="color:white;">Failed to load weekly report.</p>`;
  }
}

function generateMonthlyReport() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const sales = window.sales || [];
  const expenses = window.expenses || [];
  const products = window.products || [];

  const monthSales = sales.filter((s) => {
    const saleDate = new Date(s.createdAt);
    return (
      saleDate.getMonth() === currentMonth &&
      saleDate.getFullYear() === currentYear
    );
  });

  const monthExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.createdAt);
    return (
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear
    );
  });

  const totalSales = monthSales.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0
  );
  const totalExpenses = monthExpenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );

  // Group by product category
  const salesByCategory = monthSales.reduce((acc, sale) => {
    const product = products.find((p) => p.id === sale.productId);
    const category = product ? product.category : "unknown";
    acc[category] = (acc[category] || 0) + (sale.total || 0);
    return acc;
  }, {});

  // Group expenses by category
  const expensesByCategory = monthExpenses.reduce((acc, expense) => {
    const category = expense.category || "unknown";
    acc[category] = (acc[category] || 0) + (expense.amount || 0);
    return acc;
  }, {});

  const monthName = new Date().toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });

  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  reportContent.innerHTML = `
        <div class="report">
            <h3>Monthly Report - ${monthName}</h3>
            <div class="report-stats">
                <div class="report-stat">
                    <h4>Sales Summary</h4>
                    <p>Total Sales: ${window.utils.formatCurrency(
                      totalSales
                    )}</p>
                    <p>Number of Transactions: ${monthSales.length}</p>
                    <p>Average Transaction: ${window.utils.formatCurrency(
                      monthSales.length ? totalSales / monthSales.length : 0
                    )}</p>
                </div>
                <div class="report-stat">
                    <h4>Expenses Summary</h4>
                    <p>Total Expenses: ${window.utils.formatCurrency(
                      totalExpenses
                    )}</p>
                    <p>Number of Expenses: ${monthExpenses.length}</p>
                </div>
                <div class="report-stat">
                    <h4>Net Profit</h4>
                    <p>Monthly Net Profit: ${window.utils.formatCurrency(
                      totalSales - totalExpenses
                    )}</p>
                    <p>Profit Margin: ${
                      totalSales
                        ? (
                            ((totalSales - totalExpenses) / totalSales) *
                            100
                          ).toFixed(2)
                        : 0
                    }%</p>
                </div>
            </div>
            <div class="report-details">
                <h4>Sales by Category</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Sales Amount</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(salesByCategory)
                          .map(
                            ([category, amount]) => `
                            <tr>
                                <td>${category}</td>
                                <td>${window.utils.formatCurrency(amount)}</td>
                                <td>${
                                  totalSales
                                    ? ((amount / totalSales) * 100).toFixed(2)
                                    : 0
                                }%</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                
                <h4>Expenses by Category</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(expensesByCategory)
                          .map(
                            ([category, amount]) => `
                            <tr>
                                <td>${category}</td>
                                <td>${window.utils.formatCurrency(amount)}</td>
                                <td>${
                                  totalExpenses
                                    ? ((amount / totalExpenses) * 100).toFixed(
                                        2
                                      )
                                    : 0
                                }%</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function exportReport() {
  const reportContent = document.getElementById("reportContent");
  if (!reportContent || !reportContent.innerHTML.includes("report")) {
    window.utils.showNotification("Please generate a report first", "warning");
    return;
  }

  // Create a new window for printing
  const printWindow = window.open("", "", "height=600,width=800");
  printWindow.document.write(`
        <html>
            <head>
                <title>Zion Groceries Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report { max-width: 100%; }
                    .report-stats { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
                    .report-stat { flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; }
                    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f5f5f5; }
                    h3, h4 { color: #333; }
                </style>
            </head>
            <body>
                ${reportContent.innerHTML}
            </body>
        </html>
    `);
  printWindow.document.close();
  printWindow.print();

  window.utils.showNotification("Report exported for printing", "success");
}
