// Configuration for Zion Grocery Dashboard
window.CONFIG = {
    // API Configuration - Production Render URL
    API_BASE: 'https://zion-grocery-dashboard-1.onrender.com/api',
    
    // Database Configuration
    DATABASE_ONLY: true, // Force database-only mode
    
    // Real-time Sync Configuration
    SOCKET_IO_ENABLED: true,
    SYNC_INTERVAL: 30000, // 30 seconds
    
    // Application Settings
    APP_NAME: 'Zion Grocery Dashboard',
    VERSION: '1.0.0',
    
    // Debug Settings
    DEBUG: false,
    VERBOSE_LOGGING: true
};

console.log('🔧 Configuration loaded:', window.CONFIG);
