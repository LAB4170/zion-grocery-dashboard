// Configuration for Zion Grocery Dashboard
window.CONFIG = {
    // API Configuration - Auto-detect based on current host
    API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'  // Local development
        : `${window.location.protocol}//${window.location.host}/api`, // Production (same host)
    
    // Database Configuration
    DATABASE_ONLY: true, // Force database-only mode
    
    // Real-time Sync Configuration
    SOCKET_IO_ENABLED: true,
    SYNC_INTERVAL: 30000, // 30 seconds
    
    // Application Settings
    APP_NAME: 'Zion Grocery Dashboard',
    VERSION: '1.0.0',
    
    // Debug Settings
    DEBUG: window.location.hostname === 'localhost',
    VERBOSE_LOGGING: true
};

console.log('🔧 Configuration loaded:', window.CONFIG);
