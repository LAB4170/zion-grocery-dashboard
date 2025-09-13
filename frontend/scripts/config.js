// Configuration for Zion Grocery Dashboard - Dual Environment Support
// Automatically detects local vs production environment

// Environment detection
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isRenderProduction = window.location.hostname.includes('onrender.com');

// API Base URL selection - now uses environment-aware detection
const getApiBase = () => {
    if (isLocalhost) {
        // Use environment variable or fallback to localhost
        return window.location.protocol + '//' + window.location.hostname + ':5000/api';
    } else if (isRenderProduction) {
        // Use current domain for Render production
        return window.location.protocol + '//' + window.location.hostname + '/api';
    } else {
        // Fallback for other environments
        return `${window.location.protocol}//${window.location.host}/api`;
    }
};

window.CONFIG = {
    // API Configuration - Environment Auto-Detection
    API_BASE: getApiBase(),
    
    // Environment Info
    ENVIRONMENT: isLocalhost ? 'development' : 'production',
    IS_LOCAL: isLocalhost,
    IS_PRODUCTION: isRenderProduction,
    
    // Database Configuration
    DATABASE_ONLY: true, // Force database-only mode
    
    // Real-time Sync Configuration
    SOCKET_IO_ENABLED: true,
    SYNC_INTERVAL: isLocalhost ? 10000 : 30000, // Faster sync in development
    
    // Application Settings
    APP_NAME: 'Zion Grocery Dashboard',
    VERSION: '1.0.0',
    
    // Debug Settings
    DEBUG: isLocalhost, // Enable debug in local development
    VERBOSE_LOGGING: isLocalhost
};

console.log(`🔧 Configuration loaded for ${window.CONFIG.ENVIRONMENT}:`, {
    API_BASE: window.CONFIG.API_BASE,
    ENVIRONMENT: window.CONFIG.ENVIRONMENT,
    DEBUG: window.CONFIG.DEBUG
});
