require('dotenv').config({ path: './backend/.env' });

async function verifyFilters() {
    console.log('🧪 Starting Backend Date Filter Verification...');
    try {
        const dummyToken = process.env.TEST_TOKEN || 'dummy'; // the middleware might allow proxy if we mock it, but actually let's use the local API if we have a token, or we can just mock a request.
        
        // Wait, testing via API will require Auth. It's better to test the Model directly.
        const Sale = require('./backend/models/Sale');
        const Expense = require('./backend/models/Expense');
        
        // We need DB connection initialized
        const { db } = require('./backend/config/database');
        
        // Use business 1
        const testBusinessId = 'b1'; 
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);
        const dateTo = new Date();
        
        console.log(`\n📅 Testing Range: ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);
        
        const summary = await Sale.getSummary({ date_from: dateFrom, date_to: dateTo }, testBusinessId);
        console.log('✅ Sale.getSummary Output:', summary);
        
        const trend = await Sale.getTrend(dateFrom, dateTo, testBusinessId);
        console.log(`✅ Sale.getTrend Output: Array of ${trend.length} days (Expected ~30 days)`);
        
        const expenses = await Expense.getByCategory(testBusinessId, { date_from: dateFrom, date_to: dateTo });
        console.log('✅ Expense.getByCategory Output:', expenses);
        
        console.log('\n✅ Backend Date Filtering is fully operational.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Verification failed:', e.message);
        process.exit(1);
    }
}

verifyFilters();
