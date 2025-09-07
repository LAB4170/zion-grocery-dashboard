const db = require('./config/database');

async function setupDatabaseSchema() {
  console.log('🚀 Setting up Zion Grocery Database Schema...\n');
  
  try {
    // Test connection first
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Enable UUID extension
    console.log('1. Enabling UUID extension...');
    await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled\n');
    
    // Create Products Table
    console.log('2. Creating products table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 10,
        description TEXT,
        barcode VARCHAR(50) UNIQUE,
        supplier VARCHAR(100),
        cost_price DECIMAL(10, 2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');
    
    // Create Sales Table
    console.log('3. Creating sales table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS sales (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL,
        product_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'mpesa', 'debt')) NOT NULL,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        status VARCHAR(20) CHECK (status IN ('completed', 'pending', 'cancelled')) DEFAULT 'completed',
        mpesa_code VARCHAR(50),
        notes TEXT,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      )
    `);
    console.log('✅ Sales table created');
    
    // Create Expenses Table
    console.log('4. Creating expenses table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        expense_date DATE NOT NULL,
        receipt_number VARCHAR(50),
        notes TEXT,
        created_by UUID,
        approved_by UUID,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Expenses table created');
    
    // Create Debts Table
    console.log('5. Creating debts table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS debts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sale_id UUID,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20),
        amount DECIMAL(10, 2) NOT NULL,
        amount_paid DECIMAL(10, 2) DEFAULT 0,
        balance DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('pending', 'partial', 'paid', 'overdue')) DEFAULT 'pending',
        due_date DATE,
        notes TEXT,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Debts table created');
    
    // Create Debt Payments Table
    console.log('6. Creating debt_payments table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS debt_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        debt_id UUID NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'mpesa')) NOT NULL,
        mpesa_code VARCHAR(50),
        notes TEXT,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Debt payments table created');
    
    // Create Users Table
    console.log('7. Creating users table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin')) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create Indexes
    console.log('8. Creating performance indexes...');
    
    // Products indexes
    await db.raw('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock)');
    
    // Sales indexes
    await db.raw('CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_sales_customer_phone ON sales(customer_phone)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_sales_mpesa_code ON sales(mpesa_code)');
    
    // Expenses indexes
    await db.raw('CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_expenses_approved_by ON expenses(approved_by)');
    
    // Debts indexes
    await db.raw('CREATE INDEX IF NOT EXISTS idx_debts_customer_name ON debts(customer_name)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_debts_customer_phone ON debts(customer_phone)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_debts_created_by ON debts(created_by)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_debts_sale_id ON debts(sale_id)');
    
    // Debt payments indexes
    await db.raw('CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_debt_payments_created_at ON debt_payments(created_at)');
    
    console.log('✅ All indexes created');
    
    // Verify tables were created
    console.log('\n9. Verifying table creation...');
    const tables = ['products', 'sales', 'expenses', 'debts', 'debt_payments', 'users'];
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      if (exists) {
        console.log(`✅ Table '${table}' verified`);
      } else {
        console.log(`❌ Table '${table}' not found`);
      }
    }
    
    console.log('\n🎉 Database schema setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 6 tables created with UUID primary keys');
    console.log('- Foreign key relationships established');
    console.log('- Performance indexes created');
    console.log('- Check constraints for data integrity');
    console.log('- Ready for Zion Grocery Dashboard operations');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Ensure PostgreSQL is running');
    console.error('2. Check database credentials in .env');
    console.error('3. Verify database "zion_grocery_db" exists');
    console.error('4. Check user permissions for CREATE TABLE');
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

// Run setup
setupDatabaseSchema();
