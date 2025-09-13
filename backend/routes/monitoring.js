const express = require('express');
const router = express.Router();
const { getPerformanceStats, resetStats, dbHealthCheck } = require('../middleware/dbMonitoring');
const { catchAsync } = require('../middleware/errorHandler');

// GET /api/monitoring/stats - Get database performance statistics
router.get('/stats', catchAsync(async (req, res) => {
  const stats = getPerformanceStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

// GET /api/monitoring/health - Detailed database health check
router.get('/health', dbHealthCheck, catchAsync(async (req, res) => {
  const db = require('../config/database');
  
  try {
    // Test basic connectivity
    const connectionTest = await db.raw('SELECT NOW() as server_time, version() as version');
    
    // Get database size
    const dbSize = await db.raw(`
      SELECT pg_size_pretty(pg_database_size(?)) as size
    `, [process.env.DB_NAME]);
    
    // Get table statistics
    const tableStats = await db.raw(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC
    `);
    
    // Get connection info
    const connectionInfo = await db.raw(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = ?
    `, [process.env.DB_NAME]);
    
    res.json({
      success: true,
      healthy: req.dbHealthy,
      data: {
        server: {
          time: connectionTest.rows[0].server_time,
          version: connectionTest.rows[0].version,
          uptime: process.uptime()
        },
        database: {
          name: process.env.DB_NAME,
          size: dbSize.rows[0].size,
          connections: connectionInfo.rows[0]
        },
        tables: tableStats.rows,
        performance: getPerformanceStats()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      healthy: false,
      error: error.message,
      performance: getPerformanceStats()
    });
  }
}));

// POST /api/monitoring/reset - Reset monitoring statistics
router.post('/reset', catchAsync(async (req, res) => {
  resetStats();
  
  res.json({
    success: true,
    message: 'Monitoring statistics reset successfully',
    data: getPerformanceStats()
  });
}));

// GET /api/monitoring/slow-queries - Get detailed slow query information
router.get('/slow-queries', catchAsync(async (req, res) => {
  const stats = getPerformanceStats();
  
  if (stats.monitoring === 'disabled') {
    return res.json({
      success: false,
      message: 'Database monitoring is disabled'
    });
  }
  
  const limit = parseInt(req.query.limit) || 50;
  const { monitoring } = require('../config/database');
  
  res.json({
    success: true,
    data: {
      total: monitoring.slowQueries.length,
      threshold: monitoring.slowQueryThreshold,
      queries: monitoring.slowQueries.slice(-limit).reverse() // Most recent first
    }
  });
}));

// GET /api/monitoring/dashboard - Complete monitoring dashboard data
router.get('/dashboard', dbHealthCheck, catchAsync(async (req, res) => {
  const db = require('../config/database');
  
  try {
    // Get basic stats
    const performanceStats = getPerformanceStats();
    
    // Get recent activity
    const recentActivity = await db.raw(`
      SELECT 
        'products' as table_name,
        COUNT(*) as total_records,
        MAX(updated_at) as last_updated
      FROM products
      UNION ALL
      SELECT 
        'sales' as table_name,
        COUNT(*) as total_records,
        MAX(created_at) as last_updated
      FROM sales
      UNION ALL
      SELECT 
        'expenses' as table_name,
        COUNT(*) as total_records,
        MAX(created_at) as last_updated
      FROM expenses
      UNION ALL
      SELECT 
        'debts' as table_name,
        COUNT(*) as total_records,
        MAX(created_at) as last_updated
      FROM debts
    `);
    
    res.json({
      success: true,
      healthy: req.dbHealthy,
      data: {
        server: {
          name: process.env.SERVER_NAME || 'Zion Grocery Server',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        database: {
          name: process.env.DB_NAME,
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT)
        },
        performance: performanceStats,
        tables: recentActivity.rows,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      healthy: false,
      error: error.message
    });
  }
}));

module.exports = router;
