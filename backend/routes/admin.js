const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

/**
 * GET /api/admin/overview
 * Provides high-level system-wide statistics for Lewis.
 */
router.get('/overview', async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: {
        totalBusinesses: parseInt(totalBusinesses.count),
        totalSalesCount: parseInt(totalSales.count || 0),
        totalRevenue: parseFloat(totalSales.sum || 0),
        totalProducts: parseInt(totalProducts.count),
        salesTrend
      }
    });
  } catch (error) {
    console.error('Admin Overview Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin overview' });
  }
});

/**
 * GET /api/admin/businesses
 * Lists all registered businesses with their current metrics.
 */
router.get('/businesses', async (req, res) => {
  try {
    // We join with sales and products to get a real-time summary for each business
    const businesses = await db('businesses as b')
      .select(
        'b.id',
        'b.name',
        'b.owner_email',
        'b.created_at',
        db.raw('(SELECT COUNT(*) FROM products WHERE business_id = b.id) as product_count'),
        db.raw('(SELECT COUNT(*) FROM sales WHERE business_id = b.id) as sales_count'),
        db.raw('(SELECT SUM(total) FROM sales WHERE business_id = b.id) as total_revenue')
      )
      .orderBy('b.created_at', 'desc');

    res.json({
        success: true,
        data: businesses
    });
  } catch (error) {
    console.error('Admin Businesses List Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch businesses list' });
  }
});

/**
 * GET /api/admin/businesses/:id
 * Detailed deep-dive into a single business.
 */
router.get('/businesses/:id', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Admin Business Detail Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch business details' });
    }
});

module.exports = router;
