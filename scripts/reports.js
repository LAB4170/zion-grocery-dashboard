// Reports generation and management

function generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date === today);
    const todayExpenses = expenses.filter(e => e.date === today);
    const todayDebts = debts.filter(d => d.date === today);
    
    const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalDebts = todayDebts.reduce((sum, debt) => sum + debt.amount, 0);
    
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = `
        <div class="report">
            <h3>Daily Report - ${window.utils.formatDate(today)}</h3>
            <div class="report-stats">
                <div class="report-stat">
                    <h4>Sales Summary</h4>
                    <p>Total Sales: ${formatCurrency(totalSales)}</p>
                    <p>Number of Transactions: ${todaySales.length}</p>
                    <p>Cash Sales: ${window.utils.formatCurrency(todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0))}</p>
                    <p>M-Pesa Sales: ${window.utils.formatCurrency(todaySales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, s) => sum + s.total, 0))}</p>
                    <p>Credit Sales: ${window.utils.formatCurrency(todaySales.filter(s => s.paymentMethod === 'debt').reduce((sum, s) => sum + s.total, 0))}</p>
                </div>
                <div class="report-stat">
                    <h4>Expenses Summary</h4>
                    <p>Total Expenses: ${formatCurrency(totalExpenses)}</p>
                    <p>Number of Expenses: ${todayExpenses.length}</p>
                </div>
                <div class="report-stat">
                    <h4>Net Profit</h4>
                    <p>Net Profit: ${window.utils.formatCurrency(totalSales - totalExpenses)}</p>
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
                        ${todaySales.map(sale => `
                            <tr>
                                <td>${sale.productName}</td>
                                <td>${sale.quantity}</td>
                                <td>${formatCurrency(sale.total)}</td>
                                <td>${sale.paymentMethod.toUpperCase()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateWeeklyReport() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    
    const weekSales = sales.filter(s => {
    const saleDate = new Date(s.createdAt);
    // Normalize to midnight
    saleDate.setHours(0, 0, 0, 0);
    return saleDate >= startDate && saleDate <= endDate;
});

    const weekExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.createdAt);
    // Normalize to midnight
    expenseDate.setHours(0, 0, 0, 0);
    return expenseDate >= startDate && expenseDate <= endDate;
});

    
    const totalSales = weekSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group sales by day
    const salesByDay = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        salesByDay[dateString] = weekSales.filter(s => s.date === dateString).reduce((sum, s) => sum + s.total, 0);
    }
    
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = `
        <div class="report">
            <h3>Weekly Report - ${formatDate(startDate)} to ${formatDate(endDate)}</h3>
            <div class="report-stats">
                <div class="report-stat">
                    <h4>Sales Summary</h4>
                    <p>Total Sales: ${formatCurrency(totalSales)}</p>
                    <p>Average Daily Sales: ${formatCurrency(totalSales / 7)}</p>
                    <p>Number of Transactions: ${weekSales.length}</p>
                </div>
                <div class="report-stat">
                    <h4>Expenses Summary</h4>
                    <p>Total Expenses: ${formatCurrency(totalExpenses)}</p>
                    <p>Average Daily Expenses: ${formatCurrency(totalExpenses / 7)}</p>
                </div>
                <div class="report-stat">
                    <h4>Net Profit</h4>
                    <p>Weekly Net Profit: ${formatCurrency(totalSales - totalExpenses)}</p>
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
                        ${Object.entries(salesByDay).map(([date, amount]) => `
                            <tr>
                                <td>${formatDate(date)}</td>
                                <td>${formatCurrency(amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateMonthlyReport() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthSales = sales.filter(s => {
        const saleDate = new Date(s.createdAt);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });
    
    const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.createdAt);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const totalSales = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group by product category
    const salesByCategory = monthSales.reduce((acc, sale) => {
        const product = products.find(p => p.id === sale.productId);
        const category = product ? product.category : 'unknown';
        acc[category] = (acc[category] || 0) + sale.total;
        return acc;
    }, {});
    
    // Group expenses by category
    const expensesByCategory = monthExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});
    
    const monthName = new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
    
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = `
        <div class="report">
            <h3>Monthly Report - ${monthName}</h3>
            <div class="report-stats">
                <div class="report-stat">
                    <h4>Sales Summary</h4>
                    <p>Total Sales: ${formatCurrency(totalSales)}</p>
                    <p>Number of Transactions: ${monthSales.length}</p>
                    <p>Average Transaction: ${formatCurrency(monthSales.length ? totalSales / monthSales.length : 0)}</p>
                </div>
                <div class="report-stat">
                    <h4>Expenses Summary</h4>
                    <p>Total Expenses: ${formatCurrency(totalExpenses)}</p>
                    <p>Number of Expenses: ${monthExpenses.length}</p>
                </div>
                <div class="report-stat">
                    <h4>Net Profit</h4>
                    <p>Monthly Net Profit: ${formatCurrency(totalSales - totalExpenses)}</p>
                    <p>Profit Margin: ${totalSales ? ((totalSales - totalExpenses) / totalSales * 100).toFixed(2) : 0}%</p>
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
                        ${Object.entries(salesByCategory).map(([category, amount]) => `
                            <tr>
                                <td>${category}</td>
                                <td>${formatCurrency(amount)}</td>
                                <td>${((amount / totalSales) * 100).toFixed(2)}%</td>
                            </tr>
                        `).join('')}
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
                        ${Object.entries(expensesByCategory).map(([category, amount]) => `
                            <tr>
                                <td>${category}</td>
                                <td>${formatCurrency(amount)}</td>
                                <td>${totalExpenses ? ((amount / totalExpenses) * 100).toFixed(2) : 0}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function exportReport() {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent || !reportContent.innerHTML.includes('report')) {
        showNotification('Please generate a report first', 'warning');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '', 'height=600,width=800');
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
    
    showNotification('Report exported for printing', 'success');
}
