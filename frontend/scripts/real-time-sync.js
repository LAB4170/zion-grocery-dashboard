// Real-time Synchronization Manager for Zion Grocery Dashboard
// Handles auto-refresh, cache-busting, and cross-device data synchronization

class RealTimeSyncManager {
    constructor() {
        this.isActive = false;
        this.refreshInterval = null;
        this.refreshRate = 30000; // 30 seconds
        this.lastUpdateTime = {};
        this.currentView = 'dashboard';
        this.setupViewDetection();
        this.setupVisibilityHandling();
    }

    // Start real-time synchronization
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('🔄 Real-time sync started - refreshing every 30 seconds');
        
        // Initial sync
        this.syncCurrentView();
        
        // Set up periodic sync
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.syncCurrentView();
            }
        }, this.refreshRate);
        
        // Show sync status
        this.showSyncStatus('active');
    }

    // Stop real-time synchronization
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        console.log('⏹️ Real-time sync stopped');
        this.showSyncStatus('inactive');
    }

    // Detect current view/section
    setupViewDetection() {
        // Detect view changes
        const observer = new MutationObserver(() => {
            this.detectCurrentView();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
        
        // Initial detection
        this.detectCurrentView();
    }

    detectCurrentView() {
        const activeSection = document.querySelector('.content-section:not([style*="display: none"])');
        if (activeSection) {
            const sectionId = activeSection.id || activeSection.className.split(' ')[0];
            this.currentView = sectionId.replace('-section', '');
        }
    }

    // Handle page visibility changes
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isActive) {
                // Sync immediately when page becomes visible
                console.log('📱 Page visible - syncing data');
                this.syncCurrentView();
            }
        });
    }

    // Sync data for current view only (performance optimization)
    async syncCurrentView() {
        try {
            const timestamp = Date.now();
            
            switch (this.currentView) {
                case 'dashboard':
                    await this.syncDashboard();
                    break;
                case 'sales':
                    await this.syncSales();
                    break;
                case 'products':
                    await this.syncProducts();
                    break;
                case 'expenses':
                    await this.syncExpenses();
                    break;
                case 'debts':
                    await this.syncDebts();
                    break;
                default:
                    // Sync all if view unknown
                    await this.syncAll();
            }
            
            this.lastUpdateTime[this.currentView] = timestamp;
            this.showSyncStatus('synced');
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.showSyncStatus('error');
        }
    }

    // Sync dashboard data
    async syncDashboard() {
        if (window.loadDashboardData && typeof window.loadDashboardData === 'function') {
            await window.loadDashboardData();
        }
    }

    // Sync sales data
    async syncSales() {
        if (window.loadSalesData && typeof window.loadSalesData === 'function') {
            await window.loadSalesData();
        }
    }

    // Sync products data
    async syncProducts() {
        if (window.loadProductsData && typeof window.loadProductsData === 'function') {
            await window.loadProductsData();
        }
    }

    // Sync expenses data
    async syncExpenses() {
        if (window.loadExpensesData && typeof window.loadExpensesData === 'function') {
            await window.loadExpensesData();
        }
    }

    // Sync debts data
    async syncDebts() {
        if (window.loadDebtsData && typeof window.loadDebtsData === 'function') {
            await window.loadDebtsData();
        }
    }

    // Sync all data (fallback)
    async syncAll() {
        const syncPromises = [];
        
        if (window.loadDashboardData) syncPromises.push(window.loadDashboardData());
        if (window.loadSalesData) syncPromises.push(window.loadSalesData());
        if (window.loadProductsData) syncPromises.push(window.loadProductsData());
        if (window.loadExpensesData) syncPromises.push(window.loadExpensesData());
        if (window.loadDebtsData) syncPromises.push(window.loadDebtsData());
        
        await Promise.all(syncPromises);
    }

    // Manual refresh trigger
    async manualRefresh() {
        console.log('🔄 Manual refresh triggered');
        this.showSyncStatus('syncing');
        await this.syncCurrentView();
    }

    // Show sync status indicator
    showSyncStatus(status) {
        let statusElement = document.getElementById('sync-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'sync-status';
            statusElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                z-index: 1000;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            document.body.appendChild(statusElement);
            
            // Click to manual refresh
            statusElement.addEventListener('click', () => this.manualRefresh());
        }
        
        const statusConfig = {
            active: { text: '🔄 Auto-sync ON', color: '#28a745', bg: '#d4edda' },
            inactive: { text: '⏸️ Auto-sync OFF', color: '#6c757d', bg: '#f8f9fa' },
            syncing: { text: '⏳ Syncing...', color: '#007bff', bg: '#cce7ff' },
            synced: { text: '✅ Synced', color: '#28a745', bg: '#d4edda' },
            error: { text: '❌ Sync Error', color: '#dc3545', bg: '#f8d7da' }
        };
        
        const config = statusConfig[status] || statusConfig.inactive;
        statusElement.textContent = config.text;
        statusElement.style.color = config.color;
        statusElement.style.backgroundColor = config.bg;
        statusElement.title = 'Click to refresh manually';
        
        // Auto-hide synced status after 3 seconds
        if (status === 'synced') {
            setTimeout(() => {
                if (statusElement.textContent === '✅ Synced') {
                    this.showSyncStatus('active');
                }
            }, 3000);
        }
    }

    // Get sync statistics
    getSyncStats() {
        return {
            isActive: this.isActive,
            currentView: this.currentView,
            refreshRate: this.refreshRate,
            lastUpdateTimes: this.lastUpdateTime
        };
    }

    // Update refresh rate
    setRefreshRate(seconds) {
        this.refreshRate = seconds * 1000;
        if (this.isActive) {
            this.stop();
            this.start();
        }
        console.log(`🔄 Refresh rate updated to ${seconds} seconds`);
    }
}

// Cache-busting API client enhancement
class CacheBustingApiClient extends ApiClient {
    async request(endpoint, options = {}) {
        // Add cache-busting timestamp
        const separator = endpoint.includes('?') ? '&' : '?';
        const cacheBustedEndpoint = `${endpoint}${separator}t=${Date.now()}`;
        
        // Add no-cache headers
        const enhancedOptions = {
            ...options,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                ...options.headers
            }
        };
        
        return super.request(cacheBustedEndpoint, enhancedOptions);
    }
}

// Initialize real-time sync system
window.realTimeSync = new RealTimeSyncManager();

// Replace API client with cache-busting version
if (window.apiClient) {
    const originalApiClient = window.apiClient;
    window.apiClient = new CacheBustingApiClient();
    // Copy any existing configuration
    if (originalApiClient.baseURL) {
        window.apiClient.baseURL = originalApiClient.baseURL;
    }
}

// Auto-start sync when page loads
document.addEventListener('DOMContentLoaded', () => {
    // TEMPORARILY DISABLED - Causing frequent page reloads
    // Wait for other systems to initialize
    // setTimeout(() => {
    //     window.realTimeSync.start();
    // }, 2000);
    console.log('📡 Real-time sync system loaded but NOT auto-started (disabled to prevent frequent reloads)');
});

// Global functions for manual control
window.startRealTimeSync = () => window.realTimeSync.start();
window.stopRealTimeSync = () => window.realTimeSync.stop();
window.refreshData = () => window.realTimeSync.manualRefresh();
window.setSyncRate = (seconds) => window.realTimeSync.setRefreshRate(seconds);

console.log('📡 Real-time synchronization system loaded');
