const { monitoring } = require('../config/database');

// Database performance monitoring middleware
const dbPerformanceMiddleware = (req, res, next) => {
  if (!monitoring.enabled) {
    return next();
  }

  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log slow API requests that might indicate database issues
    if (duration > 2000) { // 2 seconds threshold for API requests
      console.warn(`🐌 Slow API request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Update connection stats based on response
    if (res.statusCode >= 500) {
      monitoring.connectionStats.errors++;
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Database health check middleware
const dbHealthCheck = async (req, res, next) => {
  try {
    const db = require('../config/database');
    await db.raw('SELECT 1');
    req.dbHealthy = true;
  } catch (error) {
    req.dbHealthy = false;
    req.dbError = error.message;
  }
  next();
};

// Get database performance stats
const getPerformanceStats = () => {
  if (!monitoring.enabled) {
    return { monitoring: 'disabled' };
  }

  return {
    monitoring: 'enabled',
    queryCount: monitoring.queryCount,
    slowQueries: monitoring.slowQueries.length,
    recentSlowQueries: monitoring.slowQueries.slice(-5), // Last 5 slow queries
    connectionStats: monitoring.connectionStats,
    thresholds: {
      slowQueryThreshold: monitoring.slowQueryThreshold,
    },
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
};

// Reset monitoring stats
const resetStats = () => {
  if (monitoring.enabled) {
    monitoring.queryCount = 0;
    monitoring.slowQueries = [];
    monitoring.connectionStats.errors = 0;
    console.log('📊 Database monitoring stats reset');
  }
};

module.exports = {
  dbPerformanceMiddleware,
  dbHealthCheck,
  getPerformanceStats,
  resetStats
};
