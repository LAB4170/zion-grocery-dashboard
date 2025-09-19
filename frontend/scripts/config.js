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

// Initialize configuration immediately
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
    
    // Dashboard Throttling (ms)
    // Simplicity first: disable throttling by default in all environments
    DASHBOARD_THROTTLING_ENABLED: false,
    DASHBOARD_THROTTLE_MS: 5000,
    WEEKLY_THROTTLE_MS: 5000,
    
    // Application Settings
    APP_NAME: 'Zion Grocery Dashboard',
    VERSION: '1.0.0',
    
    // Debug Settings
    DEBUG: isLocalhost, // Enable debug in local development
    VERBOSE_LOGGING: isLocalhost,
    
    // Initialization state
    INITIALIZED: true,
    INIT_TIMESTAMP: Date.now()
};

// Mark configuration as ready
window.CONFIG_READY = true;

// Dispatch custom event to notify other scripts
if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('configReady', { 
        detail: { config: window.CONFIG } 
    }));
}

console.log(`🔧 Configuration loaded for ${window.CONFIG.ENVIRONMENT}:`, {
    API_BASE: window.CONFIG.API_BASE,
    ENVIRONMENT: window.CONFIG.ENVIRONMENT,
    DEBUG: window.CONFIG.DEBUG,
    INITIALIZED: window.CONFIG.INITIALIZED
});
