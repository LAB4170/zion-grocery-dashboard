import { ApiClient } from '../../modules/api/ApiClient.js';
import { Product, Sale, Expense, Debt } from '../../types/index.js';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockToken = 'mock-jwt-token';
  const mockUser = {
    id: '1',
    username: 'testuser',
    role: 'admin' as const
  };

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:5000/api', 5000);
    mockFetch.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
    mockSessionStorage.removeItem.mockClear();
  });

  describe('Authentication Flow', () => {
    it('should handle successful login and store JWT token', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          token: mockToken
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await apiClient.login('testuser', 'password');

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe(mockToken);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('authToken', mockToken);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'testuser', password: 'password' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      const result = await apiClient.login('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should include JWT token in authenticated requests', async () => {
      // Set up authenticated client
      apiClient.setAuthToken(mockToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
        status: 200,
        statusText: 'OK'
      } as Response);

      await apiClient.getProducts();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/products',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    it('should handle 401 errors by clearing token', async () => {
      apiClient.setAuthToken(mockToken);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Token expired' }),
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      const result = await apiClient.getProducts();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('Data Transformation', () => {
    it('should transform snake_case response to camelCase', async () => {
      const mockBackendResponse = {
        success: true,
        data: [
          {
            id: '1',
            product_name: 'Test Product',
            unit_price: 100.50,
            created_at: '2023-01-01T00:00:00Z',
            customer_phone: '+254700000000'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendResponse,
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await apiClient.getSales();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        {
          id: '1',
          productName: 'Test Product',
          unitPrice: 100.50,
          createdAt: '2023-01-01T00:00:00Z',
          customerPhone: '+254700000000'
        }
      ]);
    });

    it('should transform camelCase request to snake_case', async () => {
      const productData = {
        name: 'New Product',
        category: 'Electronics',
        price: 299.99,
        stock: 50,
        reorderLevel: 10
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '1', ...productData } }),
        status: 201,
        statusText: 'Created'
      } as Response);

      await apiClient.createProduct(productData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New Product',
            category: 'Electronics',
            price: 299.99,
            stock: 50,
            reorder_level: 10
          })
        })
      );
    });
  });

  describe('Products API', () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Test Product',
      category: 'Electronics',
      price: 299.99,
      stock: 50,
      createdAt: '2023-01-01T00:00:00Z'
    };

    it('should get all products', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [mockProduct] }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await apiClient.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockProduct]);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/products',
        expect.objectContaining({ method: undefined })
      );
    });

    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        category: 'Electronics',
        price: 199.99,
        stock: 25
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '2', ...newProduct, createdAt: '2023-01-01T00:00:00Z' } }),
        status: 201,
        statusText: 'Created'
      } as Response);

      const result = await apiClient.createProduct(newProduct);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(newProduct.name);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newProduct)
        })
      );
    });

    it('should update a product', async () => {
      const updateData = { price: 249.99, stock: 30 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockProduct, ...updateData } }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await apiClient.updateProduct('1', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.price).toBe(updateData.price);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/products/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
    });

    it('should delete a product', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Product deleted successfully' }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await apiClient.deleteProduct('1');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/products/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Sales API', () => {
    const mockSale: Sale = {
      id: '1',
      productId: '1',
      productName: 'Test Product',
      quantity: 2,
      unitPrice: 299.99,
      total: 599.98,
      paymentMethod: 'cash',
      status: 'completed',
      createdAt: '2023-01-01T00:00:00Z',
      date: '2023-01-01'
    };

    it('should get all sales', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [mockSale] }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await apiClient.getSales();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockSale]);
    });

    it('should create a new sale', async () => {
      const newSale = {
        productId: '1',
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 299.99,
        total: 299.99,
        paymentMethod: 'mpesa' as const,
        status: 'completed' as const,
        date: '2023-01-01'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '2', ...newSale, createdAt: '2023-01-01T00:00:00Z' } }),
        status: 201,
        statusText: 'Created'
      } as Response);

      const result = await apiClient.createSale(newSale);

      expect(result.success).toBe(true);
      expect(result.data?.paymentMethod).toBe('mpesa');
    });
  });

  describe('Dashboard API', () => {
    it('should get dashboard stats', async () => {
      const mockStats = {
        totalSales: 1000,
        cashTotal: 500,
        todaysDebts: 200,
        dailyExpenses: 100
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await apiClient.getDashboardStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/dashboard/stats',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getProducts();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle timeout errors', async () => {
      // Create client with very short timeout
      const shortTimeoutClient = new ApiClient('http://localhost:5000/api', 1);
      
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const result = await shortTimeoutClient.getProducts();

      expect(result.success).toBe(false);
      expect(result.error).toContain('aborted');
    });

    it('should handle server errors with proper messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Internal server error', message: 'Database connection failed' }),
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const result = await apiClient.getProducts();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('Health Check', () => {
    it('should perform health check with authentication status', async () => {
      apiClient.setAuthToken(mockToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: 'OK', 
          timestamp: '2023-01-01T00:00:00Z' 
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await apiClient.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('OK');
      expect(result.data?.authenticated).toBe(true);
    });
  });
});
