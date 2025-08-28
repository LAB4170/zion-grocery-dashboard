const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger implementation without winston
const logger = {
  info: (message, meta = {}) => {
    const logEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      service: 'zion-grocery-api',
      ...meta
    };
    console.log('INFO:', JSON.stringify(logEntry));
    
    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'combined.log'),
        JSON.stringify(logEntry) + '\n'
      );
    }
  },

  error: (message, meta = {}) => {
    const logEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      service: 'zion-grocery-api',
      ...meta
    };
    console.error('ERROR:', JSON.stringify(logEntry));
    
    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'error.log'),
        JSON.stringify(logEntry) + '\n'
      );
    }
  },

  warn: (message, meta = {}) => {
    const logEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      service: 'zion-grocery-api',
      ...meta
    };
    console.warn('WARN:', JSON.stringify(logEntry));
    
    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'combined.log'),
        JSON.stringify(logEntry) + '\n'
      );
    }
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      const logEntry = {
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        service: 'zion-grocery-api',
        ...meta
      };
      console.debug('DEBUG:', JSON.stringify(logEntry));
    }
  }
};

module.exports = logger;
