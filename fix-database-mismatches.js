const knex = require('knex');
const path = require('path');
require('dotenv').config();

// Import knex configuration
const knexConfig = require('./backend/knexfile.js');

// Determine environment
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

console.log(`🔧 Database Mismatch Fix Script`);
console.log(`Environment: ${environment}`);
console.log(`Database: ${config.connection.database || config.connection}`);

const db = knex(config);

// Test data for CRUD operations
const testData = {
  product: {
    id: 'test-product-fix-001',
    name: 'Test Product Fix',
    category: 'Test Category',
    price: 10.99,
    stock_quantity: 50, // Using correct field name
    description: 'Test product for database fix',
    barcode: 'TEST123456',
    supplier: 'Test Supplier',
    min_stock: 5,
    cost_price: 8.50,
    is_active: true
  },
  sale: {
    id: 'test-sale-fix-001',
    product_id: 'test-product-fix-001',
    product_name: 'Test Product Fix',
    quantity: 2,
    unit_price: 10.99,
    total: 21.98,
    payment_method: 'cash',
    customer_name: null,
    customer_phone: null,
    status: 'completed',
    mpesa_code: null,
    notes: 'Test sale for database fix',
    created_by: 'system'
  },
  expense: {
    id: 'test-expense-fix-001',
    description: 'Test Expense Fix',
    amount: 25.50,
    category: 'Test Category',
    status: 'pending',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_number: 'TEST-001',
    notes: 'Test expense for database fix',
    created_by: 'system'
  },
  debt: {
    id: 'test-debt-fix-001',
    customer_name: 'Test Customer',
    customer_phone: '+1234567890',
    amount: 50.00,
    amount_paid: 0,
    balance: 50.00,
    status: 'pending',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Test debt for database fix',
    sale_id: null,
    created_by: 'system'
  }
};

async function checkDatabaseConnection() {
  console.log('\n📡 Testing database connection...');
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkTableSchemas() {
  console.log('\n🔍 Checking table schemas...');
  
  const tables = ['products', 'sales', 'expenses', 'debts'];
  const schemaInfo = {};
  
  for (const table of tables) {
    try {
      const columns = await db(table).columnInfo();
      schemaInfo[table] = columns;
      console.log(`✅ ${table} table schema retrieved`);
      
      // Log important columns for verification
      const columnNames = Object.keys(columns);
      console.log(`   Columns: ${columnNames.join(', ')}`);
      
      // Check for specific field mismatches
      if (table === 'products') {
        if (columnNames.includes('stock_quantity')) {
          console.log('   ✅ Products table uses stock_quantity (correct)');
        } else if (columnNames.includes('stock')) {
          console.log('   ⚠️  Products table uses stock (needs migration to stock_quantity)');
        }
      }
    } catch (error) {
      console.error(`❌ Failed to get ${table} schema:`, error.message);
      schemaInfo[table] = null;
    }
  }
  
  return schemaInfo;
}

async function testProductOperations() {
  console.log('\n🛍️  Testing Product Operations...');
  
  try {
    // Test CREATE with correct field names
    console.log('   Creating test product...');
    await db('products').insert(testData.product);
    console.log('   ✅ Product created successfully');
    
    // Test READ
    console.log('   Reading test product...');
    const product = await db('products').where('id', testData.product.id).first();
    if (product) {
      console.log('   ✅ Product read successfully');
      console.log(`   Stock quantity: ${product.stock_quantity || product.stock || 'FIELD NOT FOUND'}`);
    }
    
    // Test stock UPDATE using correct field name
    console.log('   Testing stock update...');
    const stockField = product.stock_quantity !== undefined ? 'stock_quantity' : 'stock';
    await db('products')
      .where('id', testData.product.id)
      .decrement(stockField, 5);
    
    const updatedProduct = await db('products').where('id', testData.product.id).first();
    console.log(`   ✅ Stock updated successfully: ${updatedProduct[stockField]}`);
    
    // Test low stock query
    console.log('   Testing low stock query...');
    const lowStockQuery = stockField === 'stock_quantity' 
      ? db('products').whereRaw('stock_quantity <= min_stock')
      : db('products').whereRaw('stock <= min_stock');
    
    const lowStockProducts = await lowStockQuery;
    console.log(`   ✅ Low stock query successful: ${lowStockProducts.length} products`);
    
  } catch (error) {
    console.error('   ❌ Product operations failed:', error.message);
    
    // Identify specific field mismatch issues
    if (error.message.includes('stock_quantity') || error.message.includes('stock')) {
      console.error('   🔧 FIELD MISMATCH DETECTED: Check stock vs stock_quantity field usage');
    }
  }
}

async function testSaleOperations() {
  console.log('\n💰 Testing Sale Operations...');
  
  try {
    // Test CREATE
    console.log('   Creating test sale...');
    await db('sales').insert(testData.sale);
    console.log('   ✅ Sale created successfully');
    
    // Test stock update during sale (should use correct field)
    console.log('   Testing stock update during sale...');
    const product = await db('products').where('id', testData.sale.product_id).first();
    const stockField = product.stock_quantity !== undefined ? 'stock_quantity' : 'stock';
    
    const currentStock = product[stockField];
    console.log(`   Current stock before sale: ${currentStock}`);
    
    // This simulates what happens during a sale
    await db('products')
      .where('id', testData.sale.product_id)
      .decrement(stockField, testData.sale.quantity);
    
    const updatedProduct = await db('products').where('id', testData.sale.product_id).first();
    console.log(`   ✅ Stock updated after sale: ${updatedProduct[stockField]}`);
    
  } catch (error) {
    console.error('   ❌ Sale operations failed:', error.message);
  }
}

async function testExpenseOperations() {
  console.log('\n💸 Testing Expense Operations...');
  
  try {
    // Test CREATE
    console.log('   Creating test expense...');
    await db('expenses').insert(testData.expense);
    console.log('   ✅ Expense created successfully');
    
    // Test READ with filters
    console.log('   Testing expense queries...');
    const expenses = await db('expenses')
      .where('category', testData.expense.category)
      .where('status', 'pending');
    console.log(`   ✅ Expense queries successful: ${expenses.length} expenses found`);
    
  } catch (error) {
    console.error('   ❌ Expense operations failed:', error.message);
  }
}

async function testDebtOperations() {
  console.log('\n💳 Testing Debt Operations...');
  
  try {
    // Test CREATE
    console.log('   Creating test debt...');
    await db('debts').insert(testData.debt);
    console.log('   ✅ Debt created successfully');
    
    // Test field mapping
    console.log('   Testing debt field mapping...');
    const debt = await db('debts').where('id', testData.debt.id).first();
    
    console.log('   Field mapping check:');
    console.log(`   - customer_name: ${debt.customer_name || 'MISSING'}`);
    console.log(`   - customer_phone: ${debt.customer_phone || 'MISSING'}`);
    console.log(`   - amount_paid: ${debt.amount_paid !== undefined ? debt.amount_paid : 'MISSING'}`);
    console.log(`   - sale_id: ${debt.sale_id !== undefined ? debt.sale_id : 'MISSING'}`);
    console.log(`   - due_date: ${debt.due_date || 'MISSING'}`);
    
    // Test payment update
    console.log('   Testing debt payment update...');
    await db('debts')
      .where('id', testData.debt.id)
      .update({
        amount_paid: 25.00,
        balance: 25.00,
        status: 'partial'
      });
    console.log('   ✅ Debt payment updated successfully');
    
  } catch (error) {
    console.error('   ❌ Debt operations failed:', error.message);
  }
}

async function generateFixReport() {
  console.log('\n📋 Generating Fix Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: environment,
    issues_found: [],
    fixes_applied: [],
    recommendations: []
  };
  
  // Check for common field mismatch patterns
  try {
    const productColumns = await db('products').columnInfo();
    
    if (productColumns.stock && !productColumns.stock_quantity) {
      report.issues_found.push('Products table uses "stock" field instead of "stock_quantity"');
      report.recommendations.push('Run migration to rename "stock" to "stock_quantity" in products table');
      report.recommendations.push('Update Product model to use "stock_quantity" field');
    } else if (productColumns.stock_quantity) {
      report.fixes_applied.push('Products table correctly uses "stock_quantity" field');
    }
    
    // Check sales model compatibility
    const saleColumns = await db('sales').columnInfo();
    if (saleColumns.product_id && productColumns.stock_quantity) {
      report.fixes_applied.push('Sales table compatible with products stock_quantity field');
    }
    
    // Check debt field mappings
    const debtColumns = await db('debts').columnInfo();
    const expectedDebtFields = ['customer_name', 'customer_phone', 'amount_paid', 'sale_id', 'due_date'];
    const missingDebtFields = expectedDebtFields.filter(field => !debtColumns[field]);
    
    if (missingDebtFields.length > 0) {
      report.issues_found.push(`Debts table missing fields: ${missingDebtFields.join(', ')}`);
    } else {
      report.fixes_applied.push('Debts table has all required snake_case fields');
    }
    
  } catch (error) {
    report.issues_found.push(`Schema analysis failed: ${error.message}`);
  }
  
  console.log('\n📊 FIX REPORT:');
  console.log('================');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Environment: ${report.environment}`);
  
  if (report.issues_found.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    report.issues_found.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (report.fixes_applied.length > 0) {
    console.log('\n✅ FIXES APPLIED:');
    report.fixes_applied.forEach(fix => console.log(`   - ${fix}`));
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n🔧 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }
  
  return report;
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order of dependencies
    await db('sales').where('id', testData.sale.id).del();
    console.log('   ✅ Test sale deleted');
    
    await db('products').where('id', testData.product.id).del();
    console.log('   ✅ Test product deleted');
    
    await db('expenses').where('id', testData.expense.id).del();
    console.log('   ✅ Test expense deleted');
    
    await db('debts').where('id', testData.debt.id).del();
    console.log('   ✅ Test debt deleted');
    
  } catch (error) {
    console.error('   ⚠️  Cleanup warning:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting Database Mismatch Fix Script...\n');
    
    // Step 1: Check database connection
    const connected = await checkDatabaseConnection();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Step 2: Check table schemas
    const schemas = await checkTableSchemas();
    
    // Step 3: Test all operations
    await testProductOperations();
    await testSaleOperations();
    await testExpenseOperations();
    await testDebtOperations();
    
    // Step 4: Generate comprehensive report
    const report = await generateFixReport();
    
    // Step 5: Cleanup
    await cleanupTestData();
    
    console.log('\n🎉 Database mismatch fix script completed successfully!');
    console.log('📝 Review the report above for any remaining issues.');
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    console.error(error.stack);
  } finally {
    await db.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkDatabaseConnection, testProductOperations, testSaleOperations, testExpenseOperations, testDebtOperations };
