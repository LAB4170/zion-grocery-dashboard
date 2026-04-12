const { db } = require('./config/database');

async function cleanup() {
  console.log('🧹 Cleaning up procurement tables...');
  try {
    await db.raw('DROP TABLE IF EXISTS po_items CASCADE');
    await db.raw('DROP TABLE IF EXISTS purchase_orders CASCADE');
    await db.raw('DROP TABLE IF EXISTS suppliers CASCADE');
    console.log('✅ Cleanup complete.');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
  } finally {
    process.exit(0);
  }
}

cleanup();
