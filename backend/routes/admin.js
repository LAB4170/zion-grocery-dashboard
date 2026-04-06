const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { catchAsync } = require('../middleware/errorHandler');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');

// Validation rules for system overrides
const systemOverrideRules = [
  body('reason').trim().notEmpty().withMessage('Reason for system override must be provided'),
  body('action').isIn(['REPAIR', 'RESET', 'MIGRATE']).withMessage('Invalid system action')
];

/**
 * GET /api/admin/overview
 * Provides high-level system-wide statistics for Lewis.
 */
router.get('/overview', requireAdminAuth, catchAsync(async (req, res) => {
  const totalBusinesses = await db('businesses').count('id as count').first();
  const totalSales = await db('sales').count('id as count').sum('total as sum').first();
  const totalProducts = await db('products').count('id as count').first();
  
  // Get sales trend (last 7 days total)
  const salesTrend = await db('sales')
    .select(db.raw('date::date as day'))
    .sum('total as amount')
    .where('date', '>=', db.raw('CURRENT_DATE - INTERVAL \'7 days\''))
    .groupBy('day')
    .orderBy('day', 'asc');

  // Global Top Products leaderboard across all businesses
  const globalTopProducts = await db('sales')
    .select('product_name')
    .count('id as count')
    .sum('total as revenue')
    .groupBy('product_name')
    .orderBy('revenue', 'desc')
    .limit(5);

  // Payment method breakdown (Cash vs M-Pesa)
  const paymentBreakdown = await db('sales')
    .select('payment_method')
    .sum('total as amount')
    .groupBy('payment_method');

  // Convert keys to uppercase/consistent for frontend PieChart
  const formattedPayments = paymentBreakdown.map(p => ({
      name: p.payment_method?.toUpperCase() || 'UNKNOWN',
      value: parseFloat(p.amount || 0)
  }));

  res.json({
    success: true,
    data: {
      totalBusinesses: parseInt(totalBusinesses.count),
      totalSalesCount: parseInt(totalSales.count || 0),
      totalRevenue: parseFloat(totalSales.sum || 0),
      totalProducts: parseInt(totalProducts.count),
      salesTrend,
      globalTopProducts,
      paymentBreakdown: formattedPayments
    }
  });
}));

/**
 * GET /api/admin/activities
 * Real-time (last 20) global sales across ALL businesses.
 */
router.get('/activities', requireAdminAuth, catchAsync(async (req, res) => {
    const activities = await db('sales as s')
        .join('businesses as b', 's.business_id', 'b.id')
        .select(
            's.id',
            's.product_name',
            's.quantity',
            's.total',
            's.created_at',
            'b.name as business_name'
        )
        .orderBy('s.created_at', 'desc')
        .limit(20);
    
    res.json({ success: true, data: activities });
}));

/**
 * GET /api/admin/businesses
 * Lists all registered businesses with detailed health metrics.
 */
router.get('/businesses', requireAdminAuth, catchAsync(async (req, res) => {
    const businesses = await db('businesses as b')
      .select(
        'b.id',
        'b.name',
        'b.owner_email',
        'b.created_at',
        db.raw('(SELECT COUNT(*) FROM products WHERE business_id = b.id) as product_count'),
        db.raw('(SELECT COUNT(*) FROM sales WHERE business_id = b.id) as sales_count'),
        db.raw('(SELECT SUM(total) FROM sales WHERE business_id = b.id) as total_revenue'),
        db.raw('(SELECT MAX(created_at) FROM sales WHERE business_id = b.id) as last_activity_at')
      )
      .orderBy('total_revenue', 'desc'); // Order by highest earners for Lewis

    res.json({
        success: true,
        data: businesses
    });
}));

/**
 * GET /api/admin/businesses/:id
 */
router.get('/businesses/:id', requireAdminAuth, catchAsync(async (req, res) => {
    const { id } = req.params;
    const business = await db('businesses').where({ id }).first();
    
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    const recentSales = await db('sales')
        .where({ business_id: id })
        .orderBy('created_at', 'desc')
        .limit(10);

    const topProducts = await db('sales')
        .select('product_name')
        .count('id as count')
        .sum('total as revenue')
        .where({ business_id: id })
        .groupBy('product_name')
        .orderBy('revenue', 'desc')
        .limit(5);

    res.json({
        success: true,
        data: {
            business,
            recentSales,
            topProducts
        }
    });
}));

module.exports = router;
