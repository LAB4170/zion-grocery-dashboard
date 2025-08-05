// Report functions with table styling
function generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = data.sales.filter(sale => sale.date === today);
    const todaysExpenses = data.expenses.filter(expense => expense.date === today);
    
    const totalSales = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate payment method breakdown
    const cashSales = todaysSales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
    const mpesaSales = todaysSales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0);
    const debtSales = todaysSales.filter(s => s.paymentMethod === 'debt').reduce((sum, sale) => sum + sale.total, 0);
    
    const reportContent = `
        <h3 style="color: white; margin-bottom: 20px;">Daily Report - ${today}</h3>
        
        <!-- Summary Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: rgba(255,255,255,0.2);">
                    <th style="color: white; padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.3);">Metric</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Amount (KSh)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Total Sales</td>
                    <td style="color: #4ade80; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Total Expenses</td>
                    <td style="color: #f87171; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalExpenses.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Net Profit</td>
                    <td style="color: ${(totalSales - totalExpenses) >= 0 ? '#4ade80' : '#f87171'}; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${(totalSales - totalExpenses).toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px;">Number of Transactions</td>
                    <td style="color: white; padding: 12px; text-align: right; font-weight: bold;">${todaysSales.length}</td>
                </tr>
            </tbody>
        </table>

        <!-- Payment Method Breakdown Table -->
        <h4 style="color: white; margin-bottom: 15px;">Payment Method Breakdown</h4>
        <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: rgba(255,255,255,0.2);">
                    <th style="color: white; padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.3);">Payment Method</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Amount (KSh)</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Percentage</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Cash</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${cashSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">M-Pesa</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${mpesaSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales > 0 ? ((mpesaSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px;">Debts</td>
                    <td style="color: white; padding: 12px; text-align: right;">${debtSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right;">${totalSales > 0 ? ((debtSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
            </tbody>
        </table>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

function generateWeeklyReport() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklySales = data.sales.filter(sale => new Date(sale.date) >= weekAgo);
    const weeklyExpenses = data.expenses.filter(expense => new Date(expense.date) >= weekAgo);
    
    const totalSales = weeklySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate payment method breakdown
    const cashSales = weeklySales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
    const mpesaSales = weeklySales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0);
    const debtSales = weeklySales.filter(s => s.paymentMethod === 'debt').reduce((sum, sale) => sum + sale.total, 0);
    
    const reportContent = `
        <h3 style="color: white; margin-bottom: 20px;">Weekly Report - Last 7 Days</h3>
        
        <!-- Summary Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: rgba(255,255,255,0.2);">
                    <th style="color: white; padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.3);">Metric</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Amount (KSh)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Total Sales</td>
                    <td style="color: #4ade80; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Total Expenses</td>
                    <td style="color: #f87171; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalExpenses.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Net Profit</td>
                    <td style="color: ${(totalSales - totalExpenses) >= 0 ? '#4ade80' : '#f87171'}; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${(totalSales - totalExpenses).toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Number of Transactions</td>
                    <td style="color: white; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${weeklySales.length}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px;">Average Daily Sales</td>
                    <td style="color: white; padding: 12px; text-align: right; font-weight: bold;">${(totalSales / 7).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <!-- Payment Method Breakdown Table -->
        <h4 style="color: white; margin-bottom: 15px;">Payment Method Breakdown</h4>
        <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: rgba(255,255,255,0.2);">
                    <th style="color: white; padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.3);">Payment Method</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Amount (KSh)</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Percentage</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Cash</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${cashSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">M-Pesa</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${mpesaSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales > 0 ? ((mpesaSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px;">Debts</td>
                    <td style="color: white; padding: 12px; text-align: right;">${debtSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right;">${totalSales > 0 ? ((debtSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
            </tbody>
        </table>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

function generateMonthlyReport() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlySales = data.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });
    
    const monthlyExpenses = data.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const totalSales = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const outstandingDebts = data.debts.filter(debt => debt.status === 'pending').reduce((sum, debt) => sum + debt.amount, 0);
    
    // Calculate payment method breakdown
    const cashSales = monthlySales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
    const mpesaSales = monthlySales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, sale) => sum + sale.total, 0);
    const debtSales = monthlySales.filter(s => s.paymentMethod === 'debt').reduce((sum, sale) => sum + sale.total, 0);
    
    const reportContent = `
        <h3 style="color: white; margin-bottom: 20px;">Monthly Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        
        <!-- Summary Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: rgba(255,255,255,0.2);">
                    <th style="color: white; padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.3);">Metric</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Amount (KSh)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Total Sales</td>
                    <td style="color: #4ade80; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Total Expenses</td>
                    <td style="color: #f87171; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalExpenses.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Net Profit</td>
                    <td style="color: ${(totalSales - totalExpenses) >= 0 ? '#4ade80' : '#f87171'}; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${(totalSales - totalExpenses).toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Number of Transactions</td>
                    <td style="color: white; padding: 12px; text-align: right; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1);">${monthlySales.length}</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px;">Outstanding Debts</td>
                    <td style="color: #fbbf24; padding: 12px; text-align: right; font-weight: bold;">${outstandingDebts.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <!-- Payment Method Breakdown Table -->
        <h4 style="color: white; margin-bottom: 15px;">Payment Method Breakdown</h4>
        <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: rgba(255,255,255,0.2);">
                    <th style="color: white; padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.3);">Payment Method</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Amount (KSh)</th>
                    <th style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">Percentage</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">Cash</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${cashSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">M-Pesa</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${mpesaSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">${totalSales > 0 ? ((mpesaSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr>
                    <td style="color: white; padding: 12px;">Debts</td>
                    <td style="color: white; padding: 12px; text-align: right;">${debtSales.toFixed(2)}</td>
                    <td style="color: white; padding: 12px; text-align: right;">${totalSales > 0 ? ((debtSales / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
            </tbody>
        </table>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

function exportReport() {
    alert('Report export functionality would integrate with a PDF generation service in production.');
}
