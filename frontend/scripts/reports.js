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

// Helpers to normalize fields consistently
function reportGetPaymentMethod(s) {
  const v = s.paymentMethod || s.payment_method || s.payment || s.method || '';
  return typeof v === 'string' ? v.toLowerCase() : '';
}
function reportGetTotal(s) {
  const n = Number(s.total ?? s.total_amount ?? s.amount ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function reportGetDateOnly(v) {
  if (!v) return null;
  if (v instanceof Date) return getNairobiDateString(v);
  const str = String(v);
  return str.length >= 10 ? str.slice(0, 10) : str;
}

async function generateDailyReport(targetYmd = null) {
  const reportContent = document.getElementById("reportContent");
  if (reportContent) {
    reportContent.innerHTML = '<div style="color:white;">Loading daily report…</div>';
  }
  // Simplicity: use in-memory data already maintained by the dashboard

  const today = getNairobiDateString();
  // If globals are empty (e.g., Reports opened before dashboard initialized), lazily fetch once
  let sales = Array.isArray(window.sales) ? window.sales : [];
  let expenses = Array.isArray(window.expenses) ? window.expenses : [];
  let debts = Array.isArray(window.debts) ? window.debts : [];
  try {
    if (window.dataManager) {
      if (!Array.isArray(sales) || sales.length === 0) {
        const res = await window.dataManager.getData('sales');
        const raw = Array.isArray(res?.data) ? res.data : [];
        sales = (typeof window.normalizeSale === 'function') ? raw.map(window.normalizeSale) : raw;
        window.sales = sales;
      }
      if (!Array.isArray(expenses) || expenses.length === 0) {
        const res = await window.dataManager.getData('expenses');
        expenses = Array.isArray(res?.data) ? res.data : [];
        window.expenses = expenses;
      }
      if (!Array.isArray(debts) || debts.length === 0) {
        const res = await window.dataManager.getData('debts');
        debts = Array.isArray(res?.data) ? res.data : [];
        window.debts = debts;
      }
    }
  } catch (e) {
    console.warn('Daily report lazy fetch failed:', e?.message || e);
  }

  // Robust date comparison that tolerates different fields and types
  const isSameDay = (value, yyyyMmDd) => {
    if (!value) return false;
    try {
      const dateOnly = reportGetDateOnly(value);
      return dateOnly === yyyyMmDd;
    } catch {
      return false;
    }
  };

  // Determine the report day: explicit param -> today -> latest sale date
  let reportYmd = (typeof targetYmd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetYmd)) ? targetYmd : today;
  let todaySales = sales.filter((s) => isSameDay(s.date ?? s.createdAt ?? s.created_at, reportYmd));
  let todayExpenses = expenses.filter((e) => isSameDay(e.date ?? e.createdAt ?? e.created_at, reportYmd));
  let todayDebts = debts.filter((d) => isSameDay(d.date ?? d.createdAt ?? d.created_at, reportYmd));

  if (todaySales.length === 0 && sales.length > 0 && !targetYmd) {
    const ymds = sales
      .map(s => reportGetDateOnly(s.date ?? s.createdAt ?? s.created_at))
      .filter(Boolean)
      .sort();
    const latest = ymds[ymds.length - 1];
    if (latest) {
      reportYmd = latest;
      todaySales = sales.filter((s) => isSameDay(s.date ?? s.createdAt ?? s.created_at, reportYmd));
      todayExpenses = expenses.filter((e) => isSameDay(e.date ?? e.createdAt ?? e.created_at, reportYmd));
      todayDebts = debts.filter((d) => isSameDay(d.date ?? d.createdAt ?? d.created_at, reportYmd));
    }
  }

  // Reflect the selected date in the toolbar (date picker + label)
  try {
    const dp = document.getElementById('dailyDatePicker');
    if (dp) dp.value = reportYmd;
    const disp = document.getElementById('dailyDateDisplay');
    if (disp) disp.textContent = `Selected: ${window.utils.formatDate(reportYmd)}`;
  } catch (_) {}

  const totalSales = todaySales.reduce((sum, s) => sum + reportGetTotal(s), 0);
  const totalExpenses = todayExpenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );
  const totalDebts = todayDebts.reduce(
    (sum, debt) => sum + (Number(debt.amount) || 0),
    0
  );

  if (!reportContent) return;

  reportContent.innerHTML = `
        <div class="report">
            <h3>Daily Report - ${window.utils.formatDate(reportYmd)}</h3>
            <div class="report-stats">
                <div class="report-stat">
                    <h4>Sales Summary</h4>
                    <p>Total Sales: ${window.utils.formatCurrency(
                      totalSales
                    )}</p>
                    <p>Number of Transactions: ${todaySales.length}</p>
                    <p>Average Transaction: ${window.utils.formatCurrency(todaySales.length ? (totalSales / todaySales.length) : 0)}</p>
                    <p>Cash Sales: ${window.utils.formatCurrency(
                      todaySales
                        .filter((s) => reportGetPaymentMethod(s) === "cash")
                        .reduce((sum, s) => sum + reportGetTotal(s), 0)
                     )}</p>
                    <p>M-Pesa Sales: ${window.utils.formatCurrency(
                      todaySales
                        .filter((s) => reportGetPaymentMethod(s) === "mpesa")
                        .reduce((sum, s) => sum + reportGetTotal(s), 0)
                     )}</p>
                    <p>Credit Sales: ${window.utils.formatCurrency(
                      todaySales
                        .filter((s) => reportGetPaymentMethod(s) === "debt")
                        .reduce((sum, s) => sum + reportGetTotal(s), 0)
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
                                  sale.productName || sale.product_name || "Unknown Product"
                                }</td>
                                <td>${sale.quantity || sale.qty || 0}</td>
                                <td>${window.utils.formatCurrency(
                                  reportGetTotal(sale)
                                 )}</td>
                                <td>${(
                                  reportGetPaymentMethod(sale) || "unknown"
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
    // Compute current week Monday..Sunday from in-memory sales
    const sales = Array.isArray(window.sales) ? window.sales : [];
    const today = new Date();
    const dow = today.getDay();
    const offset = (dow === 0) ? -6 : (1 - dow);
    const monday = new Date(today);
    monday.setDate(today.getDate() + offset);
    monday.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = getNairobiDateString(d);
      const total_revenue = sales
        .filter(s => reportGetDateOnly(s.date ?? s.createdAt ?? s.created_at) === key)
        .reduce((sum, s) => sum + reportGetTotal(s), 0);
      return { date: key, total_revenue };
    });
    const weekly = { week: { start: days[0].date, end: days[6].date }, days };

    const totalSales = weekly.days.reduce((sum, d) => sum + (parseFloat(d.total_revenue) || 0), 0);

    // Simplicity: do not fetch weekly expenses; show sales only
    let weeklyExp = null;

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

async function generateMonthlyReport() {
  const mount = document.getElementById('reportContent');
  if (!mount) return;
  mount.innerHTML = '<div style="color:white;">Loading monthly report…</div>';

  // Read current selectors (if present)
  const monthSel = document.getElementById('monthSelector');
  const yearSel = document.getElementById('yearSelector');
  const now = new Date();
  const m = monthSel && monthSel.value !== '' ? parseInt(monthSel.value, 10) : now.getMonth();
  const y = yearSel && yearSel.value !== '' ? parseInt(yearSel.value, 10) : now.getFullYear();

  const sales = Array.isArray(window.sales) ? window.sales : [];
  const expenses = Array.isArray(window.expenses) ? window.expenses : [];
  const products = Array.isArray(window.products) ? window.products : [];

  // Filter records for month/year using Nairobi date keys
  const inMonth = (dateVal) => {
    const dstr = reportGetDateOnly(dateVal);
    if (!dstr) return false;
    const d = new Date(dstr + 'T00:00:00');
    return d.getFullYear() === y && d.getMonth() === m;
  };

  const monthSales = sales.filter(s => inMonth(s.date ?? s.createdAt ?? s.created_at));
  const monthExpenses = expenses.filter(e => inMonth(e.date ?? e.createdAt ?? e.created_at));

  const totalSales = monthSales.reduce((sum, s) => sum + reportGetTotal(s), 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const monthlyNet = totalSales - totalExpenses;

  // Group sales by product category using products catalog (best-effort)
  const salesByCategory = monthSales.reduce((acc, s) => {
    const pid = s.productId || s.product_id;
    const prod = products.find(p => p.id === pid);
    const cat = (prod && prod.category) ? prod.category : 'unknown';
    acc[cat] = (acc[cat] || 0) + reportGetTotal(s);
    return acc;
  }, {});

  const monthName = new Date(y, m, 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  mount.innerHTML = `
    <div class="report">
      <h3>Monthly Report - ${monthName}</h3>
      <div class="report-stats">
        <div class="report-stat">
          <h4>Sales Summary</h4>
          <p>Total Sales: ${window.utils.formatCurrency(totalSales)}</p>
          <p>Number of Transactions: ${monthSales.length}</p>
          <p>Average Transaction: ${window.utils.formatCurrency(monthSales.length ? (totalSales / monthSales.length) : 0)}</p>
        </div>
        <div class="report-stat">
          <h4>Expenses Summary</h4>
          <p>Total Expenses: ${window.utils.formatCurrency(totalExpenses)}</p>
          <p>Number of Expenses: ${monthExpenses.length}</p>
        </div>
        <div class="report-stat">
          <h4>Net</h4>
          <p>Monthly Net: ${window.utils.formatCurrency(monthlyNet)}</p>
          <p>Profit Margin: ${totalSales ? (((monthlyNet) / totalSales) * 100).toFixed(2) : 0}%</p>
        </div>
      </div>
      <div class="report-details">
        <h4>Sales by Category</h4>
        <table class="table">
          <thead><tr><th>Category</th><th>Sales</th><th>%</th></tr></thead>
          <tbody>
            ${Object.entries(salesByCategory).map(([cat, amt]) => `
              <tr>
                <td>${cat}</td>
                <td>${window.utils.formatCurrency(amt)}</td>
                <td>${totalSales ? ((amt / totalSales) * 100).toFixed(2) : 0}%</td>
              </tr>
            `).join('') || '<tr><td colspan="3">No data</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Track type so selectors can auto-refresh this report
  window.currentReportType = 'monthly';
}

async function generateAnnualReport() {
  // Simplicity: use in-memory sales

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
      .reduce((sum, s) => sum + reportGetTotal(s), 0);
    return total;
  });

  const yearTotal = monthlyTotals.reduce((a, b) => a + b, 0);

  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  const monthLabels = Array.from({ length: 12 }, (_, m) => new Date(selectedYear, m, 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }));

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
