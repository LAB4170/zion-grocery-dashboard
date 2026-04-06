/**
 * Migration: Create admin_audit_log table
 * Run: node backend/migrations/create_admin_audit_log.js
 */
require('dotenv').config({ path: '.env' });
const { db } = require('./backend/config/database');

async function migrate() {
  console.log('🔧 Running migration: create admin_audit_log...');
  
  const exists = await db.schema.hasTable('admin_audit_log');
  if (exists) {
    console.log('✅ Table admin_audit_log already exists, skipping.');
    await db.destroy();
    return;
  }

  await db.schema.createTable('admin_audit_log', (table) => {
    table.increments('id').primary();
    table.string('action', 100).notNullable();
    table.uuid('target_business_id').references('id').inTable('businesses').onDelete('SET NULL').nullable();
    table.string('admin_identifier', 255).defaultTo('system');
    table.string('ip_address', 45).nullable();
    table.jsonb('metadata').nullable(); // extra context (e.g. search terms, filters)
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  console.log('✅ Table admin_audit_log created successfully.');
  await db.destroy();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
