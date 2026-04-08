const cron = require('node-cron');
const db = require('../config/database');

async function snapshotAdminStats() {
  console.log('📊 [StatsWorker] Starting aggregate snapshot...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Total Businesses
    const businessesObj = await db('businesses').count('id as count').first();
    const totalBusinesses = parseInt(businessesObj.count, 10) || 0;

    // 2. Active Businesses (Retention) - Businesses with sales in last 30 days
    const activeObj = await db('sales')
      .distinct('business_id')
      .where('created_at', '>=', thirtyDaysAgo);
    const activeBusinesses = activeObj.length;
    
    let retentionRate = 0;
    if (totalBusinesses > 0) {
      retentionRate = (activeBusinesses / totalBusinesses) * 100;
    }

    // 3. Platform Revenue
    const revenueObj = await db('sales')
      .sum('total as revenue')
      .where('status', 'completed')
      .first();
    const totalPlatformRevenue = parseFloat(revenueObj.revenue) || 0;

    // 4. Platform Sales Count
    const salesCountObj = await db('sales').count('id as count').where('status', 'completed').first();
    const totalPlatformSales = parseInt(salesCountObj.count, 10) || 0;

    // Set old ones to is_latest = false
    await db('global_admin_stats').update({ is_latest: false });

    // Insert new snapshot
    await db('global_admin_stats').insert({
      total_businesses: totalBusinesses,
      retention_rate: retentionRate.toFixed(2),
      total_platform_revenue: totalPlatformRevenue,
      total_platform_sales: totalPlatformSales,
      data_payload: JSON.stringify({ activeBusinesses }),
      is_latest: true
    });

    console.log('✅ [StatsWorker] Snapshot complete.');
  } catch (error) {
    console.error('❌ [StatsWorker] Failed snapshot:', error);
  }
}

function initWorker() {
  // Run immediately on boot
  snapshotAdminStats();
  
  // Schedule every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    snapshotAdminStats();
  });
  console.log('⏱️ [StatsWorker] Scheduled to run every 15 minutes.');
}

module.exports = { initWorker, snapshotAdminStats };
