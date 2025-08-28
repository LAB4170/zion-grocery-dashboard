import { Sale, Expense, ReportData } from '../../types/index.js';
import { CurrencyUtils } from '../utils/CurrencyUtils.js';
import { DateUtils } from '../utils/DateUtils.js';

export class ExportManager {
  static exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  static exportSalesToCSV(sales: Sale[], filename: string = 'sales_report'): void {
    const formattedSales = sales.map(sale => ({
      'Date': DateUtils.formatDate(sale.createdAt || sale.date),
      'Product': sale.productName || 'Unknown',
      'Quantity': sale.quantity || 0,
      'Unit Price': CurrencyUtils.formatCurrency(sale.unitPrice || 0),
      'Total': CurrencyUtils.formatCurrency(sale.total || 0),
      'Payment Method': sale.paymentMethod || 'Unknown',
      'Customer': sale.customerName || 'Walk-in',
      'Phone': sale.customerPhone || 'N/A',
      'Status': sale.status || 'Completed'
    }));

    this.exportToCSV(formattedSales, filename);
  }

  static exportExpensesToCSV(expenses: Expense[], filename: string = 'expenses_report'): void {
    const formattedExpenses = expenses.map(expense => ({
      'Date': DateUtils.formatDate(expense.date || expense.createdAt),
      'Description': expense.description || 'N/A',
      'Category': expense.category || 'General',
      'Amount': CurrencyUtils.formatCurrency(expense.amount || 0),
      'Payment Method': expense.paymentMethod || 'Cash',
      'Status': expense.status || 'Pending'
    }));

    this.exportToCSV(formattedExpenses, filename);
  }

  static exportReportToPDF(reportData: ReportData, filename: string = 'report'): void {
    // Create HTML content for PDF
    const htmlContent = this.generateReportHTML(reportData);
    
    // For now, open in new window for printing
    // In production, you'd use a library like jsPDF or html2pdf
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto-trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }

  static exportToJSON(data: any, filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  private static generateReportHTML(reportData: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Zion Grocery - ${reportData.period} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .summary-card h3 { margin: 0 0 10px 0; color: #333; }
          .summary-card .amount { font-size: 1.5em; font-weight: bold; }
          .positive { color: #4CAF50; }
          .negative { color: #F44336; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Zion Grocery Dashboard</h1>
          <h2>${reportData.period} Report</h2>
          <p>Generated on ${DateUtils.formatDateTime(new Date().toISOString())}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Total Revenue</h3>
            <div class="amount positive">${CurrencyUtils.formatCurrency(reportData.totalRevenue)}</div>
          </div>
          <div class="summary-card">
            <h3>Total Expenses</h3>
            <div class="amount negative">${CurrencyUtils.formatCurrency(reportData.totalExpenses)}</div>
          </div>
          <div class="summary-card">
            <h3>Net Profit</h3>
            <div class="amount ${reportData.netProfit >= 0 ? 'positive' : 'negative'}">
              ${CurrencyUtils.formatCurrency(reportData.netProfit)}
            </div>
          </div>
        </div>

        <h3>Sales Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.sales.map(sale => `
              <tr>
                <td>${DateUtils.formatDate(sale.createdAt || sale.date)}</td>
                <td>${sale.productName || 'Unknown'}</td>
                <td>${sale.quantity || 0}</td>
                <td>${CurrencyUtils.formatCurrency(sale.total || 0)}</td>
                <td>${sale.paymentMethod || 'Unknown'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Expenses Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.expenses.map(expense => `
              <tr>
                <td>${DateUtils.formatDate(expense.date || expense.createdAt)}</td>
                <td>${expense.description || 'N/A'}</td>
                <td>${expense.category || 'General'}</td>
                <td>${CurrencyUtils.formatCurrency(expense.amount || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
}
