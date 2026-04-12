/**
 * FinanceJob.js
 * Automated End-of-Day (EOD) financial intelligence engine.
 * Generates daily profit/loss summaries and watches for overdue debts.
 * Runs at midnight (00:00) every day and additionally scans debts every 6 hours.
 */
const cron = require('node-cron');

let db = null;
let io = null;

function getDatabase() {
  if (!db) {
    const { db: database } = require('../config/database');
    db = database;
  }
  return db;
}

/**
 * End-of-Day Financial Summary
 * Calculates the full P&L snapshot for the business day that just ended.
 */
async function runEODSummary() {
  const dbx = getDatabase();

  // Get all businesses with at least one sale today
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  const businesses = await dbx('businesses').select('id', 'name');

  for (const business of businesses) {
    // Sales summary for today
    const salesRows = await dbx('sales')
      .where('business_id', business.id)
      .where('created_at', '>=', startOfDay)
      .where('created_at', '<=', endOfDay)
      .select(
        dbx.raw('COUNT(*) as total_transactions'),
        dbx.raw('SUM(total) as total_revenue'),
        dbx.raw('SUM(unit_cost * quantity) as total_cogs'),
        dbx.raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as cash', ['cash']),
        dbx.raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as mpesa', ['mpesa']),
        dbx.raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as debt', ['debt'])
      )
      .first();

    // Expenses for today
    const expenseRow = await dbx('expenses')
      .where('business_id', business.id)
      .where('created_at', '>=', startOfDay)
      .where('created_at', '<=', endOfDay)
      .sum('amount as total_expenses')
      .first();

    const revenue = parseFloat(salesRows.total_revenue) || 0;
    const cogs = parseFloat(salesRows.total_cogs) || 0;
    const expenses = parseFloat(expenseRow.total_expenses) || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;
    const transactions = parseInt(salesRows.total_transactions) || 0;

    if (transactions === 0) continue; // Skip inactive businesses

    const summary = {
      type: 'eod_summary',
      businessId: business.id,
      businessName: business.name,
      date: today.toISOString().split('T')[0],
      transactions,
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      paymentBreakdown: {
        cash: parseFloat(salesRows.cash) || 0,
        mpesa: parseFloat(salesRows.mpesa) || 0,
        debt: parseFloat(salesRows.debt) || 0
      }
    };

    console.log(`📊 [FinanceJob] EOD Summary for "${business.name}":`);
    console.log(`   Revenue: KSh ${revenue.toLocaleString()} | COGS: KSh ${cogs.toLocaleString()} | Gross Profit: KSh ${grossProfit.toLocaleString()} | Net Profit: KSh ${netProfit.toLocaleString()}`);

    if (io) {
      io.to(business.id).emit('automation-alert', summary);
    }
  }
}

/**
 * Debt Monitoring Scanner
 * Flags debts older than 7 days that are still pending and fires reminders.
 */
async function scanOverdueDebts() {
  const dbx = getDatabase();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const overdueDebts = await dbx('debts')
    .where('status', 'pending')
    .where('created_at', '<=', sevenDaysAgo)
    .select('id', 'business_id', 'customer_name', 'customer_phone', 'balance', 'created_at', 'notes');

  if (!overdueDebts.length) {
    console.log('✅ [FinanceJob] No overdue debts detected.');
    return;
  }

  // Group by business
  const byBusiness = overdueDebts.reduce((acc, debt) => {
    if (!acc[debt.business_id]) acc[debt.business_id] = [];
    acc[debt.business_id].push(debt);
    return acc;
  }, {});

  for (const [businessId, debts] of Object.entries(byBusiness)) {
    const totalOutstanding = debts.reduce((sum, d) => sum + parseFloat(d.balance), 0);

    const alertPayload = {
      type: 'overdue_debt_alert',
      businessId,
      timestamp: new Date().toISOString(),
      count: debts.length,
      totalOutstanding,
      debts: debts.map(d => ({
        id: d.id,
        customerName: d.customer_name,
        customerPhone: d.customer_phone,
        balance: parseFloat(d.balance),
        daysPending: Math.floor((Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }))
    };

    console.warn(`💸 [FinanceJob] Business ${businessId}: ${debts.length} overdue debt(s) totalling KSh ${totalOutstanding.toLocaleString()}`);

    if (io) {
      io.to(businessId).emit('automation-alert', alertPayload);
    }
  }
}

/**
 * Initialize all Finance cron jobs.
 * @param {import('socket.io').Server} socketServer
 */
function initFinanceJob(socketServer) {
  io = socketServer;

  // EOD Summary — runs every night at 23:58 (just before midnight)
  cron.schedule('58 23 * * *', async () => {
    console.log('📊 [FinanceJob] Running End-of-Day financial summary...');
    try {
      await runEODSummary();
    } catch (err) {
      console.error('❌ [FinanceJob] EOD failed:', err.message);
    }
  });

  // Debt scanner — runs every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('💸 [FinanceJob] Scanning for overdue debts...');
    try {
      await scanOverdueDebts();
    } catch (err) {
      console.error('❌ [FinanceJob] Debt scan failed:', err.message);
    }
  });

  console.log('💰 [FinanceJob] Scheduled: EOD reporter + debt scanner active.');
}

module.exports = { initFinanceJob, runEODSummary, scanOverdueDebts };
