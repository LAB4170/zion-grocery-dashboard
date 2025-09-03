// Core data types for Zion Grocery Dashboard

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  barcode?: string;
  supplier?: string;
  reorderLevel?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: 'cash' | 'mpesa' | 'debt';
  customerName?: string;
  customerPhone?: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
  date: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Debt {
  id: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  paidAt?: string;
  saleId?: string;
}

export interface DashboardStats {
  totalSales: number;
  cashTotal: number;
  todaysDebts: number;
  dailyExpenses: number;
  monthlySales: number;
  monthlyExpenses: number;
  outstandingDebt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface UserSession {
  username: string;
  role: 'admin';
  loginTime: string;
  isAuthenticated: boolean;
}

export interface ReportData {
  period: string;
  sales: Sale[];
  expenses: Expense[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  categoryBreakdown: Record<string, number>;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface FilterOptions {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  status?: string;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
