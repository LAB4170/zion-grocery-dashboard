// Configuration for different environments
const config = {
    development: {
        API_BASE: 'http://localhost:5000/api',
        FRONTEND_URL: 'http://localhost:5000'
    },
    production: {
        API_BASE: 'https://zion-grocery-dashboard-1.onrender.com/api',
        FRONTEND_URL: 'https://zion-grocery-dashboard-1.onrender.com'
    }
};

// Detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const currentConfig = isProduction ? config.production : config.development;

// Export configuration
window.CONFIG = currentConfig;

console.log('Environment:', isProduction ? 'Production' : 'Development');
console.log('API Base:', currentConfig.API_BASE);
console.log('Frontend URL:', currentConfig.FRONTEND_URL);
