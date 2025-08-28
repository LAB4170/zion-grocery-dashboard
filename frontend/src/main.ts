import { ApiClient } from './modules/api/ApiClient.js';
import { DataManager } from './modules/data/DataManager.js';
import { ReportGenerator } from './modules/reports/ReportGenerator.js';
import { ChartGenerator } from './modules/reports/ChartGenerator.js';
import { ExportManager } from './modules/reports/ExportManager.js';
import { DateUtils } from './modules/utils/DateUtils.js';
import { CurrencyUtils } from './modules/utils/CurrencyUtils.js';

// Import styles
import './styles/scss/main.scss';

// Global application state
interface AppState {
  apiClient: ApiClient;
  dataManager: DataManager;
  currentUser: any;
  currentSection: string;
}

class ZionGroceryApp {
  private state: AppState;
  private charts: Map<string, any> = new Map();

  constructor() {
    // Initialize API client and data manager
    const apiClient = new ApiClient();
    const dataManager = new DataManager(apiClient);

    this.state = {
      apiClient,
      dataManager,
      currentUser: null,
      currentSection: 'dashboard'
    };

    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Check authentication
      await this.checkAuthentication();
      
      // Initialize UI components
      this.initializeEventListeners();
      this.initializeNavigation();
      
      // Load initial data
      await this.loadDashboardData();
      
      console.log('✅ Zion Grocery Dashboard initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  private async checkAuthentication(): Promise<void> {
    const sessionData = localStorage.getItem('zion_session');
    if (!sessionData) {
      window.location.href = '/login.html';
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      this.state.currentUser = session.user;
    } catch (error) {
      console.error('Invalid session data:', error);
      localStorage.removeItem('zion_session');
      window.location.href = '/login.html';
    }
  }

  private initializeEventListeners(): void {
    // Modal close buttons
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('close-modal') || target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
    });

    // Form submissions
    document.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      this.handleFormSubmission(form);
    });

    // Search functionality
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('search-input')) {
        this.handleSearch(target);
      }
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }

  private initializeNavigation(): void {
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = (e.target as HTMLElement).getAttribute('data-section');
        if (section) {
          this.navigateToSection(section);
        }
      });
    });
  }

  private async navigateToSection(section: string): Promise<void> {
    try {
      // Update active navigation
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

      // Hide all sections
      document.querySelectorAll('.main-section').forEach(sec => {
        sec.classList.remove('active');
      });

      // Show target section
      const targetSection = document.getElementById(section);
      if (targetSection) {
        targetSection.classList.add('active');
        this.state.currentSection = section;

        // Load section-specific data
        await this.loadSectionData(section);
      }
    } catch (error) {
      console.error(`Failed to navigate to ${section}:`, error);
      this.showError(`Failed to load ${section} section`);
    }
  }

  private async loadSectionData(section: string): Promise<void> {
    switch (section) {
      case 'dashboard':
        await this.loadDashboardData();
        break;
      case 'sales':
        await this.loadSalesData();
        break;
      case 'products':
        await this.loadProductsData();
        break;
      case 'expenses':
        await this.loadExpensesData();
        break;
      case 'debts':
        await this.loadDebtsData();
        break;
      case 'reports':
        await this.loadReportsData();
        break;
    }
  }

  private async loadDashboardData(): Promise<void> {
    try {
      const [sales, products, expenses, debts] = await Promise.all([
        this.state.dataManager.getSales(),
        this.state.dataManager.getProducts(),
        this.state.dataManager.getExpenses(),
        this.state.dataManager.getDebts()
      ]);

      this.updateDashboardStats(sales, products, expenses, debts);
      this.updateDashboardCharts(sales, expenses);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.showError('Failed to load dashboard data');
    }
  }

  private updateDashboardStats(sales: any[], products: any[], expenses: any[], debts: any[]): void {
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalDebts = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
    const lowStockProducts = products.filter(p => (p.stock || 0) < 10).length;

    // Update stat cards
    this.updateStatCard('total-revenue', CurrencyUtils.formatCurrency(totalRevenue));
    this.updateStatCard('total-expenses', CurrencyUtils.formatCurrency(totalExpenses));
    this.updateStatCard('net-profit', CurrencyUtils.formatCurrency(totalRevenue - totalExpenses));
    this.updateStatCard('total-debts', CurrencyUtils.formatCurrency(totalDebts));
    this.updateStatCard('low-stock-count', lowStockProducts.toString());
  }

  private updateStatCard(id: string, value: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  private async updateDashboardCharts(sales: any[], expenses: any[]): Promise<void> {
    // Sales chart
    const salesChartData = ChartGenerator.generateSalesChart(sales, 'daily');
    await this.renderChart('sales-chart', 'line', salesChartData);

    // Payment methods chart
    const paymentChartData = ChartGenerator.generatePaymentMethodChart(sales);
    await this.renderChart('payment-chart', 'doughnut', paymentChartData);
  }

  private async renderChart(canvasId: string, type: string, data: any): Promise<void> {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    // Dynamically import Chart.js to enable code splitting
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const chart = new Chart(canvas, {
      type: type as any,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    this.charts.set(canvasId, chart);
  }

  private async loadSalesData(): Promise<void> {
    try {
      const sales = await this.state.dataManager.getSales();
      this.renderSalesTable(sales);
    } catch (error) {
      console.error('Failed to load sales data:', error);
      this.showError('Failed to load sales data');
    }
  }

  private async loadProductsData(): Promise<void> {
    try {
      const products = await this.state.dataManager.getProducts();
      this.renderProductsTable(products);
    } catch (error) {
      console.error('Failed to load products data:', error);
      this.showError('Failed to load products data');
    }
  }

  private async loadExpensesData(): Promise<void> {
    try {
      const expenses = await this.state.dataManager.getExpenses();
      this.renderExpensesTable(expenses);
    } catch (error) {
      console.error('Failed to load expenses data:', error);
      this.showError('Failed to load expenses data');
    }
  }

  private async loadDebtsData(): Promise<void> {
    try {
      const debts = await this.state.dataManager.getDebts();
      this.renderDebtsTable(debts);
    } catch (error) {
      console.error('Failed to load debts data:', error);
      this.showError('Failed to load debts data');
    }
  }

  private async loadReportsData(): Promise<void> {
    try {
      const [sales, expenses, products] = await Promise.all([
        this.state.dataManager.getSales(),
        this.state.dataManager.getExpenses(),
        this.state.dataManager.getProducts()
      ]);

      const reportGenerator = new ReportGenerator(sales, expenses, products);
      const monthlyReport = reportGenerator.generateMonthlyReport(2024, new Date().getMonth() + 1);
      
      this.renderReportData(monthlyReport);
    } catch (error) {
      console.error('Failed to load reports data:', error);
      this.showError('Failed to load reports data');
    }
  }

  private renderSalesTable(sales: any[]): void {
    const tableBody = document.querySelector('#sales-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = sales.map(sale => `
      <tr>
        <td>${DateUtils.formatDate(sale.createdAt || sale.date)}</td>
        <td>${sale.productName || 'Unknown'}</td>
        <td>${sale.quantity || 0}</td>
        <td>${CurrencyUtils.formatCurrency(sale.total || 0)}</td>
        <td><span class="badge badge-${sale.paymentMethod?.toLowerCase()}">${sale.paymentMethod || 'Unknown'}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="app.viewSale('${sale.id}')">View</button>
          <button class="btn btn-sm btn-danger" onclick="app.deleteSale('${sale.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  private renderProductsTable(products: any[]): void {
    const tableBody = document.querySelector('#products-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = products.map(product => `
      <tr>
        <td>${product.name || 'Unknown'}</td>
        <td><span class="badge badge-secondary">${product.category || 'General'}</span></td>
        <td>${CurrencyUtils.formatCurrency(product.price || 0)}</td>
        <td>
          <span class="stock-indicator ${(product.stock || 0) < 10 ? 'low-stock' : 'normal-stock'}">
            ${product.stock || 0}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="app.editProduct('${product.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="app.deleteProduct('${product.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  private renderExpensesTable(expenses: any[]): void {
    const tableBody = document.querySelector('#expenses-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = expenses.map(expense => `
      <tr>
        <td>${DateUtils.formatDate(expense.date || expense.createdAt)}</td>
        <td>${expense.description || 'N/A'}</td>
        <td><span class="badge badge-info">${expense.category || 'General'}</span></td>
        <td>${CurrencyUtils.formatCurrency(expense.amount || 0)}</td>
        <td><span class="badge badge-${expense.status?.toLowerCase()}">${expense.status || 'Pending'}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="app.editExpense('${expense.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="app.deleteExpense('${expense.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  private renderDebtsTable(debts: any[]): void {
    const tableBody = document.querySelector('#debts-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = debts.map(debt => `
      <tr>
        <td>${debt.customerName || 'Unknown'}</td>
        <td>${debt.customerPhone || 'N/A'}</td>
        <td>${CurrencyUtils.formatCurrency(debt.amount || 0)}</td>
        <td>${DateUtils.formatDate(debt.dueDate)}</td>
        <td><span class="badge badge-${debt.status?.toLowerCase()}">${debt.status || 'Pending'}</span></td>
        <td>
          <button class="btn btn-sm btn-success" onclick="app.payDebt('${debt.id}')">Pay</button>
          <button class="btn btn-sm btn-primary" onclick="app.editDebt('${debt.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="app.deleteDebt('${debt.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  private renderReportData(reportData: any): void {
    const reportContainer = document.getElementById('report-content');
    if (!reportContainer) return;

    reportContainer.innerHTML = `
      <div class="report-summary">
        <h3>${reportData.period} Report Summary</h3>
        <div class="summary-cards">
          <div class="summary-card">
            <h4>Total Revenue</h4>
            <p class="amount positive">${CurrencyUtils.formatCurrency(reportData.totalRevenue)}</p>
          </div>
          <div class="summary-card">
            <h4>Total Expenses</h4>
            <p class="amount negative">${CurrencyUtils.formatCurrency(reportData.totalExpenses)}</p>
          </div>
          <div class="summary-card">
            <h4>Net Profit</h4>
            <p class="amount ${reportData.netProfit >= 0 ? 'positive' : 'negative'}">
              ${CurrencyUtils.formatCurrency(reportData.netProfit)}
            </p>
          </div>
        </div>
        <div class="export-buttons">
          <button class="btn btn-primary" onclick="app.exportReport('csv')">Export CSV</button>
          <button class="btn btn-secondary" onclick="app.exportReport('pdf')">Export PDF</button>
        </div>
      </div>
    `;
  }

  private async handleFormSubmission(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const formType = form.getAttribute('data-form-type');

    try {
      switch (formType) {
        case 'sale':
          await this.handleSaleForm(formData);
          break;
        case 'product':
          await this.handleProductForm(formData);
          break;
        case 'expense':
          await this.handleExpenseForm(formData);
          break;
        case 'debt':
          await this.handleDebtForm(formData);
          break;
      }

      this.closeModal();
      await this.loadSectionData(this.state.currentSection);
      this.showSuccess('Operation completed successfully');
    } catch (error) {
      console.error('Form submission failed:', error);
      this.showError('Operation failed. Please try again.');
    }
  }

  private async handleSaleForm(formData: FormData): Promise<void> {
    const saleData = {
      productId: formData.get('productId') as string,
      productName: formData.get('productName') as string,
      quantity: parseInt(formData.get('quantity') as string),
      unitPrice: parseFloat(formData.get('unitPrice') as string),
      total: parseFloat(formData.get('total') as string),
      paymentMethod: formData.get('paymentMethod') as string,
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string
    };

    await this.state.dataManager.createSale(saleData);
  }

  private async handleProductForm(formData: FormData): Promise<void> {
    const productData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string)
    };

    await this.state.dataManager.createProduct(productData);
  }

  private async handleExpenseForm(formData: FormData): Promise<void> {
    const expenseData = {
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      amount: parseFloat(formData.get('amount') as string),
      paymentMethod: formData.get('paymentMethod') as string,
      date: formData.get('date') as string
    };

    await this.state.dataManager.createExpense(expenseData);
  }

  private async handleDebtForm(formData: FormData): Promise<void> {
    const debtData = {
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      amount: parseFloat(formData.get('amount') as string),
      dueDate: formData.get('dueDate') as string,
      description: formData.get('description') as string
    };

    await this.state.dataManager.createDebt(debtData);
  }

  private handleSearch(input: HTMLInputElement): void {
    const searchTerm = input.value.toLowerCase();
    const tableId = input.getAttribute('data-table');
    
    if (tableId) {
      const table = document.getElementById(tableId);
      const rows = table?.querySelectorAll('tbody tr');
      
      rows?.forEach(row => {
        const text = row.textContent?.toLowerCase() || '';
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    }
  }

  private closeModal(): void {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
  }

  private showError(message: string): void {
    this.showNotification(message, 'error');
  }

  private showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  private logout(): void {
    localStorage.removeItem('zion_session');
    window.location.href = '/login.html';
  }

  // Public methods for global access
  public async exportReport(format: 'csv' | 'pdf'): Promise<void> {
    try {
      const [sales, expenses] = await Promise.all([
        this.state.dataManager.getSales(),
        this.state.dataManager.getExpenses()
      ]);

      if (format === 'csv') {
        ExportManager.exportSalesToCSV(sales, 'sales_report');
      } else {
        const reportGenerator = new ReportGenerator(sales, expenses, []);
        const reportData = reportGenerator.generateMonthlyReport(2024, new Date().getMonth() + 1);
        ExportManager.exportReportToPDF(reportData, 'monthly_report');
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Export failed. Please try again.');
    }
  }

  public async deleteSale(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        await this.state.dataManager.deleteSale(id);
        await this.loadSectionData(this.state.currentSection);
        this.showSuccess('Sale deleted successfully');
      } catch (error) {
        console.error('Delete failed:', error);
        this.showError('Failed to delete sale');
      }
    }
  }

  public async deleteProduct(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await this.state.dataManager.deleteProduct(id);
        await this.loadSectionData(this.state.currentSection);
        this.showSuccess('Product deleted successfully');
      } catch (error) {
        console.error('Delete failed:', error);
        this.showError('Failed to delete product');
      }
    }
  }

  public async deleteExpense(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await this.state.dataManager.deleteExpense(id);
        await this.loadSectionData(this.state.currentSection);
        this.showSuccess('Expense deleted successfully');
      } catch (error) {
        console.error('Delete failed:', error);
        this.showError('Failed to delete expense');
      }
    }
  }

  public async deleteDebt(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this debt?')) {
      try {
        await this.state.dataManager.deleteDebt(id);
        await this.loadSectionData(this.state.currentSection);
        this.showSuccess('Debt deleted successfully');
      } catch (error) {
        console.error('Delete failed:', error);
        this.showError('Failed to delete debt');
      }
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  (window as any).app = new ZionGroceryApp();
});

// Export for global access
export default ZionGroceryApp;
