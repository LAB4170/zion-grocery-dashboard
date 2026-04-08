const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const clientConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'EobordTech-POS',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    };

const client = new Client(clientConfig);

async function up() {
  await client.connect();
  console.log('Connected to DB: EobordTech-POS');

  try {
    // 1. Add CRM Fields to businesses table
    await client.query(`
      ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
    `);
    console.log('✅ Added CRM controls (is_suspended, admin_notes) to businesses table.');

    // 2. Create business_stats materialized-view equivalent (Admin dashboard caching)
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_stats (
        id SERIAL PRIMARY KEY,
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        metric_date DATE DEFAULT CURRENT_DATE,
        total_revenue DECIMAL(15, 2) DEFAULT 0,
        total_sales_count INTEGER DEFAULT 0,
        active_products INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (business_id, metric_date)
      );
    `);
    console.log('✅ Created business_stats table for high-performance aggregate queries.');

    // 3. Create global_admin_stats table (Dashboard overview caching)
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_admin_stats (
        id SERIAL PRIMARY KEY,
        metric_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        total_businesses INTEGER DEFAULT 0,
        retention_rate DECIMAL(5, 2) DEFAULT 0,
        total_platform_revenue DECIMAL(15, 2) DEFAULT 0,
        total_platform_sales INTEGER DEFAULT 0,
        data_payload JSONB DEFAULT '{}',
        is_latest BOOLEAN DEFAULT TRUE
      );
    `);
    console.log('✅ Created global_admin_stats table for caching platform-wide overview.');

    console.log('🚀 Migration 02_admin_actionability completed successfully!');
  } catch (err) {
    console.error('❌ Error during migration:', err.message);
  } finally {
    await client.end();
  }
}

up();
