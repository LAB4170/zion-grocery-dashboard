const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

async function runManualMigration() {
  await client.connect();
  console.log('Connected to DB: EobordTech-POS');

  try {
    // 1. Create businesses table (CRITICAL FOR MULTITENANCY)
    await client.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        owner_email VARCHAR(255) UNIQUE NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'trial',
        trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
        subscription_ends_at TIMESTAMP WITH TIME ZONE,
        mpesa_number VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        business_category VARCHAR(100) DEFAULT 'retail', -- For multi-category support
        settings JSONB DEFAULT '{}'::jsonb -- For high-scale configuration
      )
    `);
    console.log('✅ Businesses table created');

    // 2. Create products table with business_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity DECIMAL(10, 2) DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'pcs',
        cost_price DECIMAL(10, 2),
        min_stock DECIMAL(10, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb -- Category-specific data (Pharma/Restaurant/etc)
      )
    `);
    console.log('✅ Products table created');

    // 3. Create sales table with business_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(255),
        mpesa_code VARCHAR(255),
        status VARCHAR(255) DEFAULT 'completed',
        notes TEXT,
        date DATE DEFAULT CURRENT_DATE,
        created_by VARCHAR(255) DEFAULT 'system',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb -- Per-transaction category data
      )
    `);
    console.log('✅ Sales table created');

    // 4. Create expenses table with business_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'paid',
        created_by VARCHAR(255) DEFAULT 'system',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Expenses table created');

    // 5. Create debts table with business_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS debts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        amount_paid DECIMAL(10, 2) DEFAULT 0,
        balance DECIMAL(10, 2) NOT NULL,
        status VARCHAR(255) DEFAULT 'pending',
        due_date DATE,
        notes TEXT,
        sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
        created_by VARCHAR(255) DEFAULT 'system',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Debts table created');

    // 6. Create debt_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS debt_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(255) NOT NULL,
        mpesa_code VARCHAR(255),
        notes TEXT,
        created_by VARCHAR(255) DEFAULT 'system',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Debt payments table created');
    
    // 7. Add columns if tables existed but were missing business_id or unit
    const tables = ['products', 'sales', 'expenses', 'debts'];
    // 7. Ensure NEW columns exist for existing tables (Migration Path)
    const newColumns = [
      { name: 'businesses', col: 'business_category', type: 'VARCHAR(100) DEFAULT \'retail\'' },
      { name: 'businesses', col: 'settings', type: 'JSONB DEFAULT \'{}\'::jsonb' },
      { name: 'products', col: 'metadata', type: 'JSONB DEFAULT \'{}\'::jsonb' },
      { name: 'sales', col: 'metadata', type: 'JSONB DEFAULT \'{}\'::jsonb' },
      { name: 'products', col: 'unit', type: 'VARCHAR(50) DEFAULT \'pcs\'' }
    ];

    for (const item of newColumns) {
      await client.query(`
        DO $$ 
        BEGIN 
          BEGIN
            ALTER TABLE ${item.name} ADD COLUMN ${item.col} ${item.type};
          EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column ${item.col} already exists in ${item.name}';
          END;
        END $$;
      `);
    }

    // 8. Create GIN Indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_businesses_settings ON businesses USING GIN (settings)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_metadata ON products USING GIN (metadata)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sales_metadata ON sales USING GIN (metadata)');

    console.log('🚀 Unified Multitenant Schema Evolved Successfully');

  } catch (err) {
    console.error('❌ Error in manual migration:', err.stack);
  } finally {
    await client.end();
  }
}

runManualMigration();
