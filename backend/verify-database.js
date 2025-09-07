const db = require('./config/database');

async function verifyDatabase() {
  console.log('🔍 Starting database verification...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Check if tables exist
    console.log('2. Checking table existence...');
    const tables = ['products', 'sales', 'expenses', 'debts', 'debt_payments', 'users'];
    const existingTables = [];
    
    for (const table of tables) {
      try {
        const exists = await db.schema.hasTable(table);
        if (exists) {
          existingTables.push(table);
          console.log(`✅ Table '${table}' exists`);
        } else {
          console.log(`❌ Table '${table}' missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${table}': ${error.message}`);
      }
    }
    
    console.log(`\nFound ${existingTables.length}/${tables.length} tables\n`);
    
    // Check sales table schema if it exists
    if (existingTables.includes('sales')) {
      console.log('3. Verifying sales table schema...');
      try {
        const columns = await db('information_schema.columns')
          .select('column_name', 'data_type', 'is_nullable')
          .where('table_name', 'sales')
          .orderBy('ordinal_position');
        
        console.log('Sales table columns:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Check for required columns
        const requiredColumns = ['id', 'product_id', 'product_name', 'quantity', 'unit_price', 'total', 'payment_method', 'mpesa_code', 'notes', 'created_by'];
        const existingColumns = columns.map(col => col.column_name);
        
        console.log('\nColumn verification:');
        requiredColumns.forEach(col => {
          if (existingColumns.includes(col)) {
            console.log(`✅ Column '${col}' exists`);
          } else {
            console.log(`❌ Column '${col}' missing`);
          }
        });
        
      } catch (error) {
        console.log(`❌ Error checking sales schema: ${error.message}`);
      }
    }
    
    // Test a simple insert/delete to verify permissions
    if (existingTables.includes('products')) {
      console.log('\n4. Testing database permissions...');
      try {
        // Try to insert a test product
        const [testProduct] = await db('products')
          .insert({
            name: 'TEST_PRODUCT_DELETE_ME',
            category: 'test',
            price: 1.00,
            stock: 0
          })
          .returning('*');
        
        console.log('✅ Insert permission verified');
        
        // Delete the test product
        await db('products').where('id', testProduct.id).del();
        console.log('✅ Delete permission verified');
        
      } catch (error) {
        console.log(`❌ Permission test failed: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Database verification completed!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.error('\n💡 Troubleshooting steps:');
    console.error('1. Check if PostgreSQL service is running');
    console.error('2. Verify database credentials in .env file');
    console.error('3. Ensure database "zion_grocery_db" exists');
    console.error('4. Run database migrations to create tables');
    console.error('5. Check firewall/network connectivity');
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

// Run verification
verifyDatabase();
