const { db } = require('./config/database');

async function migrate() {
  try {
    const hasColumn = await db.schema.hasColumn('products', 'unit');
    if (!hasColumn) {
      await db.schema.alterTable('products', table => {
        table.string('unit').defaultTo('pcs');
      });
      console.log('✅ Added "unit" column to products table.');
    } else {
      console.log('ℹ️ "unit" column already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
