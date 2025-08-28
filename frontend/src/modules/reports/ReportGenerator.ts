import { Sale, Expense, Product, ReportData, ChartData } from '../../types/index.js';
import { DateUtils } from '../utils/DateUtils.js';
import { CurrencyUtils } from '../utils/CurrencyUtils.js';

export class ReportGenerator {
  private sales: Sale[] = [];
  private expenses: Expense[] = [];
  private products: Product[] = [];

  constructor(sales: Sale[], expenses: Expense[], products: Product[]) {
    this.sales = sales;
    this.expenses = expenses;
    this.products = products;
  }

  generateDailyReport(date: string): ReportData {
    const targetDate = new Date(date);
    const dailySales = this.filterSalesByDate(this.sales, targetDate, targetDate);
    const dailyExpenses = this.filterExpensesByDate(this.expenses, targetDate, targetDate);

    return this.buildReportData('Daily', dailySales, dailyExpenses);
  }

  generateWeeklyReport(startDate: string): ReportData {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const weeklySales = this.filterSalesByDate(this.sales, start, end);
    const weeklyExpenses = this.filterExpensesByDate(this.expenses, start, end);

    return this.buildReportData('Weekly', weeklySales, weeklyExpenses);
  }

  generateMonthlyReport(year: number, month: number): ReportData {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const monthlySales = this.filterSalesByDate(this.sales, start, end);
    const monthlyExpenses = this.filterExpensesByDate(this.expenses, start, end);

    return this.buildReportData('Monthly', monthlySales, monthlyExpenses);
  }

  generateCategoryBreakdown(sales: Sale[]): Record<string, { total: number; count: number; products: Record<string, { quantity: number; revenue: number; transactions: number }> }> {
    const categoryData: Record<string, any> = {};

    sales.forEach(sale => {
      const product = this.products.find(p => p.id === sale.productId);
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

    return categoryData;
  }

  generatePaymentMethodBreakdown(sales: Sale[]): ChartData {
    const paymentData: Record<string, number> = {};

    sales.forEach(sale => {
      const method = sale.paymentMethod || 'unknown';
      paymentData[method] = (paymentData[method] || 0) + (sale.total || 0);
    });

    return {
      labels: Object.keys(paymentData),
      datasets: [{
        label: 'Payment Methods',
        data: Object.values(paymentData),
        backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#F44336']
      }]
    };
  }

  private filterSalesByDate(sales: Sale[], startDate: Date, endDate: Date): Sale[] {
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }

  private filterExpensesByDate(expenses: Expense[], startDate: Date, endDate: Date): Expense[] {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  private buildReportData(period: string, sales: Sale[], expenses: Expense[]): ReportData {
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const categoryBreakdown = this.generateCategoryBreakdown(sales);

    return {
      period,
      sales,
      expenses,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      categoryBreakdown: Object.fromEntries(
        Object.entries(categoryBreakdown).map(([key, value]) => [key, value.total])
      )
    };
  }
}
