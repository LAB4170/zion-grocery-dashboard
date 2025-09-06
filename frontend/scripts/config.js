// Configuration for Zion Grocery Dashboard
// Auto-detects environment and sets appropriate API base URL

window.CONFIG = {
    // Auto-detect environment based on hostname
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isOnRender: window.location.hostname.includes('onrender.com'),
    
    // API Base URL - Auto-detection with fallback
    API_BASE: (() => {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Local development - integrated server on port 5000
            return 'http://localhost:5000/api';
        } else if (hostname.includes('onrender.com')) {
            // Render production
            return 'https://zion-grocery-dashboard-1.onrender.com/api';
        } else {
            // Generic fallback - same origin
            return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
        }
    })(),
    
    // Debug mode - enabled for localhost
    DEBUG: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Real-time sync settings
    SYNC: {
        enabled: true,
        interval: window.location.hostname === 'localhost' ? 10000 : 30000, // 10s local, 30s production
        retryAttempts: 3,
        retryDelay: 2000
    },
    
    // UI Settings
    UI: {
        itemsPerPage: 25,
        maxSearchResults: 100,
        autoSaveDelay: 1000
    }
};

// Log configuration for debugging
if (window.CONFIG.DEBUG) {
    console.log('🔧 Configuration loaded:', {
        environment: window.CONFIG.isLocalhost ? 'Local Development' : 'Production',
        apiBase: window.CONFIG.API_BASE,
        debug: window.CONFIG.DEBUG,
        syncInterval: window.CONFIG.SYNC.interval + 'ms'
    });
}
