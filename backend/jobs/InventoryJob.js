/**
 * InventoryJob.js
 * Automated background scanner that monitors stock levels and fires alerts.
 * Runs every 60 minutes via node-cron.
 */
const cron = require('node-cron');

let db = null;
let io = null;

function getDatabase() {
  if (!db) {
    const { db: database } = require('../config/database');
    db = database;
  }
  return db;
}

/**
 * Core scan logic — separated so it can be called manually too.
 */
async function scanLowStock() {
  const dbx = getDatabase();

  // Get all businesses that have products below min_stock threshold
  const lowStockItems = await dbx('products')
    .where(dbx.raw('stock_quantity <= COALESCE(min_stock, 5)'))
    .where('is_active', true)
    .select('id', 'name', 'category', 'stock_quantity', 'min_stock', 'business_id');

  if (!lowStockItems.length) {
    console.log('✅ [InventoryJob] All stock levels healthy.');
    return;
  }

  // Group alerts per business
  const byBusiness = lowStockItems.reduce((acc, item) => {
    if (!acc[item.business_id]) acc[item.business_id] = [];
    acc[item.business_id].push(item);
    return acc;
  }, {});

  for (const [businessId, items] of Object.entries(byBusiness)) {
    const alertPayload = {
      type: 'low_stock_alert',
      businessId,
      timestamp: new Date().toISOString(),
      count: items.length,
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        currentStock: parseFloat(i.stock_quantity),
        threshold: parseFloat(i.min_stock ?? 5)
      }))
    };

    console.warn(`⚠️  [InventoryJob] Business ${businessId}: ${items.length} low-stock item(s) detected.`);
    items.forEach(i =>
      console.warn(`   → ${i.name}: ${parseFloat(i.stock_quantity)} units remaining (threshold: ${i.min_stock ?? 5})`)
    );

    // Emit real-time alert to the business's Socket.IO room
    if (io) {
      io.to(businessId).emit('automation-alert', alertPayload);
    }
  }
}

/**
 * Initialize the cron job.
 * @param {import('socket.io').Server} socketServer - The Socket.IO server instance.
 */
function initInventoryJob(socketServer) {
  io = socketServer;

  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 [InventoryJob] Running scheduled stock scan...');
    try {
      await scanLowStock();
    } catch (err) {
      console.error('❌ [InventoryJob] Error during scan:', err.message);
    }
  });

  console.log('📦 [InventoryJob] Scheduled: hourly stock scanner active.');

  // Run once immediately on startup
  scanLowStock().catch(err => console.error('[InventoryJob] Startup scan failed:', err.message));
}

module.exports = { initInventoryJob, scanLowStock };
