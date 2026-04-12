import api from './api';
import { getPendingSales, removeSaleFromOutbox } from '../utils/db';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.onSyncComplete = null;
  }

  /**
   * Initialize listeners
   */
  init(callback) {
    this.onSyncComplete = callback; // Function(successCount, failCount)
    window.addEventListener('online', () => {
      console.log('🌐 System online. Triggering background sync...');
      this.sync();
    });
    
    // Initial check on load
    if (navigator.onLine) this.sync();
  }

  /**
   * Main Sync Loop
   */
  async sync() {
    if (this.isSyncing) return;
    
    const pendingSales = await getPendingSales();
    if (pendingSales.length === 0) return;

    this.isSyncing = true;
    console.log(`📡 Syncing ${pendingSales.length} offline sales...`);

    let successCount = 0;
    let failCount = 0;

    for (const sale of pendingSales) {
      try {
        // Remove the local ID and temporary offline timestamp before sending
        const { id, offlineAt, isSynced, ...payload } = sale;
        
        await api.post('/sales', payload);
        await removeSaleFromOutbox(id);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to sync sale ${sale.id}:`, err.message);
        failCount++;
        // Stop the loop if we hit a network error again
        if (err.code === 'ERR_NETWORK' || !navigator.onLine) break;
      }
    }

    this.isSyncing = false;
    
    if ((successCount > 0 || failCount > 0) && this.onSyncComplete) {
      this.onSyncComplete(successCount, failCount);
    }

    if (failCount === 0 && successCount > 0) {
       console.log('✅ Sync Completed successfully.');
    }
  }
}

export default new SyncManager();
