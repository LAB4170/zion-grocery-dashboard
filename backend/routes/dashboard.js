const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Debt = require('../models/Debt');
const { catchAsync } = require('../middleware/errorHandler');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = {
  stats: 5 * 60 * 1000, // 5 minutes
  charts: 10 * 60 * 1000 // 10 minutes
};

// Simple cache helper functions
const getFromCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
};

const setCache = (key, data, ttlMs) => {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs
  });
};

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', catchAsync(async (req, res) => {
  const cacheKey = 'dashboard:stats';
  
  // Try to get from cache first
  let stats = getFromCache(cacheKey);
  
  if (!stats) {
    // Calculate stats from database
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get sales summary
    const salesSummary = await Sale.getSummary();
    const todaySales = await Sale.getSummary({
      date_from: startOfDay,
      date_to: today
    });
    const monthlySales = await Sale.getSummary({
      date_from: startOfMonth,
      date_to: today
    });
    
    // Get expenses summary
    const expensesSummary = await Expense.getSummary();
    const todayExpenses = await Expense.getSummary({
      date_from: startOfDay,
      date_to: today
    });
    const monthlyExpenses = await Expense.getSummary({
      date_from: startOfMonth,
      date_to: today
    });
    
    // Get debts summary
    const debtsSummary = await Debt.getSummary();
    const todayDebts = await Debt.getSummary({
      date_from: startOfDay,
      date_to: today
    });
    
    // Get low stock products count (guard against missing method)
    let lowStockProducts = [];
    if (Product && typeof Product.getLowStock === 'function') {
      lowStockProducts = await Product.getLowStock();
    } else {
      console.warn('dashboard.stats: Product.getLowStock() not available, defaulting to empty list');
    }
    
    stats = {
      sales: {
        total_revenue: salesSummary.total_revenue,
        total_sales: salesSummary.total_sales,
        cash_sales: salesSummary.cash_sales,
        mpesa_sales: salesSummary.mpesa_sales,
        debt_sales: salesSummary.debt_sales,
        today_revenue: todaySales.total_revenue,
        today_sales: todaySales.total_sales,
        monthly_revenue: monthlySales.total_revenue,
        monthly_sales: monthlySales.total_sales
      },
      expenses: {
        total_expenses: expensesSummary.total_amount,
        approved_expenses: expensesSummary.approved_amount,
        pending_expenses: expensesSummary.pending_amount,
        today_expenses: todayExpenses.total_amount,
        monthly_expenses: monthlyExpenses.total_amount
      },
      debts: {
        total_outstanding: debtsSummary.total_outstanding,
        total_debts: debtsSummary.total_debts,
        pending_debts: debtsSummary.pending_count,
        today_debts: todayDebts.total_amount
      },
      inventory: {
        low_stock_count: lowStockProducts.length,
        low_stock_products: lowStockProducts.slice(0, 5) // Top 5 low stock items
      }
    };
    
    // Cache for 5 minutes
    setCache(cacheKey, stats, CACHE_TTL.stats);
  }
  
  res.json({
    success: true,
    data: stats
  });
}));

// GET /api/dashboard/charts - Get chart data
router.get('/charts', catchAsync(async (req, res) => {
  const cacheKey = 'dashboard:charts';
  
  let chartData = getFromCache(cacheKey);
  
  if (!chartData) {
    // Get daily sales for the last 7 days
    const dailySales = await Sale.getDailySales(7);
    
    // Get top selling products
    const topProducts = await Sale.getTopProducts(10);
    
    // Get sales by payment method
    const salesSummary = await Sale.getSummary();
    const paymentDistribution = {
      cash: salesSummary.cash_sales,
      mpesa: salesSummary.mpesa_sales,
      debt: salesSummary.debt_sales
    };
    
    // Get expenses by category
    const expensesByCategory = await Expense.getByCategory();
    
    chartData = {
      daily_sales: dailySales,
      top_products: topProducts,
      payment_distribution: paymentDistribution,
      expenses_by_category: expensesByCategory
    };
    
    // Cache for 10 minutes
    setCache(cacheKey, chartData, CACHE_TTL.charts);
  }
  
  res.json({
    success: true,
    data: chartData
  });
}));

// GET /api/dashboard/weekly-expenses - Get weekly expenses (Mon–Sun)
router.get('/weekly-expenses', catchAsync(async (req, res) => {
  if (typeof Expense.getWeeklyExpenses !== 'function') {
    return res.status(501).json({ success: false, message: 'Weekly expenses not implemented' });
  }
  const weekly = await Expense.getWeeklyExpenses();
  res.json({ success: true, data: weekly });
}));

// GET /api/dashboard/recent-activities - Get recent activities
router.get('/recent-activities', catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  // Get recent sales
  const recentSales = await Sale.findAll({ limit: Math.ceil(limit / 2) });
  
  // Get recent expenses
  const recentExpenses = await Expense.findAll({ limit: Math.ceil(limit / 2) });
  
  // Combine and sort by date
  const activities = [
    ...recentSales.map(sale => ({
      id: sale.id,
      type: 'sale',
      description: `Sale: ${sale.product_name} (${sale.quantity} units)`,
      amount: sale.total,
      created_at: sale.created_at
    })),
    ...recentExpenses.map(expense => ({
      id: expense.id,
      type: 'expense',
      description: `Expense: ${expense.description}`,
      amount: expense.amount,
      created_at: expense.created_at
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
   .slice(0, limit);
  
  res.json({
    success: true,
    data: activities
  });
}));

// GET /api/dashboard/alerts - Get system alerts
router.get('/alerts', catchAsync(async (req, res) => {
  const alerts = [];
  
  // Low stock alerts
  const lowStockProducts = await Product.getLowStock();
  lowStockProducts.forEach(product => {
    alerts.push({
      type: 'warning',
      title: 'Low Stock Alert',
      message: `${product.name} is running low (${product.stock} remaining)`,
      created_at: new Date()
    });
  });
  
  // Overdue debts alerts
  const overdueDebts = await Debt.getOverdue();
  if (overdueDebts.length > 0) {
    alerts.push({
      type: 'error',
      title: 'Overdue Debts',
      message: `${overdueDebts.length} debt(s) are overdue`,
      created_at: new Date()
    });
  }
  
  // High expenses alert (if today's expenses > average)
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayExpenses = await Expense.getSummary({
    date_from: startOfDay,
    date_to: today
  });
  
  const monthlyExpenses = await Expense.getMonthlyExpenses(1);
  if (monthlyExpenses.length > 0) {
    const avgDailyExpense = monthlyExpenses[0].total_amount / 30;
    if (todayExpenses.total_amount > avgDailyExpense * 1.5) {
      alerts.push({
        type: 'warning',
        title: 'High Expenses',
        message: `Today's expenses (${todayExpenses.total_amount}) are above average`,
        created_at: new Date()
      });
    }
  }
  
  res.json({
    success: true,
    data: alerts
  });
}));

module.exports = router;
