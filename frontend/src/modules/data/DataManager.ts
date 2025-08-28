import { Sale, Product, Expense, Debt, ApiResponse } from '../../types/index.js';
import { ApiClient } from '../api/ApiClient.js';

export class DataManager {
  private apiClient: ApiClient;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.cache = new Map();
  }

  // Cache management
  private getCacheKey(type: string, id?: string): string {
    return id ? `${type}:${id}` : type;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return now - cached.timestamp < cached.ttl;
  }

  private setCache(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    if (this.isValidCache(key)) {
      return this.cache.get(key)?.data || null;
    }
    return null;
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Sales management
  async getSales(useCache: boolean = true): Promise<Sale[]> {
    const cacheKey = this.getCacheKey('sales');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const response = await this.apiClient.getSales();
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data);
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch sales');
  }

  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const response = await this.apiClient.createSale(sale);
    if (response.success && response.data) {
      this.invalidateCache('sales');
      this.invalidateCache('dashboard');
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to create sale');
  }

  async updateSale(id: string, sale: Partial<Sale>): Promise<Sale> {
    const response = await this.apiClient.updateSale(id, sale);
    if (response.success && response.data) {
      this.invalidateCache('sales');
      this.invalidateCache('dashboard');
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to update sale');
  }

  async deleteSale(id: string): Promise<void> {
    const response = await this.apiClient.deleteSale(id);
    if (response.success) {
      this.invalidateCache('sales');
      this.invalidateCache('dashboard');
      return;
    }
    
    throw new Error(response.error || 'Failed to delete sale');
  }

  // Products management
  async getProducts(useCache: boolean = true): Promise<Product[]> {
    const cacheKey = this.getCacheKey('products');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const response = await this.apiClient.getProducts();
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data);
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch products');
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const response = await this.apiClient.createProduct(product);
    if (response.success && response.data) {
      this.invalidateCache('products');
      this.invalidateCache('dashboard');
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to create product');
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const response = await this.apiClient.updateProduct(id, product);
    if (response.success && response.data) {
      this.invalidateCache('products');
      this.invalidateCache('dashboard');
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to update product');
  }

  async deleteProduct(id: string): Promise<void> {
    const response = await this.apiClient.deleteProduct(id);
    if (response.success) {
      this.invalidateCache('products');
      this.invalidateCache('dashboard');
      return;
    }
    
    throw new Error(response.error || 'Failed to delete product');
  }

  // Expenses management
  async getExpenses(useCache: boolean = true): Promise<Expense[]> {
    const cacheKey = this.getCacheKey('expenses');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const response = await this.apiClient.getExpenses();
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data);
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch expenses');
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const response = await this.apiClient.createExpense(expense);
    if (response.success && response.data) {
      this.invalidateCache('expenses');
      this.invalidateCache('dashboard');
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to create expense');
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    const response = await this.apiClient.updateExpense(id, expense);
    if (response.success && response.data) {
      this.invalidateCache('expenses');
      this.invalidateCache('dashboard');
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to update expense');
  }

  async deleteExpense(id: string): Promise<void> {
    const response = await this.apiClient.deleteExpense(id);
    if (response.success) {
      this.invalidateCache('expenses');
      this.invalidateCache('dashboard');
      return;
    }
    
    throw new Error(response.error || 'Failed to delete expense');
  }

  // Debts management
  async getDebts(useCache: boolean = true): Promise<Debt[]> {
    const cacheKey = this.getCacheKey('debts');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const response = await this.apiClient.getDebts();
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data);
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch debts');
  }

  async createDebt(debt: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt> {
    const response = await this.apiClient.createDebt(debt);
    if (response.success && response.data) {
      this.invalidateCache('debts');
      this.invalidateCache('dashboard');
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to create debt');
  }

  async updateDebt(id: string, debt: Partial<Debt>): Promise<Debt> {
    const response = await this.apiClient.updateDebt(id, debt);
    if (response.success && response.data) {
      this.invalidateCache('debts');
      this.invalidateCache('dashboard');
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to update debt');
  }

  async deleteDebt(id: string): Promise<void> {
    const response = await this.apiClient.deleteDebt(id);
    if (response.success) {
      this.invalidateCache('debts');
      this.invalidateCache('dashboard');
      return;
    }
    
    throw new Error(response.error || 'Failed to delete debt');
  }

  // Dashboard data
  async getDashboardStats(useCache: boolean = true): Promise<any> {
    const cacheKey = this.getCacheKey('dashboard', 'stats');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const response = await this.apiClient.getDashboardStats();
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data, 2 * 60 * 1000); // 2 minutes TTL for dashboard
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch dashboard stats');
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
