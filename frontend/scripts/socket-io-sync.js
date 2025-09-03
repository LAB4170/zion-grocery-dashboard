// Socket.IO Real-time Synchronization for Zion Grocery Dashboard
// Enhanced version with automatic reconnection and fallback support

class SocketIOSyncManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.currentView = 'dashboard';
        this.fallbackToPolling = false;
        this.pollingInterval = null;
        this.setupViewDetection();
        this.init();
    }

    // Initialize Socket.IO connection
    init() {
        try {
            // Import Socket.IO client (assuming it's loaded via CDN or bundled)
            if (typeof io === 'undefined') {
                console.warn('Socket.IO client not found, falling back to polling');
                this.fallbackToPolling = true;
                this.startPollingFallback();
                return;
            }

            const serverUrl = window.CONFIG?.API_BASE?.replace('/api', '') || 'http://localhost:5000';
            
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true,
                timeout: 20000,
                forceNew: false,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                maxReconnectionAttempts: this.maxReconnectAttempts
            });

            this.setupSocketEventHandlers();
            console.log('🔌 Socket.IO client initialized');
            
        } catch (error) {
            console.error('Socket.IO initialization failed:', error);
            this.fallbackToPolling = true;
            this.startPollingFallback();
        }
    }

    // Set up Socket.IO event handlers
    setupSocketEventHandlers() {
        // Connection established
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('📡 Socket.IO connected:', this.socket.id);
            this.showSyncStatus('connected');
            
            // Stop polling fallback if it was running
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
            }
        });

        // Connection lost
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('📡 Socket.IO disconnected:', reason);
            this.showSyncStatus('disconnected');
            
            // Start polling fallback for critical disconnections
            if (reason === 'io server disconnect' || reason === 'transport close') {
                this.startPollingFallback();
            }
        });

        // Reconnection attempts
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            this.reconnectAttempts = attemptNumber;
            console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
            this.showSyncStatus('reconnecting');
        });

        // Reconnection failed
        this.socket.on('reconnect_failed', () => {
            console.warn('❌ Socket.IO reconnection failed, falling back to polling');
            this.fallbackToPolling = true;
            this.startPollingFallback();
        });

        // Data update received
        this.socket.on('data-update', (data) => {
            console.log('📥 Received data update:', data.type);
            this.handleDataUpdate(data);
        });

        // Data refresh request from other clients
        this.socket.on('data-refresh', (data) => {
            console.log('🔄 Refresh request received:', data.type);
            this.syncCurrentView();
        });

        // Connection established confirmation
        this.socket.on('connection-established', (data) => {
            console.log('✅ Socket.IO ready:', data.message);
            this.showSyncStatus('ready');
        });

        // Handle errors
        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            this.showSyncStatus('error');
        });
    }

    // Handle incoming data updates
    async handleDataUpdate(data) {
        try {
            switch (data.type) {
                case 'products':
                    if (this.currentView === 'products' && window.loadProductsData) {
                        await window.loadProductsData();
                    }
                    break;
                case 'sales':
                    if (this.currentView === 'sales' && window.loadSalesData) {
                        await window.loadSalesData();
                    }
                    // Update dashboard if visible
                    if (this.currentView === 'dashboard' && window.loadDashboardData) {
                        await window.loadDashboardData();
                    }
                    break;
                case 'expenses':
                    if (this.currentView === 'expenses' && window.loadExpensesData) {
                        await window.loadExpensesData();
                    }
                    break;
                case 'debts':
                    if (this.currentView === 'debts' && window.loadDebtsData) {
                        await window.loadDebtsData();
                    }
                    break;
                default:
                    // Refresh current view for unknown types
                    await this.syncCurrentView();
            }
            
            this.showSyncStatus('synced');
            
        } catch (error) {
            console.error('Error handling data update:', error);
        }
    }

    // Detect current view/section
    setupViewDetection() {
        const observer = new MutationObserver(() => {
            this.detectCurrentView();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
        
        this.detectCurrentView();
    }

    detectCurrentView() {
        const activeSection = document.querySelector('.content-section:not([style*="display: none"])');
        if (activeSection) {
            const sectionId = activeSection.id || activeSection.className.split(' ')[0];
            this.currentView = sectionId.replace('-section', '');
        }
    }

    // Sync current view data
    async syncCurrentView() {
        try {
            switch (this.currentView) {
                case 'dashboard':
                    if (window.loadDashboardData) await window.loadDashboardData();
                    break;
                case 'sales':
                    if (window.loadSalesData) await window.loadSalesData();
                    break;
                case 'products':
                    if (window.loadProductsData) await window.loadProductsData();
                    break;
                case 'expenses':
                    if (window.loadExpensesData) await window.loadExpensesData();
                    break;
                case 'debts':
                    if (window.loadDebtsData) await window.loadDebtsData();
                    break;
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }

    // Broadcast data change to other clients
    broadcastDataChange(type, data) {
        if (this.isConnected && this.socket) {
            this.socket.emit('request-refresh', { type, data });
            console.log(`📤 Broadcasting ${type} change`);
        }
    }

    // Manual refresh trigger
    async manualRefresh() {
        console.log('🔄 Manual refresh triggered');
        this.showSyncStatus('syncing');
        await this.syncCurrentView();
        
        // Notify other clients
        this.broadcastDataChange(this.currentView, { manual: true });
    }

    // Polling fallback for when Socket.IO fails
    startPollingFallback() {
        if (this.pollingInterval) return; // Already running
        
        console.log('🔄 Starting polling fallback (30s intervals)');
        this.pollingInterval = setInterval(async () => {
            if (document.visibilityState === 'visible') {
                await this.syncCurrentView();
                this.showSyncStatus('polling');
            }
        }, 30000);
    }

    // Stop polling fallback
    stopPollingFallback() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('⏹️ Polling fallback stopped');
        }
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
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(statusElement);
            
            statusElement.addEventListener('click', () => this.manualRefresh());
        }
        
        const statusConfig = {
            connected: { text: '🟢 Real-time ON', color: '#28a745', bg: '#d4edda' },
            disconnected: { text: '🔴 Disconnected', color: '#dc3545', bg: '#f8d7da' },
            reconnecting: { text: '🟡 Reconnecting...', color: '#ffc107', bg: '#fff3cd' },
            ready: { text: '✅ Socket.IO Ready', color: '#28a745', bg: '#d4edda' },
            syncing: { text: '⏳ Syncing...', color: '#007bff', bg: '#cce7ff' },
            synced: { text: '✅ Synced', color: '#28a745', bg: '#d4edda' },
            polling: { text: '🔄 Polling Mode', color: '#6c757d', bg: '#f8f9fa' },
            error: { text: '❌ Sync Error', color: '#dc3545', bg: '#f8d7da' }
        };
        
        const config = statusConfig[status] || statusConfig.disconnected;
        statusElement.textContent = config.text;
        statusElement.style.color = config.color;
        statusElement.style.backgroundColor = config.bg;
        statusElement.title = 'Click to refresh manually';
        
        // Auto-hide synced status
        if (status === 'synced') {
            setTimeout(() => {
                if (statusElement.textContent === '✅ Synced') {
                    this.showSyncStatus(this.isConnected ? 'connected' : 'polling');
                }
            }, 3000);
        }
    }

    // Get connection statistics
    getStats() {
        return {
            isConnected: this.isConnected,
            currentView: this.currentView,
            reconnectAttempts: this.reconnectAttempts,
            fallbackMode: this.fallbackToPolling,
            socketId: this.socket?.id || null
        };
    }

    // Cleanup on page unload
    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.stopPollingFallback();
    }
}

// Initialize Socket.IO sync manager
window.socketIOSync = new SocketIOSyncManager();

// Global functions for manual control
window.refreshData = () => window.socketIOSync.manualRefresh();
window.broadcastChange = (type, data) => window.socketIOSync.broadcastDataChange(type, data);
window.getSyncStats = () => window.socketIOSync.getStats();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.socketIOSync.cleanup();
});

console.log('📡 Socket.IO synchronization system loaded');
