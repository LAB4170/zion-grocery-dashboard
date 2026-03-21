const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('./config/database');

const fs = require('fs');
async function check() {
  let output = '';
  const log = (msg) => { output += msg + '\n'; console.log(msg); };
  try {
    log('--- Businesses ---');
    const businesses = await db('businesses').select('id', 'name', 'owner_email', 'created_at');
    output += JSON.stringify(businesses, null, 2) + '\n';

    log('--- Admin Sales Dates ---');
    const adminSales = await db('sales')
      .where('business_id', 'f681144b-d2cc-4d03-a915-828278df1333')
      .select('created_at', 'total', 'payment_method');
    output += JSON.stringify(adminSales, null, 2) + '\n';
    const salesCounts = await db('sales')
      .select('business_id')
      .count('* as count')
      .groupBy('business_id');
    output += JSON.stringify(salesCounts, null, 2) + '\n';

    log('\n--- Products Breakdown by Business ---');
    const productCounts = await db('products')
      .select('business_id')
      .count('* as count')
      .groupBy('business_id');
    output += JSON.stringify(productCounts, null, 2) + '\n';

    const outputPath = path.join(__dirname, 'diagnostic_results.txt');
    fs.writeFileSync(outputPath, output);
  } catch (err) {
    const outputPath = path.join(__dirname, 'diagnostic_results.txt');
    fs.writeFileSync(outputPath, 'Diagnostic failed: ' + err.message);
  } finally {
    process.exit();
  }
}

check();
