/**
 * jobs/index.js
 * Central job scheduler entry point.
 * Import and call initJobs(io) from server.js to activate all background automation.
 */
const { initInventoryJob } = require('./InventoryJob');
const { initFinanceJob } = require('./FinanceJob');

function initJobs(io) {
  console.log('🤖 [Automation] Initializing background job engine...');
  initInventoryJob(io);
  initFinanceJob(io);
  console.log('🤖 [Automation] All background jobs are now running.');
}

module.exports = { initJobs };
