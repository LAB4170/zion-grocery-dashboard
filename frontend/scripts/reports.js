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
  const reportContent = document.getElementById("reportContent");
  if (reportContent) {
    reportContent.innerHTML = '<div style="color:white;">Loading daily report…</div>';
  }
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
  // Track current report type
  window.currentReportType = 'daily';
}

async function generateWeeklyReport() {
  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  // Loading UI
  reportContent.innerHTML = '<div style="color:white;">Loading weekly report…</div>';

  try {
    const [salesResp, expensesResp] = await Promise.all([
      window.apiClient.getSalesWeekly(),
      typeof window.apiClient.getWeeklyExpenses === 'function' ? window.apiClient.getWeeklyExpenses() : Promise.resolve({ data: null })
    ]);

    const weekly = salesResp && salesResp.data ? salesResp.data : null;
    if (!weekly || !Array.isArray(weekly.days)) {
      throw new Error('Unexpected weekly payload');
    }

    const totalSales = weekly.days.reduce((sum, d) => sum + (parseFloat(d.total_revenue) || 0), 0);

    const weeklyExp = expensesResp && expensesResp.data ? expensesResp.data : null;
    const totalExpenses = Array.isArray(weeklyExp?.days)
      ? weeklyExp.days.reduce((sum, d) => sum + (parseFloat(d.total_amount) || 0), 0)
      : 0;
    const weeklyNet = totalSales - totalExpenses;

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
          ${Array.isArray(weeklyExp?.days) ? `
          <div class="report-stat">
            <h4>Expenses Summary</h4>
            <p>Total Expenses: ${window.utils.formatCurrency(totalExpenses)}</p>
            <p>Average Daily Expenses: ${window.utils.formatCurrency(totalExpenses / 7)}</p>
          </div>` : ''}
          ${Array.isArray(weeklyExp?.days) ? `
          <div class="report-stat">
            <h4>Net</h4>
            <p>Weekly Net (Sales - Expenses): ${window.utils.formatCurrency(weeklyNet)}</p>
          </div>` : ''}
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
          ${Array.isArray(weeklyExp?.days) ? `
          <h4>Daily Expenses</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Expenses</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyExp.days.map(d => `
                <tr>
                  <td>${window.utils.formatDate(d.date)}</td>
                  <td>${window.utils.formatCurrency(parseFloat(d.total_amount) || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : ''}
        </div>
      </div>
    `;
  } catch (e) {
    console.error('Failed to generate weekly report:', e?.message || e);
    reportContent.innerHTML = `<div style="color:#ffcccc;background:#550000;padding:10px;border-radius:6px;">Failed to load weekly report: ${e?.message || 'Unknown error'}</div>`;
  }
  // Track current report type
  window.currentReportType = 'weekly';
}

function generateMonthlyReport() {
  const reportContent = document.getElementById("reportContent");
  if (reportContent) {
    reportContent.innerHTML = '<div style="color:white;">Loading monthly report…</div>';
  }
  // Respect month/year selectors if present
  const monthSel = document.getElementById('monthSelector');
  const yearSel = document.getElementById('yearSelector');
  const current = new Date();
  const selectedMonth = monthSel && monthSel.value !== '' ? parseInt(monthSel.value) : current.getMonth();
  const selectedYear = yearSel && yearSel.value !== '' ? parseInt(yearSel.value) : current.getFullYear();

  const sales = Array.isArray(window.sales) ? window.sales : [];
  const expenses = Array.isArray(window.expenses) ? window.expenses : [];
  const products = Array.isArray(window.products) ? window.products : [];

  // Prefer stable s.date (YYYY-MM-DD); fallback to createdAt
  const monthSales = sales.filter((s) => {
    const dateStr = s.date || s.createdAt || s.created_at;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const monthExpenses = expenses.filter((e) => {
    const dateStr = e.date || e.createdAt || e.created_at;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalSales = monthSales.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0
  );
  const totalExpenses = monthExpenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );
  const monthlyNet = totalSales - totalExpenses;

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

  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString("en-KE", { month: "long", year: "numeric" });

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
                      monthlyNet
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
                
                ${(() => {
                  // Top products and slow movers (by revenue)
                  const byProduct = new Map();
                  monthSales.forEach(s => {
                    const id = s.productId || s.product_id;
                    const name = s.productName || (products.find(p => p.id === id)?.name) || 'Unknown';
                    const rev = (s.total || 0);
                    const qty = (s.quantity || 0);
                    if (!byProduct.has(name)) byProduct.set(name, { revenue: 0, quantity: 0 });
                    const agg = byProduct.get(name);
                    agg.revenue += rev;
                    agg.quantity += qty;
                  });
                  const items = Array.from(byProduct.entries()).map(([name, v]) => ({ name, ...v }));
                  const top = items.sort((a,b) => b.revenue - a.revenue).slice(0, 5);
                  const slow = items.slice().sort((a,b) => a.revenue - b.revenue).slice(0, 5);
                  const topRows = top.map(i => `<tr><td>${i.name}</td><td>${window.utils.formatCurrency(i.revenue)}</td><td>${i.quantity}</td></tr>`).join('');
                  const slowRows = slow.map(i => `<tr><td>${i.name}</td><td>${window.utils.formatCurrency(i.revenue)}</td><td>${i.quantity}</td></tr>`).join('');
                  return `
                  <h4>Top Products (by Revenue)</h4>
                  <table class="table">
                    <thead><tr><th>Product</th><th>Revenue</th><th>Qty</th></tr></thead>
                    <tbody>${topRows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
                  </table>
                  <h4>Slow Movers</h4>
                  <table class="table">
                    <thead><tr><th>Product</th><th>Revenue</th><th>Qty</th></tr></thead>
                    <tbody>${slowRows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
                  </table>`;
                })()}
                
                ${(() => {
                  // Low stock section via dashboard stats (backend authority)
                  return `<div id="lowStockSection"></div>`;
                })()}
            </div>
        </div>
    `;
  // After rendering, fetch low stock and fill section
  (async () => {
    try {
      if (window.apiClient && typeof window.apiClient.getDashboardStats === 'function') {
        const resp = await window.apiClient.getDashboardStats();
        const low = resp?.data?.inventory?.low_stock_products || [];
        const mount = document.getElementById('lowStockSection');
        if (mount) {
          mount.innerHTML = `
            <h4>Low Stock Alerts</h4>
            <table class="table">
              <thead><tr><th>Product</th><th>Category</th><th>Stock</th></tr></thead>
              <tbody>
                ${low.map(p => `<tr><td>${p.name}</td><td>${p.category || ''}</td><td>${p.stock}</td></tr>`).join('') || '<tr><td colspan="3">No low stock items</td></tr>'}
              </tbody>
            </table>`;
        }
      }
    } catch (e) {
      const mount = document.getElementById('lowStockSection');
      if (mount) mount.innerHTML = '<div style="color:#ffcc00;">Low stock data unavailable.</div>';
    }
  })();
  // Track current report type
  window.currentReportType = 'monthly';
}

async function generateAnnualReport() {
  // Ensure fresh sales from backend
  try {
    if (window.dataManager) {
      const salesRes = await window.dataManager.getData("sales");
      window.sales = Array.isArray(salesRes?.data) ? salesRes.data : (window.sales || []);
    }
  } catch (e) {
    console.warn('Annual report: failed to refresh sales:', e?.message || e);
  }

  const yearSel = document.getElementById('yearSelector');
  const current = new Date();
  const selectedYear = yearSel && yearSel.value !== '' ? parseInt(yearSel.value) : current.getFullYear();

  const sales = Array.isArray(window.sales) ? window.sales : [];

  // Build monthly totals Jan..Dec
  const monthlyTotals = Array.from({ length: 12 }, (_, m) => {
    const total = sales
      .filter(s => {
        const dateStr = s.date || s.createdAt || s.created_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getFullYear() === selectedYear && d.getMonth() === m;
      })
      .reduce((sum, s) => sum + (s.total || 0), 0);
    return total;
  });

  const yearTotal = monthlyTotals.reduce((a, b) => a + b, 0);

  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  const monthLabels = Array.from({ length: 12 }, (_, m) => new Date(selectedYear, m, 1).toLocaleDateString('en-KE', { month: 'long' }));

  reportContent.innerHTML = `
    <div class="report">
      <h3>Annual Sales Report - ${selectedYear}</h3>
      <div class="report-stats">
        <div class="report-stat">
          <h4>Year Summary</h4>
          <p>Total Sales: ${window.utils.formatCurrency(yearTotal)}</p>
          <p>Average Monthly: ${window.utils.formatCurrency(yearTotal / 12)}</p>
        </div>
      </div>
      <div class="report-details">
        <h4>Monthly Breakdown</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Sales</th>
            </tr>
          </thead>
          <tbody>
            ${monthLabels.map((label, idx) => `
              <tr>
                <td>${label}</td>
                <td>${window.utils.formatCurrency(monthlyTotals[idx])}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  // Track current report type
  window.currentReportType = 'annual';
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

// Provide the functions referenced by the reports partial
function exportToPDF() {
  // For now, reuse the print/export flow; can be replaced with real PDF export later
  exportReport();
}

function exportToExcel() {
  // Use CSV export for Excel compatibility
  exportToCSV();
}

// Export visible report tables to CSV
function exportToCSV() {
  const container = document.getElementById('reportContent');
  if (!container || !container.innerHTML.includes('report')) {
    window.utils.showNotification('Please generate a report first', 'warning');
    return;
  }
  const tables = container.querySelectorAll('table');
  if (!tables.length) {
    window.utils.showNotification('No tabular data to export', 'warning');
    return;
  }
  const lines = [];
  tables.forEach((table, idx) => {
    if (idx > 0) lines.push(''); // blank line between tables
    const rows = table.querySelectorAll('tr');
    rows.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(td => {
        const text = (td.textContent || '').replace(/\r?\n|\r/g, ' ').trim();
        // escape quotes
        const safe = '"' + text.replace(/"/g, '""') + '"';
        return safe;
      });
      lines.push(cells.join(','));
    });
  });
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const title = document.querySelector('#reportContent h3')?.textContent || 'report';
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.replace(/\s+/g,'_').toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  window.utils.showNotification('CSV exported', 'success');
}

// Initialize controls for reports (populate year selector)
function initReportsControls() {
  try {
    const yearSel = document.getElementById('yearSelector');
    const monthSel = document.getElementById('monthSelector');
    if (!yearSel) return;

    // Only populate once
    if (yearSel.options && yearSel.options.length > 1) return;

    // Build a set of available years from sales data if present
    const years = new Set();
    if (Array.isArray(window.sales)) {
      window.sales.forEach(s => {
        const dateStr = s.date || s.createdAt || s.created_at;
        if (!dateStr) return;
        const y = new Date(dateStr).getFullYear();
        if (!isNaN(y)) years.add(y);
      });
    }

    const currentYear = new Date().getFullYear();
    let yearList = Array.from(years).sort((a,b) => a-b);
    // Fallback: last 6 years including current if sales didn't provide
    if (yearList.length === 0) {
      yearList = Array.from({ length: 6 }, (_, i) => currentYear - (5 - i));
    }

    // Preserve the "Select Year" placeholder at index 0
    const keepFirst = yearSel.querySelector('option[value=""]');
    yearSel.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Year';
    yearSel.appendChild(placeholder);

    yearList.forEach(y => {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSel.appendChild(opt);
    });

    // Pre-select current year if none chosen
    const current = new Date();
    if (!yearSel.value) {
      const yOpt = [...yearSel.options].find(o => o.value === String(current.getFullYear()));
      if (yOpt) yearSel.value = yOpt.value;
    }

    // Pre-select current month if available and none chosen
    if (monthSel && !monthSel.value) {
      const m = String(current.getMonth()); // matches 0..11 values in options
      const mOpt = [...monthSel.options].find(o => o.value === m);
      if (mOpt) monthSel.value = mOpt.value;
    }

    // Attach change listeners to auto-refresh appropriate report
    const handleChange = () => {
      const mode = window.currentReportType;
      if (mode === 'annual' && typeof window.generateAnnualReport === 'function') {
        window.generateAnnualReport();
      } else if (typeof window.generateMonthlyReport === 'function') {
        window.generateMonthlyReport();
      }
    };

    if (yearSel && !yearSel._reportsBound) {
      yearSel.addEventListener('change', handleChange);
      yearSel._reportsBound = true;
    }
    if (monthSel && !monthSel._reportsBound) {
      monthSel.addEventListener('change', handleChange);
      monthSel._reportsBound = true;
    }
  } catch (e) {
    console.warn('initReportsControls failed:', e?.message || e);
  }
}

// Filter rows in the current report by product name or general text
function filterProducts() {
  const input = document.getElementById('productSearch');
  const query = (input && input.value ? input.value.trim().toLowerCase() : '');
  const container = document.getElementById('reportContent');
  if (!container) return;

  // Find all table rows in report body
  const rows = container.querySelectorAll('table tbody tr');
  rows.forEach(tr => {
    const text = tr.textContent ? tr.textContent.toLowerCase() : '';
    tr.style.display = query === '' || text.includes(query) ? '' : 'none';
  });
}

// Attach to window so buttons can call these
window.generateDailyReport = generateDailyReport;
window.generateWeeklyReport = generateWeeklyReport;
window.generateMonthlyReport = generateMonthlyReport;
window.generateAnnualReport = generateAnnualReport;
window.exportReport = exportReport;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.exportToCSV = exportToCSV;
window.initReportsControls = initReportsControls;
window.filterProducts = filterProducts;
