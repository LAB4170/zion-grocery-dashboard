import { ChartData, Sale, Expense } from '../../types/index.js';
import { CurrencyUtils } from '../utils/CurrencyUtils.js';
import { DateUtils } from '../utils/DateUtils.js';

export class ChartGenerator {
  static generateSalesChart(sales: Sale[], period: 'daily' | 'weekly' | 'monthly' = 'daily'): ChartData {
    const salesByPeriod = this.groupSalesByPeriod(sales, period);
    
    return {
      labels: Object.keys(salesByPeriod),
      datasets: [{
        label: 'Sales Revenue',
        data: Object.values(salesByPeriod),
        backgroundColor: '#4CAF50',
        borderColor: '#45a049',
        borderWidth: 2
      }]
    };
  }

  static generateExpenseChart(expenses: Expense[], period: 'daily' | 'weekly' | 'monthly' = 'daily'): ChartData {
    const expensesByPeriod = this.groupExpensesByPeriod(expenses, period);
    
    return {
      labels: Object.keys(expensesByPeriod),
      datasets: [{
        label: 'Expenses',
        data: Object.values(expensesByPeriod),
        backgroundColor: '#F44336',
        borderColor: '#d32f2f',
        borderWidth: 2
      }]
    };
  }

  static generateProfitChart(sales: Sale[], expenses: Expense[], period: 'daily' | 'weekly' | 'monthly' = 'daily'): ChartData {
    const salesByPeriod = this.groupSalesByPeriod(sales, period);
    const expensesByPeriod = this.groupExpensesByPeriod(expenses, period);
    
    const allPeriods = new Set([...Object.keys(salesByPeriod), ...Object.keys(expensesByPeriod)]);
    const labels = Array.from(allPeriods).sort();
    
    const profitData = labels.map(period => {
      const revenue = salesByPeriod[period] || 0;
      const expense = expensesByPeriod[period] || 0;
      return revenue - expense;
    });

    return {
      labels,
      datasets: [{
        label: 'Net Profit',
        data: profitData,
        backgroundColor: profitData.map(profit => profit >= 0 ? '#4CAF50' : '#F44336'),
        borderColor: '#2196F3',
        borderWidth: 2
      }]
    };
  }

  static generateCategoryChart(sales: Sale[], products: any[]): ChartData {
    const categoryTotals: Record<string, number> = {};
    
    sales.forEach(sale => {
      const product = products.find(p => p.id === sale.productId);
      const category = product?.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + (sale.total || 0);
    });

    return {
      labels: Object.keys(categoryTotals),
      datasets: [{
        label: 'Sales by Category',
        data: Object.values(categoryTotals),
        backgroundColor: [
          '#4CAF50', '#2196F3', '#FF9800', '#F44336',
          '#9C27B0', '#607D8B', '#795548', '#E91E63'
        ]
      }]
    };
  }

  static generatePaymentMethodChart(sales: Sale[]): ChartData {
    const paymentTotals: Record<string, number> = {};
    
    sales.forEach(sale => {
      const method = sale.paymentMethod || 'Unknown';
      paymentTotals[method] = (paymentTotals[method] || 0) + (sale.total || 0);
    });

    return {
      labels: Object.keys(paymentTotals),
      datasets: [{
        label: 'Payment Methods',
        data: Object.values(paymentTotals),
        backgroundColor: ['#4CAF50', '#2196F3', '#FF9800']
      }]
    };
  }

  private static groupSalesByPeriod(sales: Sale[], period: 'daily' | 'weekly' | 'monthly'): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.createdAt || sale.date);
      let key: string;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      grouped[key] = (grouped[key] || 0) + (sale.total || 0);
    });
    
    return grouped;
  }

  private static groupExpensesByPeriod(expenses: Expense[], period: 'daily' | 'weekly' | 'monthly'): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date || expense.createdAt);
      let key: string;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      grouped[key] = (grouped[key] || 0) + (expense.amount || 0);
    });
    
    return grouped;
  }
}
