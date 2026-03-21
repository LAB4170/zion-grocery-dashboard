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
    
    try {
      // Get sales summary
      const salesSummary = (await Sale.getSummary()) || {};
      const todaySales = (await Sale.getSummary({ date_from: startOfDay, date_to: today })) || {};
      const monthlySales = (await Sale.getSummary({ date_from: startOfMonth, date_to: today })) || {};
      
      // Get expenses summary
      const expensesSummary = (await Expense.getSummary()) || {};
      const todayExpenses = (await Expense.getSummary({ date_from: startOfDay, date_to: today })) || {};
      const monthlyExpenses = (await Expense.getSummary({ date_from: startOfMonth, date_to: today })) || {};
      
      // Get debts summary
      const debtsSummary = (await Debt.getSummary()) || {};
      const todayDebts = (await Debt.getSummary({ date_from: startOfDay, date_to: today })) || {};
      
      // Get low stock
      const lowStockProducts = (await Product.getLowStock()) || [];
      const inventoryValuation = (await Product.getValuation()) || 0;
      
      stats = {
        sales: {
          total_revenue: Number(salesSummary.total_revenue || 0),
          total_sales: Number(salesSummary.total_sales || 0),
          cash_sales: Number(salesSummary.cash_sales || 0),
          mpesa_sales: Number(salesSummary.mpesa_sales || 0),
          debt_sales: Number(salesSummary.debt_sales || 0),
          today_revenue: Number(todaySales.total_revenue || 0),
          today_sales: Number(todaySales.total_sales || 0),
          today_cash: Number(todaySales.cash_sales || 0),
          today_mpesa: Number(todaySales.mpesa_sales || 0),
          today_debt: Number(todaySales.debt_sales || 0),
          monthly_revenue: Number(monthlySales.total_revenue || 0),
          monthly_sales: Number(monthlySales.total_sales || 0)
        },
        expenses: {
          total_expenses: Number(expensesSummary.total_amount || 0),
          today_expenses: Number(todayExpenses.total_amount || 0),
          monthly_expenses: Number(monthlyExpenses.total_amount || 0)
        },
        debts: {
          total_outstanding: Number(debtsSummary.pending_amount || 0),
          total_debts: Number(debtsSummary.total_debts || 0),
          today_debts: Number(todayDebts.total_amount || 0)
        },
        inventory: {
          total_valuation: Number(inventoryValuation || 0),
          low_stock_count: lowStockProducts.length,
          low_stock_products: lowStockProducts.slice(0, 5)
        }
      };
    } catch (dbErr) {
      console.error('CRITICAL: Dashboard stats fetch failed:', dbErr);
      throw dbErr;
    }
    
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
    try {
      // Get daily sales for the last 7 days
      const dailySales = (await Sale.getDailySales(7)) || [];
      
      // Get top selling products
      const topProducts = (await Sale.getTopProducts(10)) || [];
      
      // Get sales by payment method
      const salesSummary = (await Sale.getSummary()) || {};
      const paymentDistribution = {
        cash: Number(salesSummary.cash_sales || 0),
        mpesa: Number(salesSummary.mpesa_sales || 0),
        debt: Number(salesSummary.debt_sales || 0)
      };
      
      // Get expenses by category
      const expensesByCategory = (await Expense.getByCategory()) || [];
      
      chartData = {
        daily_sales: dailySales,
        top_products: topProducts,
        payment_distribution: paymentDistribution,
        expenses_by_category: expensesByCategory
      };
    } catch (chartsErr) {
      console.error('Dashboard charts fetch failed:', chartsErr);
      throw chartsErr;
    }
    
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
  
  try {
    // Low stock alerts
    const lowStockProducts = (await Product.getLowStock()) || [];
    lowStockProducts.forEach(product => {
      alerts.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${product.name} is running low (${product.stock} remaining)`,
        created_at: new Date()
      });
    });
    
    // Overdue debts alerts
    const overdueDebts = (await Debt.getOverdue()) || [];
    if (overdueDebts.length > 0) {
      alerts.push({
        type: 'error',
        title: 'Overdue Debts',
        message: `${overdueDebts.length} debt(s) are overdue`,
        created_at: new Date()
      });
    }
    
    // High expenses alert
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayExpenses = (await Expense.getSummary({ date_from: startOfDay, date_to: today })) || {};
    
    const monthlyExpenses = (await Expense.getMonthlyExpenses(1)) || [];
    if (monthlyExpenses.length > 0) {
      const avgDailyExpense = (Number(monthlyExpenses[0].total_amount || 0) / 30);
      if (Number(todayExpenses.total_amount || 0) > avgDailyExpense * 1.5) {
        alerts.push({
          type: 'warning',
          title: 'High Expenses',
          message: `Today's expenses (KSh ${Number(todayExpenses.total_amount || 0).toLocaleString()}) are above average`,
          created_at: new Date()
        });
      }
    }
  } catch (alertErr) {
    console.error('Non-blocking Dashboard alerts failure:', alertErr);
    // Return empty alerts rather than 500 to keep the dashboard alive
  }
  
  res.json({
    success: true,
    data: alerts
  });
}));

module.exports = router;
