const { db } = require('./backend/config/database');
const Product = require('./backend/models/Product');
const Debt = require('./backend/models/Debt');
const Expense = require('./backend/models/Expense');

async function debugAlerts() {
  console.log('--- Debugging Alerts API Logic ---');
  try {
    console.log('1. Testing Product.getLowStock()...');
    const lowStock = await Product.getLowStock();
    console.log('✅ Success. Count:', lowStock.length);

    console.log('2. Testing Debt.getOverdue()...');
    const overdueDetails = await Debt.getOverdue();
    console.log('✅ Success. Count:', overdueDetails.length);

    console.log('3. Testing Expense.getMonthlyExpenses(1)...');
    const monthly = await Expense.getMonthlyExpenses(1);
    console.log('✅ Success. Count:', monthly.length);

    console.log('--- All Logic Blocks Passed ---');
  } catch (err) {
    console.error('❌ FAILED:', err);
    console.error('Stack:', err.stack);
  } finally {
    process.exit();
  }
}

debugAlerts();
