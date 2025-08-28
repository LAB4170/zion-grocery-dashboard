import { Sale, Product, Expense, Debt, User, ApiResponse } from '../../types/index.js';

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:5000/api', timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.loadAuthToken();
  }

  // Load JWT token from sessionStorage
  private loadAuthToken(): void {
    this.authToken = sessionStorage.getItem('authToken');
  }

  // Set JWT token and save to sessionStorage
  public setAuthToken(token: string): void {
    this.authToken = token;
    sessionStorage.setItem('authToken', token);
  }

  // Clear JWT token
  public clearAuthToken(): void {
    this.authToken = null;
    sessionStorage.removeItem('authToken');
  }

  // Transform snake_case to camelCase
  private toCamelCase(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item));
    }

    const camelCaseObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        camelCaseObj[camelKey] = this.toCamelCase(obj[key]);
      }
    }
    return camelCaseObj;
  }

  // Transform camelCase to snake_case for API requests
  private toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item));
    }

    const snakeCaseObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeCaseObj[snakeKey] = this.toSnakeCase(obj[key]);
      }
    }
    return snakeCaseObj;
  }

  // Generic request method with error handling and transformations
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Prepare headers with JWT token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Transform request body to snake_case if present
      let body = options.body;
      if (body && typeof body === 'string') {
        try {
          const parsedBody = JSON.parse(body);
          body = JSON.stringify(this.toSnakeCase(parsedBody));
        } catch (e) {
          // Keep original body if parsing fails
        }
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        body,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.clearAuthToken();
          throw new Error('Authentication required. Please log in again.');
        }
        
        throw new Error(
          responseData.message || 
          responseData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Transform response data to camelCase
      const transformedData = this.toCamelCase(responseData.data || responseData);

      return { 
        success: true, 
        data: transformedData,
        message: responseData.message
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`API request failed for ${endpoint}:`, error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return { 
        success: false, 
        data: null as any, 
        error: errorMessage
      };
    }
  }

  // Sales API methods
  async getSales(): Promise<ApiResponse<Sale[]>> {
    return this.request<Sale[]>('/sales');
  }

  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<ApiResponse<Sale>> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, sale: Partial<Sale>): Promise<ApiResponse<Sale>> {
    return this.request<Sale>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sale),
    });
  }

  async deleteSale(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/sales/${id}`, {
      method: 'DELETE',
    });
  }

  // Products API methods
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/products');
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<ApiResponse<Product>> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Expenses API methods
  async getExpenses(): Promise<ApiResponse<Expense[]>> {
    return this.request<Expense[]>('/expenses');
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<ApiResponse<Expense>> {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<ApiResponse<Expense>> {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Debts API methods
  async getDebts(): Promise<ApiResponse<Debt[]>> {
    return this.request<Debt[]>('/debts');
  }

  async createDebt(debt: Omit<Debt, 'id' | 'createdAt'>): Promise<ApiResponse<Debt>> {
    return this.request<Debt>('/debts', {
      method: 'POST',
      body: JSON.stringify(debt),
    });
  }

  async updateDebt(id: string, debt: Partial<Debt>): Promise<ApiResponse<Debt>> {
    return this.request<Debt>(`/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(debt),
    });
  }

  async deleteDebt(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/debts/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard API methods
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/dashboard/stats');
  }

  async getRecentActivity(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/dashboard/recent-activity');
  }

  // Authentication API methods with JWT handling
  async login(username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Store JWT token if login successful
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
    });

    // Clear token regardless of response
    this.clearAuthToken();
    return response;
  }

  // Verify current JWT token
  async verifyToken(): Promise<ApiResponse<{ user: User; valid: boolean }>> {
    if (!this.authToken) {
      return {
        success: false,
        data: null as any,
        error: 'No authentication token found'
      };
    }

    return this.request<{ user: User; valid: boolean }>('/auth/verify');
  }

  // Health check with authentication status
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; authenticated: boolean }>> {
    const response = await this.request<{ status: string; timestamp: string }>('/health');
    
    if (response.success) {
      return {
        ...response,
        data: {
          ...response.data,
          authenticated: !!this.authToken
        }
      };
    }
    
    return response as ApiResponse<{ status: string; timestamp: string; authenticated: boolean }>;
  }

  // Batch operations
  async batchCreateSales(sales: Omit<Sale, 'id' | 'createdAt'>[]): Promise<ApiResponse<Sale[]>> {
    return this.request<Sale[]>('/sales/batch', {
      method: 'POST',
      body: JSON.stringify({ sales }),
    });
  }

  async batchUpdateProducts(updates: { id: string; data: Partial<Product> }[]): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/products/batch', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
  }
}
