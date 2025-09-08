// fix-sales-database.js - Quick Fix for Sales Database Issues
const knex = require('knex');
const path = require('path');
require('dotenv').config();

// Import knexfile configuration
const knexConfig = require('./backend/knexfile.js');
const environment = process.env.NODE_ENV || 'development';

console.log('🔧 Fixing sales database issues...');

async function fixSalesDatabase() {
  let db;
  
  try {
    // Initialize database connection
    db = knex(knexConfig[environment]);
    
    console.log('1️⃣ Testing database connection...');
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
    
    // Check if tables exist
    console.log('\n2️⃣ Checking table structure...');
    
    const hasProducts = await db.schema.hasTable('products');
    const hasSales = await db.schema.hasTable('sales');
    
    if (!hasProducts || !hasSales) {
      console.log('❌ Required tables missing. Running migrations...');
      
      // Run migrations
      const { spawn } = require('child_process');
      const migrate = spawn('npm', ['run', 'migrate'], { 
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit' 
      });
      
      await new Promise((resolve, reject) => {
        migrate.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Migrations completed successfully');
            resolve();
          } else {
            reject(new Error(`Migration failed with code ${code}`));
          }
        });
      });
    }
    
    // Verify products table has correct schema
    console.log('\n3️⃣ Verifying products table schema...');
    const productColumns = await db.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    const hasStockQuantity = productColumns.rows.some(col => col.column_name === 'stock_quantity');
    console.log(`Stock quantity field: ${hasStockQuantity ? '✅ Found' : '❌ Missing'}`);
    
    // Verify sales table schema
    console.log('\n4️⃣ Verifying sales table schema...');
    const salesColumns = await db.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Sales table columns:');
    salesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Test UUID extension
    console.log('\n5️⃣ Testing UUID generation...');
    try {
      const uuidTest = await db.raw('SELECT uuid_generate_v4() as test_uuid');
      console.log('✅ UUID generation working:', uuidTest.rows[0].test_uuid);
    } catch (error) {
      console.log('❌ UUID extension missing. Installing...');
      await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ UUID extension installed');
    }
    
    // Test product insertion
    console.log('\n6️⃣ Testing product CRUD operations...');
    const testProductId = await db.raw('SELECT uuid_generate_v4() as id').then(r => r.rows[0].id);
    
    const testProduct = {
      id: testProductId,
      name: 'Test Product for Sales',
      barcode: `TEST_${Date.now()}`,
      price: 10.00,
      stock_quantity: 100,
      category: 'Test',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db('products').insert(testProduct);
    console.log('✅ Product insertion successful');
    
    // Test sale creation
    console.log('\n7️⃣ Testing sale creation...');
    const testSaleId = await db.raw('SELECT uuid_generate_v4() as id').then(r => r.rows[0].id);
    
    const testSale = {
      id: testSaleId,
      product_id: testProductId,
      product_name: testProduct.name,
      quantity: 2,
      unit_price: testProduct.price,
      total: testProduct.price * 2,
      payment_method: 'cash',
      customer_name: null,
      customer_phone: null,
      status: 'completed',
      mpesa_code: null,
      notes: null,
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db('sales').insert(testSale);
    console.log('✅ Sale creation successful');
    
    // Test stock update
    console.log('\n8️⃣ Testing stock update...');
    await db('products')
      .where('id', testProductId)
      .decrement('stock_quantity', 2)
      .update('updated_at', new Date());
    
    const updatedProduct = await db('products').where('id', testProductId).first();
    console.log(`✅ Stock updated: ${updatedProduct.stock_quantity} (was 100, now ${updatedProduct.stock_quantity})`);
    
    // Clean up test data
    console.log('\n9️⃣ Cleaning up test data...');
    await db('sales').where('id', testSaleId).del();
    await db('products').where('id', testProductId).del();
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 ALL TESTS PASSED! Sales database is working correctly.');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Database connection: Working');
    console.log('✅ Table schema: Correct');
    console.log('✅ UUID generation: Working');
    console.log('✅ Product CRUD: Working');
    console.log('✅ Sales CRUD: Working');
    console.log('✅ Stock updates: Working');
    
    console.log('\n🚀 Your sales system should now work properly!');
    console.log('Next steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Test creating a sale in the frontend');
    console.log('3. Check that sales appear in the database');
    
  } catch (error) {
    console.error('💥 Error during database fix:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Provide specific troubleshooting
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 SOLUTION: Start PostgreSQL service');
      console.error('Windows: net start postgresql-x64-14');
      console.error('Linux: sudo systemctl start postgresql');
    } else if (error.code === '3D000') {
      console.error('\n💡 SOLUTION: Create database');
      console.error('Run: createdb -U postgres zion_grocery_db');
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n💡 SOLUTION: Run migrations');
      console.error('Run: cd backend && npm run migrate');
    }
    
    process.exit(1);
  } finally {
    if (db) {
      await db.destroy();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run the fix
fixSalesDatabase()
  .then(() => {
    console.log('\n✨ Database fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database fix failed:', error.message);
    process.exit(1);
  });
