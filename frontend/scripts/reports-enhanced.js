// Enhanced Reports generation and management with advanced features

// Initialize year selector on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeYearSelector();
});

function initializeYearSelector() {
  const yearSelector = document.getElementById('yearSelector');
  if (yearSelector) {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 5; year--) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      if (year === currentYear) option.selected = true;
      yearSelector.appendChild(option);
    }
  }
}

function setActiveButton(functionName) {
  document.querySelectorAll('.report-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`[onclick="${functionName}()"]`);
  if (activeBtn) activeBtn.classList.add('active');
}

function filterProducts() {
  const searchTerm = document.getElementById('productSearch').value.toLowerCase();
  const productItems = document.querySelectorAll('.product-item');
  
  productItems.forEach(item => {
    const productName = item.querySelector('.product-name').textContent.toLowerCase();
    if (productName.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function generateCategoryBreakdown(sales, products) {
  const categoryData = {};
  
  sales.forEach(sale => {
    const product = products.find(p => p.id === sale.productId);
    const category = product?.category || 'Uncategorized';
    
    if (!categoryData[category]) {
      categoryData[category] = {
        total: 0,
        products: {},
        count: 0
      };
    }
    
    categoryData[category].total += sale.total || 0;
    categoryData[category].count += 1;
    
    const productName = sale.productName || 'Unknown Product';
    if (!categoryData[category].products[productName]) {
      categoryData[category].products[productName] = {
        quantity: 0,
        revenue: 0,
        transactions: 0
      };
    }
    
    categoryData[category].products[productName].quantity += sale.quantity || 0;
    categoryData[category].products[productName].revenue += sale.total || 0;
    categoryData[category].products[productName].transactions += 1;
  });
  
  const totalRevenue = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);
  
  return `
    <div class="report-details">
      <h4><i class="fas fa-tags"></i> Category Performance Analysis</h4>
      ${Object.entries(categoryData).map(([category, data]) => `
        <div class="category-report">
          <div class="category-header">
            <h4>${category}</h4>
            <div class="category-total">
              ${window.utils.formatCurrency(data.total)} (${totalRevenue ? ((data.total / totalRevenue) * 100).toFixed(1) : 0}%)
            </div>
          </div>
          <div class="products-breakdown">
            ${Object.entries(data.products).map(([productName, productData]) => `
              <div class="product-item">
                <div class="product-info">
                  <div class="product-name">${productName}</div>
                  <div class="product-details">${productData.transactions} transactions</div>
                </div>
                <div class="product-performance">
                  <div class="amount">${window.utils.formatCurrency(productData.revenue)}</div>
                  <div class="quantity">${productData.quantity} units sold</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function generateDailyReport() {
  setActiveButton('generateDailyReport');
  const today = new Date().toISOString().split("T")[0];
  const sales = window.sales || [];
  const expenses = window.expenses || [];
  const products = window.products || [];

  const todaySales = sales.filter((s) => s.date === today);
  const todayExpenses = expenses.filter((e) => e.date === today);

  const totalSales = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalExpenses = todayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales ? ((netProfit / totalSales) * 100).toFixed(2) : 0;

  const categoryBreakdown = generateCategoryBreakdown(todaySales, products);
  
  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  reportContent.innerHTML = `
    <div class="report">
      <h3><i class="fas fa-calendar-day"></i> Daily Report - ${window.utils.formatDate(today)}</h3>
      
      <div class="report-stats">
        <div class="report-stat">
          <h4><i class="fas fa-shopping-cart"></i> Sales Performance</h4>
          <p><strong>Total Revenue:</strong> <span class="amount">${window.utils.formatCurrency(totalSales)}</span></p>
          <p><strong>Transactions:</strong> ${todaySales.length}</p>
          <p><strong>Average Sale:</strong> ${window.utils.formatCurrency(todaySales.length ? totalSales / todaySales.length : 0)}</p>
          <p><strong>Cash Sales:</strong> ${window.utils.formatCurrency(todaySales.filter(s => s.paymentMethod === "cash").reduce((sum, s) => sum + (s.total || 0), 0))}</p>
          <p><strong>M-Pesa Sales:</strong> ${window.utils.formatCurrency(todaySales.filter(s => s.paymentMethod === "mpesa").reduce((sum, s) => sum + (s.total || 0), 0))}</p>
          <p><strong>Credit Sales:</strong> ${window.utils.formatCurrency(todaySales.filter(s => s.paymentMethod === "debt").reduce((sum, s) => sum + (s.total || 0), 0))}</p>
        </div>
        
        <div class="report-stat">
          <h4><i class="fas fa-receipt"></i> Expenses Overview</h4>
          <p><strong>Total Expenses:</strong> <span class="amount">${window.utils.formatCurrency(totalExpenses)}</span></p>
          <p><strong>Expense Items:</strong> ${todayExpenses.length}</p>
          <p><strong>Average Expense:</strong> ${window.utils.formatCurrency(todayExpenses.length ? totalExpenses / todayExpenses.length : 0)}</p>
        </div>
        
        <div class="report-stat">
          <h4><i class="fas fa-chart-line"></i> Profitability</h4>
          <p><strong>Net Profit:</strong> <span class="amount ${netProfit >= 0 ? 'profit' : 'loss'}">${window.utils.formatCurrency(netProfit)}</span></p>
          <p><strong>Profit Margin:</strong> ${profitMargin}%</p>
          <p><strong>ROI:</strong> ${totalExpenses ? ((netProfit / totalExpenses) * 100).toFixed(2) : 0}%</p>
        </div>
      </div>
      
      ${categoryBreakdown}
      
      <div class="report-details">
        <h4><i class="fas fa-list"></i> Transaction Details</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${todaySales.map(sale => {
              const product = products.find(p => p.id === sale.productId);
              const saleTime = new Date(sale.createdAt).toLocaleTimeString('en-KE', {hour: '2-digit', minute: '2-digit'});
              return `
                <tr>
                  <td><strong>${sale.productName || "Unknown Product"}</strong></td>
                  <td><span class="category-badge">${product?.category || 'N/A'}</span></td>
                  <td>${sale.quantity || 0}</td>
                  <td>${window.utils.formatCurrency(sale.unitPrice || 0)}</td>
                  <td><strong>${window.utils.formatCurrency(sale.total || 0)}</strong></td>
                  <td><span class="payment-badge ${sale.paymentMethod}">${(sale.paymentMethod || 'unknown').toUpperCase()}</span></td>
                  <td>${saleTime}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function generateWeeklyReport() {
  setActiveButton('generateWeeklyReport');
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const sales = window.sales || [];
  const expenses = window.expenses || [];
  const products = window.products || [];

  const weekSales = sales.filter((s) => {
    const saleDate = new Date(s.createdAt);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate >= startDate && saleDate <= endDate;
  });

  const weekExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.createdAt);
    expenseDate.setHours(0, 0, 0, 0);
    return expenseDate >= startDate && expenseDate <= endDate;
  });

  const totalSales = weekSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalExpenses = weekExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;

  const categoryBreakdown = generateCategoryBreakdown(weekSales, products);

  // Group sales by day
  const salesByDay = {};
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split("T")[0];
    salesByDay[dateString] = weekSales
      .filter((s) => s.date === dateString)
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }

  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  reportContent.innerHTML = `
    <div class="report">
      <h3><i class="fas fa-calendar-week"></i> Weekly Report - ${window.utils.formatDate(startDate)} to ${window.utils.formatDate(endDate)}</h3>
      
      <div class="report-stats">
        <div class="report-stat">
          <h4><i class="fas fa-chart-bar"></i> Sales Performance</h4>
          <p><strong>Total Revenue:</strong> <span class="amount">${window.utils.formatCurrency(totalSales)}</span></p>
          <p><strong>Daily Average:</strong> ${window.utils.formatCurrency(totalSales / 7)}</p>
          <p><strong>Transactions:</strong> ${weekSales.length}</p>
        </div>
        
        <div class="report-stat">
          <h4><i class="fas fa-money-bill-wave"></i> Expenses Overview</h4>
          <p><strong>Total Expenses:</strong> <span class="amount">${window.utils.formatCurrency(totalExpenses)}</span></p>
          <p><strong>Daily Average:</strong> ${window.utils.formatCurrency(totalExpenses / 7)}</p>
        </div>
        
        <div class="report-stat">
          <h4><i class="fas fa-trophy"></i> Profitability</h4>
          <p><strong>Net Profit:</strong> <span class="amount ${netProfit >= 0 ? 'profit' : 'loss'}">${window.utils.formatCurrency(netProfit)}</span></p>
          <p><strong>Profit Margin:</strong> ${totalSales ? ((netProfit / totalSales) * 100).toFixed(2) : 0}%</p>
        </div>
      </div>
      
      ${categoryBreakdown}
      
      <div class="report-details">
        <h4><i class="fas fa-calendar-alt"></i> Daily Breakdown</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Sales</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(salesByDay).map(([date, amount]) => {
              const dayName = new Date(date).toLocaleDateString('en-KE', { weekday: 'long' });
              const dayTransactions = weekSales.filter(s => s.date === date).length;
              return `
                <tr>
                  <td>${window.utils.formatDate(date)}</td>
                  <td>${dayName}</td>
                  <td><strong>${window.utils.formatCurrency(amount)}</strong></td>
                  <td>${dayTransactions}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function generateMonthlyReport() {
  setActiveButton('generateMonthlyReport');
  
  const monthSelector = document.getElementById('monthSelector');
  const yearSelector = document.getElementById('yearSelector');
  
  const selectedMonth = monthSelector.value !== '' ? parseInt(monthSelector.value) : new Date().getMonth();
  const selectedYear = yearSelector.value !== '' ? parseInt(yearSelector.value) : new Date().getFullYear();

  const sales = window.sales || [];
  const expenses = window.expenses || [];
  const products = window.products || [];

  const monthSales = sales.filter((s) => {
    const saleDate = new Date(s.createdAt);
    return saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === selectedYear;
  });

  const monthExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.createdAt);
    return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
  });

  const totalSales = monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalExpenses = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales ? ((netProfit / totalSales) * 100).toFixed(2) : 0;

  const categoryBreakdown = generateCategoryBreakdown(monthSales, products);
  
  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });

  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  reportContent.innerHTML = `
    <div class="report">
      <h3><i class="fas fa-calendar-alt"></i> Monthly Report - ${monthName}</h3>
      
      <div class="report-stats">
        <div class="report-stat">
          <h4><i class="fas fa-chart-bar"></i> Sales Performance</h4>
          <p><strong>Total Revenue:</strong> <span class="amount">${window.utils.formatCurrency(totalSales)}</span></p>
          <p><strong>Transactions:</strong> ${monthSales.length}</p>
          <p><strong>Average Transaction:</strong> ${window.utils.formatCurrency(monthSales.length ? totalSales / monthSales.length : 0)}</p>
          <p><strong>Daily Average:</strong> ${window.utils.formatCurrency(totalSales / new Date(selectedYear, selectedMonth + 1, 0).getDate())}</p>
        </div>
        
        <div class="report-stat">
          <h4><i class="fas fa-money-bill-wave"></i> Expenses Overview</h4>
          <p><strong>Total Expenses:</strong> <span class="amount">${window.utils.formatCurrency(totalExpenses)}</span></p>
          <p><strong>Expense Items:</strong> ${monthExpenses.length}</p>
          <p><strong>Daily Average:</strong> ${window.utils.formatCurrency(totalExpenses / new Date(selectedYear, selectedMonth + 1, 0).getDate())}</p>
        </div>
        
        <div class="report-stat">
          <h4><i class="fas fa-trophy"></i> Profitability</h4>
          <p><strong>Net Profit:</strong> <span class="amount ${netProfit >= 0 ? 'profit' : 'loss'}">${window.utils.formatCurrency(netProfit)}</span></p>
          <p><strong>Profit Margin:</strong> ${profitMargin}%</p>
          <p><strong>ROI:</strong> ${totalExpenses ? ((netProfit / totalExpenses) * 100).toFixed(2) : 0}%</p>
        </div>
      </div>
      
      ${categoryBreakdown}
    </div>
  `;
}

function generateAnnualReport() {
  setActiveButton('generateAnnualReport');
  const currentYear = new Date().getFullYear();
  const sales = window.sales || [];
  const expenses = window.expenses || [];
  const products = window.products || [];

  const yearSales = sales.filter((s) => {
    const saleDate = new Date(s.createdAt);
    return saleDate.getFullYear() === currentYear;
  });

  const yearExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.createdAt);
    return expenseDate.getFullYear() === currentYear;
  });

  const totalSales = yearSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalExpenses = yearExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;

  // Monthly breakdown
  const monthlyData = {};
  for (let month = 0; month < 12; month++) {
    const monthName = new Date(currentYear, month).toLocaleDateString('en-KE', { month: 'long' });
    const monthSales = yearSales.filter(s => new Date(s.createdAt).getMonth() === month);
    const monthExpenses = yearExpenses.filter(e => new Date(e.createdAt).getMonth() === month);
    
    monthlyData[monthName] = {
      sales: monthSales.reduce((sum, s) => sum + (s.total || 0), 0),
      expenses: monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      transactions: monthSales.length
    };
  }

  const categoryBreakdown = generateCategoryBreakdown(yearSales, products);

  const reportContent = document.getElementById("reportContent");
  if (!reportContent) return;

  reportContent.innerHTML = `
    <div class="report">
      <h3><i class="fas fa-calendar"></i> Annual Report - ${currentYear}</h3>
      
      <div class="report-stats">
        <div class="report-stat">
          <h4><i class="fas fa-chart-line"></i> Annual Performance</h4>
          <p><strong>Total Revenue:</strong> <span class="amount">${window.utils.formatCurrency(totalSales)}</span></p>
          <p><strong>Total Transactions:</strong> ${yearSales.length}</p>
          <p><strong>Monthly Average:</strong> ${window.utils.formatCurrency(totalSales / 12)}</p>
          <p><strong>Best Month:</strong> ${Object.entries(monthlyData).reduce((best, [month, data]) => data.sales > best.sales ? {month, sales: data.sales} : best, {month: 'None', sales: 0}).month}</p>
        </div>
        
        <div class="report-stat">
          <h4><i class="fas fa-money-bill-wave"></i> Annual Expenses</h4>
          <p><strong>Total Expenses:</strong> <span class="amount">${window.utils.formatCurrency(totalExpenses)}</span></p>
          <p><strong>Monthly Average:</strong> ${window.utils.formatCurrency(totalExpenses / 12)}</p>
          <p><strong>Expense Ratio:</strong> ${totalSales ? ((totalExpenses / totalSales) * 100).toFixed(2) : 0}%</p>
        </div>
        
        <div class="report-stat">
          <h4><i class="fas fa-trophy"></i> Annual Profitability</h4>
          <p><strong>Net Profit:</strong> <span class="amount ${netProfit >= 0 ? 'profit' : 'loss'}">${window.utils.formatCurrency(netProfit)}</span></p>
          <p><strong>Profit Margin:</strong> ${totalSales ? ((netProfit / totalSales) * 100).toFixed(2) : 0}%</p>
          <p><strong>ROI:</strong> ${totalExpenses ? ((netProfit / totalExpenses) * 100).toFixed(2) : 0}%</p>
        </div>
      </div>
      
      ${categoryBreakdown}
      
      <div class="report-details">
        <h4><i class="fas fa-calendar-alt"></i> Monthly Performance Breakdown</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Sales</th>
              <th>Expenses</th>
              <th>Profit</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(monthlyData).map(([month, data]) => {
              const profit = data.sales - data.expenses;
              return `
                <tr>
                  <td><strong>${month}</strong></td>
                  <td>${window.utils.formatCurrency(data.sales)}</td>
                  <td>${window.utils.formatCurrency(data.expenses)}</td>
                  <td><span class="amount ${profit >= 0 ? 'profit' : 'loss'}">${window.utils.formatCurrency(profit)}</span></td>
                  <td>${data.transactions}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Enhanced export functions with proper PDF download
function exportToPDF() {
  const reportContent = document.getElementById("reportContent");
  if (!reportContent || !reportContent.innerHTML.includes("report")) {
    window.utils.showNotification("Please generate a report first", "warning");
    return;
  }

  // Check if jsPDF is available, if not load it dynamically
  if (typeof window.jsPDF === 'undefined') {
    loadJsPDFLibrary().then(() => {
      generatePDFDownload(reportContent);
    }).catch(() => {
      // Fallback to HTML-based PDF generation
      generateHTMLPDF(reportContent);
    });
  } else {
    generatePDFDownload(reportContent);
  }
}

function loadJsPDFLibrary() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      window.jsPDF = window.jspdf.jsPDF;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function generatePDFDownload(reportContent) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Get report title
    const reportTitle = reportContent.querySelector('h3').textContent;
    const currentDate = new Date().toLocaleDateString('en-KE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text('Zion Groceries', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(127, 140, 141);
    doc.text('Business Analytics Report', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(149, 165, 166);
    doc.text(`Generated on ${currentDate}`, 105, 40, { align: 'center' });
    
    // Add report title
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text(reportTitle, 20, 55);
    
    // Extract and add report statistics
    const reportStats = reportContent.querySelectorAll('.report-stat');
    let yPosition = 70;
    
    reportStats.forEach((stat, index) => {
      const title = stat.querySelector('h4').textContent;
      const paragraphs = stat.querySelectorAll('p');
      
      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.text(title, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      
      paragraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text && yPosition < 270) {
          doc.text(text, 25, yPosition);
          yPosition += 6;
        }
      });
      
      yPosition += 5;
      
      // Add new page if needed
      if (yPosition > 270 && index < reportStats.length - 1) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    // Add tables if space allows
    const tables = reportContent.querySelectorAll('.table');
    if (tables.length > 0 && yPosition < 200) {
      tables.forEach((table, tableIndex) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        const tableTitle = table.previousElementSibling;
        if (tableTitle && tableTitle.tagName === 'H4') {
          doc.setFontSize(12);
          doc.setTextColor(44, 62, 80);
          doc.text(tableTitle.textContent, 20, yPosition);
          yPosition += 10;
        }
        
        // Add table headers
        const headers = table.querySelectorAll('th');
        if (headers.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);
          doc.setFillColor(52, 73, 94);
          doc.rect(20, yPosition - 5, 170, 8, 'F');
          
          let xPosition = 25;
          const columnWidth = 165 / headers.length;
          
          headers.forEach(header => {
            doc.text(header.textContent.substring(0, 15), xPosition, yPosition);
            xPosition += columnWidth;
          });
          yPosition += 10;
        }
        
        // Add table rows (limited to prevent overflow)
        const rows = table.querySelectorAll('tbody tr');
        const maxRows = Math.min(rows.length, 10);
        
        doc.setTextColor(51, 51, 51);
        for (let i = 0; i < maxRows; i++) {
          if (yPosition > 270) break;
          
          const cells = rows[i].querySelectorAll('td');
          let xPosition = 25;
          const columnWidth = 165 / cells.length;
          
          cells.forEach(cell => {
            const text = cell.textContent.trim().substring(0, 12);
            doc.text(text, xPosition, yPosition);
            xPosition += columnWidth;
          });
          yPosition += 6;
        }
        
        if (rows.length > maxRows) {
          doc.setFontSize(8);
          doc.setTextColor(149, 165, 166);
          doc.text(`... and ${rows.length - maxRows} more rows`, 25, yPosition);
          yPosition += 8;
        }
        
        yPosition += 10;
      });
    }
    
    // Save the PDF
    const fileName = `zion-groceries-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    window.utils.showNotification("PDF downloaded successfully", "success");
    
  } catch (error) {
    console.error('PDF generation error:', error);
    generateHTMLPDF(reportContent);
  }
}

function generateHTMLPDF(reportContent) {
  // Fallback method using HTML to PDF conversion
  const reportTitle = reportContent.querySelector('h3').textContent;
  const currentDate = new Date().toLocaleDateString('en-KE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Zion Groceries Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3498db; padding-bottom: 20px; }
          .header h1 { color: #2c3e50; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #7f8c8d; margin: 5px 0; }
          .report h3 { color: #2c3e50; font-size: 18px; margin: 20px 0; }
          .report-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
          .report-stat { padding: 15px; border: 1px solid #ecf0f1; border-radius: 5px; background: #f8f9fa; }
          .report-stat h4 { color: #2980b9; font-size: 14px; margin-bottom: 10px; }
          .report-stat p { font-size: 12px; margin: 5px 0; }
          .amount { font-weight: bold; color: #27ae60; }
          .profit { color: #27ae60; }
          .loss { color: #e74c3c; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
          .table th, .table td { border: 1px solid #bdc3c7; padding: 8px; text-align: left; }
          .table th { background-color: #34495e; color: white; }
          .table tr:nth-child(even) { background-color: #f2f2f2; }
          .category-report { margin: 15px 0; page-break-inside: avoid; }
          .category-header { background: #3498db; color: white; padding: 10px; font-size: 12px; }
          .products-breakdown { background: #ecf0f1; }
          .product-item { display: flex; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid #bdc3c7; font-size: 11px; }
          .report-details h4 { color: #2c3e50; font-size: 14px; margin: 15px 0 10px 0; }
          @media print { 
            body { margin: 0; }
            .report-stat { page-break-inside: avoid; }
            .table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Zion Groceries</h1>
          <p>Business Analytics Report</p>
          <p>Generated on ${currentDate}</p>
        </div>
        ${reportContent.innerHTML}
      </body>
    </html>
  `;
  
  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `zion-groceries-report-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  window.utils.showNotification("Report downloaded as HTML file (can be converted to PDF)", "success");
}

function exportToExcel() {
  const reportContent = document.getElementById("reportContent");
  if (!reportContent || !reportContent.innerHTML.includes("report")) {
    window.utils.showNotification("Please generate a report first", "warning");
    return;
  }

  const tables = reportContent.querySelectorAll('.table');
  let csvContent = "data:text/csv;charset=utf-8,";
  
  const reportTitle = reportContent.querySelector('h3').textContent;
  csvContent += `${reportTitle}\n\n`;
  
  tables.forEach((table, index) => {
    const rows = table.querySelectorAll('tr');
    
    const tableTitle = table.previousElementSibling;
    if (tableTitle && tableTitle.tagName === 'H4') {
      csvContent += `${tableTitle.textContent}\n`;
    }
    
    rows.forEach(row => {
      const cols = row.querySelectorAll('th, td');
      const rowData = Array.from(cols).map(col => {
        return `"${col.textContent.trim().replace(/"/g, '""')}"`;
      }).join(',');
      csvContent += rowData + '\n';
    });
    
    csvContent += '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `zion-groceries-report-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.utils.showNotification("Excel file downloaded successfully", "success");
}

// Export functions for global access
window.generateDailyReport = generateDailyReport;
window.generateWeeklyReport = generateWeeklyReport;
window.generateMonthlyReport = generateMonthlyReport;
window.generateAnnualReport = generateAnnualReport;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.filterProducts = filterProducts;
