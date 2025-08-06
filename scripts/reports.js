// Report functions with auto-save and enhanced reporting
function generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    generateReport('daily', today);
    data.save(); // Save report generation activity
}

function generateWeeklyReport() {
    const today = new Date();
    const weekAgo = new Date(today);
    const dayOfWeek = today.getDay(); 
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekAgo.setDate(today.getDate() - diffToMonday);
    generateReport('weekly', weekAgo.toISOString().split('T')[0]);
    data.save();
}



function generateMonthlyReport() {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    generateReport('monthly', firstDayOfMonth.toISOString().split('T')[0]);
    data.save();
}

function generateReport(timeframe, startDate) {
    const endDate = new Date().toISOString().split('T')[0];
    const filteredSales = data.sales.filter(sale => sale.date >= startDate && sale.date <= endDate);
    const filteredExpenses = data.expenses.filter(expense => expense.date >= startDate && expense.date <= endDate);
    
    // 1. Financial Summary Report
    const financialReport = generateFinancialReport(filteredSales, filteredExpenses, timeframe);
    
    // 2. Product Performance Report
    const productReport = generateProductReport(filteredSales);
    
    // 3. Inventory Status Report
    const inventoryReport = generateInventoryReport();
    
    // 4. Payment Method Analysis
    const paymentReport = generatePaymentReport(filteredSales);
    
    document.getElementById('reportContent').innerHTML = `
        ${financialReport}
        ${productReport}
        ${inventoryReport}
        ${paymentReport}
    `;
}

function generateFinancialReport(sales, expenses, timeframe) {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalSales - totalExpenses;
    
    return `
        <div class="report-section">
            <h3 style="color: white; border-bottom: 1px solid #444; padding-bottom: 10px;">
                ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Financial Summary
            </h3>
            <div class="financial-grid">
                <div class="financial-card" style="background: rgba(76, 175, 80, 0.2);">
                    <div class="financial-value">KSh ${totalSales.toFixed(2)}</div>
                    <div class="financial-label">Total Sales</div>
                </div>
                <div class="financial-card" style="background: rgba(244, 67, 54, 0.2);">
                    <div class="financial-value">KSh ${totalExpenses.toFixed(2)}</div>
                    <div class="financial-label">Total Expenses</div>
                </div>
                <div class="financial-card" style="background: ${netProfit >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}">
                    <div class="financial-value" style="color: ${netProfit >= 0 ? '#4CAF50' : '#F44336'}">KSh ${netProfit.toFixed(2)}</div>
                    <div class="financial-label">Net Profit</div>
                </div>
            </div>
        </div>
    `;
}

function generateProductReport(sales) {
    // Group sales by product
    const productSales = {};
    sales.forEach(sale => {
        if (!productSales[sale.productId]) {
            productSales[sale.productId] = {
                name: sale.productName,
                total: 0,
                quantity: 0
            };
        }
        productSales[sale.productId].total += sale.total;
        productSales[sale.productId].quantity += sale.quantity;
    });
    
    let productRows = '';
    Object.values(productSales).forEach(product => {
        productRows += `
            <tr>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>KSh ${product.total.toFixed(2)}</td>
                <td>KSh ${(product.total / product.quantity).toFixed(2)}</td>
            </tr>
        `;
    });
    
    return `
        <div class="report-section">
            <h3 style="color: white; border-bottom: 1px solid #444; padding-bottom: 10px; margin-top: 30px;">
                Product Performance
            </h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity Sold</th>
                        <th>Total Revenue</th>
                        <th>Average Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${productRows}
                </tbody>
            </table>
        </div>
    `;
}

function generateInventoryReport() {
    // Sort by stock quantity (lowest first)
    const sortedProducts = [...data.products].sort((a, b) => a.stock - b.stock);
    
    let inventoryRows = '';
    sortedProducts.forEach(product => {
        const stockStatus = product.stock === 0 ? 'Out of Stock' : 
                          product.stock <= 5 ? 'Low Stock' : 'In Stock';
        const statusClass = product.stock === 0 ? 'out-of-stock' : 
                          product.stock <= 5 ? 'low-stock' : 'in-stock';
        
        inventoryRows += `
            <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.stock}</td>
                <td><span class="${statusClass}">${stockStatus}</span></td>
            </tr>
        `;
    });
    
    return `
        <div class="report-section">
            <h3 style="color: white; border-bottom: 1px solid #444; padding-bottom: 10px; margin-top: 30px;">
                Inventory Status
            </h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventoryRows}
                </tbody>
            </table>
        </div>
    `;
}

function generatePaymentReport(sales) {
    const paymentMethods = {
        cash: { total: 0, count: 0 },
        mpesa: { total: 0, count: 0 },
        debt: { total: 0, count: 0 }
    };
    
    sales.forEach(sale => {
        paymentMethods[sale.paymentMethod].total += sale.total;
        paymentMethods[sale.paymentMethod].count++;
    });
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    return `
        <div class="report-section">
            <h3 style="color: white; border-bottom: 1px solid #444; padding-bottom: 10px; margin-top: 30px;">
                Payment Method Analysis
            </h3>
            <div class="payment-methods-grid">
                <div class="payment-method-card">
                    <h4>Cash</h4>
                    <div>KSh ${paymentMethods.cash.total.toFixed(2)}</div>
                    <div>${paymentMethods.cash.count} transactions</div>
                    <div>${totalSales > 0 ? ((paymentMethods.cash.total / totalSales) * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="payment-method-card">
                    <h4>M-Pesa</h4>
                    <div>KSh ${paymentMethods.mpesa.total.toFixed(2)}</div>
                    <div>${paymentMethods.mpesa.count} transactions</div>
                    <div>${totalSales > 0 ? ((paymentMethods.mpesa.total / totalSales) * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="payment-method-card">
                    <h4>Debt</h4>
                    <div>KSh ${paymentMethods.debt.total.toFixed(2)}</div>
                    <div>${paymentMethods.debt.count} transactions</div>
                    <div>${totalSales > 0 ? ((paymentMethods.debt.total / totalSales) * 100).toFixed(1) : 0}%</div>
                </div>
            </div>
        </div>
    `;
}

function exportReport() {
    // Save the current report content
    const reportContent = document.getElementById('reportContent').innerHTML;
    localStorage.setItem('lastGeneratedReport', reportContent);
    
    // In a real implementation, this would generate a PDF
    alert('Report saved and ready for export. In production, this would generate a PDF.');
    data.save();
}
