const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { catchAsync } = require('../middleware/errorHandler');
const { auditLog } = require('../middleware/auditLog');
// Note: requireAdminAuth is already applied globally in server.js for all /api/admin routes

/**
 * GET /api/admin/overview
 * Provides high-level system-wide statistics for Lewis with advanced insights.
 */
router.get('/overview', auditLog('VIEW_OVERVIEW'), catchAsync(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

  // Basic Counts
  const totalBusinesses = await db('businesses').count('id as count').first();
  const totalSales = await db('sales').count('id as count').sum('total as sum').first();
  const totalProducts = await db('products').count('id as count').first();
  
  // Growth Calculation (Current Month vs Previous Month)
  const currentMonthRevenue = await db('sales')
    .sum('total as sum')
    .where('created_at', '>=', thirtyDaysAgo)
    .first();
  
  const prevMonthRevenue = await db('sales')
    .sum('total as sum')
    .where('created_at', '>=', sixtyDaysAgo)
    .andWhere('created_at', '<', thirtyDaysAgo)
    .first();

  const revGrowth = prevMonthRevenue.sum > 0 
    ? ((currentMonthRevenue.sum - prevMonthRevenue.sum) / prevMonthRevenue.sum) * 100 
    : 100;

  // Retention: Businesses with sales in last 30 days / Total businesses
  const activeBusinessesCount = await db('sales')
    .distinct('business_id')
    .where('created_at', '>=', thirtyDaysAgo)
    .then(rows => rows.length);
  
  const retentionRate = (parseInt(totalBusinesses.count) > 0)
    ? (activeBusinessesCount / parseInt(totalBusinesses.count)) * 100
    : 0;

  // Sales trend (last 7 days total)
  const salesTrend = await db('sales')
    .select(db.raw('DATE(created_at) as day'))
    .sum('total as amount')
    .where('created_at', '>=', db.raw('CURRENT_DATE - INTERVAL \'7 days\''))
    .groupBy('day')
    .orderBy('day', 'asc');

  // Global Top Products leaderboard
  const globalTopProducts = await db('sales')
    .select('product_name')
    .count('id as count')
    .sum('total as revenue')
    .groupBy('product_name')
    .orderBy('revenue', 'desc')
    .limit(5);

  // Payment method breakdown
  const paymentBreakdown = await db('sales')
    .select('payment_method')
    .sum('total as amount')
    .groupBy('payment_method');

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
      growth: {
        revenue: parseFloat(revGrowth.toFixed(2)),
        activeTenants: activeBusinessesCount
      },
      retentionRate: parseFloat(retentionRate.toFixed(2)),
      salesTrend,
      globalTopProducts,
      paymentBreakdown: formattedPayments
    }
  });
}));

/**
 * GET /api/admin/activities
 * Real-time (last 30) global sales across ALL businesses.
 */
router.get('/activities', auditLog('VIEW_ACTIVITIES'), catchAsync(async (req, res) => {
    const activities = await db('sales as s')
        .join('businesses as b', 's.business_id', 'b.id')
        .select(
            's.id',
            's.product_name',
            's.quantity',
            's.total',
            's.created_at',
            'b.name as business_name',
            'b.id as business_id'
        )
        .orderBy('s.created_at', 'desc')
        .limit(30);
    
    res.json({ success: true, data: activities });
}));

/**
 * GET /api/admin/businesses
 * Lists all registered businesses with detailed health metrics and risk status.
 */
router.get('/businesses', auditLog('LIST_BUSINESSES'), catchAsync(async (req, res) => {
    const businesses = await db('businesses as b')
      .select(
        'b.id',
        'b.name',
        'b.owner_email',
        'b.created_at',
        'b.subscription_status',
        db.raw('(SELECT COUNT(*) FROM products WHERE business_id = b.id) as product_count'),
        db.raw('(SELECT COUNT(*) FROM sales WHERE business_id = b.id) as sales_count'),
        db.raw('(SELECT SUM(total) FROM sales WHERE business_id = b.id) as total_revenue'),
        db.raw('(SELECT MAX(created_at) FROM sales WHERE business_id = b.id) as last_activity_at')
      )
      .orderBy('total_revenue', 'desc');

    const now = new Date();
    const enrichedBusinesses = businesses.map(b => {
        const lastActivity = b.last_activity_at ? new Date(b.last_activity_at) : null;
        const daysSinceActivity = lastActivity ? (now - lastActivity) / (1000 * 60 * 60 * 24) : 999;
        
        let healthStatus = 'HEALTHY';
        if (daysSinceActivity > 14) healthStatus = 'DORMANT';
        else if (daysSinceActivity > 7) healthStatus = 'AT_RISK';
        else if (!lastActivity && b.sales_count == 0) healthStatus = 'NEW';

        return {
            ...b,
            product_count: parseInt(b.product_count || 0),
            sales_count: parseInt(b.sales_count || 0),
            total_revenue: parseFloat(b.total_revenue || 0),
            healthStatus,
            daysSinceActivity: Math.floor(daysSinceActivity)
        };
    });

    res.json({
        success: true,
        data: enrichedBusinesses
    });
}));

/**
 * GET /api/admin/businesses/:id
 * Detailed deep-dive for a specific business
 */
router.get('/businesses/:id', auditLog('VIEW_BUSINESS'), catchAsync(async (req, res) => {
    const { id } = req.params;
    const business = await db('businesses').where({ id }).first();
    
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    const recentSales = await db('sales')
        .where({ business_id: id })
        .orderBy('created_at', 'desc')
        .limit(15);

    const topProducts = await db('sales')
        .select('product_name')
        .count('id as count')
        .sum('total as revenue')
        .where({ business_id: id })
        .groupBy('product_name')
        .orderBy('revenue', 'desc')
        .limit(10);

    // Monthly revenue trend for this specific business
    const revenueTrend = await db('sales')
        .select(db.raw('DATE(created_at) as day'))
        .sum('total as amount')
        .where({ business_id: id })
        .andWhere('created_at', '>=', db.raw('CURRENT_DATE - INTERVAL \'30 days\''))
        .groupBy('day')
        .orderBy('day', 'asc');

    res.json({
        success: true,
        data: {
            business,
            recentSales,
            topProducts,
            revenueTrend
        }
    });
}));

/**
 * GET /api/admin/audit-log
 * Returns the last 100 admin actions for compliance review.
 */
router.get('/audit-log', auditLog('VIEW_AUDIT_LOG'), catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = await db('admin_audit_log as a')
    .leftJoin('businesses as b', 'a.target_business_id', 'b.id')
    .select(
      'a.id',
      'a.action',
      'a.admin_identifier',
      'a.ip_address',
      'a.created_at',
      'b.name as business_name'
    )
    .orderBy('a.created_at', 'desc')
    .limit(limit);

  res.json({ success: true, data: logs, count: logs.length });
}));

module.exports = router;
