const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

async function verify() {
  const email = 'isolation-test-' + Date.now() + '@example.com';
  console.log(`Testing with new identity: ${email}`);

  try {
    // 1. Create a business for this new identity
    console.log('Creating business...');
    const createRes = await axios.post(`${API_URL}/business`, {
      name: 'Isolation Test Store',
      owner_email: email,
      currency: 'KSh'
    }, {
      headers: { 'x-user-email': email }
    });
    console.log('Business Created:', createRes.data.data.id);

    // 2. Fetch stats for this brand-new business
    console.log('Fetching stats...');
    const statsRes = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: { 'x-user-email': email }
    });
    
    const stats = statsRes.data.data;
    console.log('Revenue:', stats.sales.total_revenue);
    console.log('Products:', stats.inventory.low_stock_count);

    if (stats.sales.total_revenue === 0 && stats.inventory.total_valuation === 0) {
      console.log('✅ PASS: New business has no leaked data.');
    } else {
      console.error('❌ FAIL: New business saw data leakage!');
      console.log(JSON.stringify(stats, null, 2));
    }

    // 3. Fetch charts
    console.log('Fetching charts...');
    const chartsRes = await axios.get(`${API_URL}/dashboard/charts`, {
      headers: { 'x-user-email': email }
    });
    const hasChartData = chartsRes.data.data.daily_sales.some(d => d.total_revenue > 0);
    if (!hasChartData) {
      console.log('✅ PASS: Charts are empty for new tenant.');
    } else {
      console.error('❌ FAIL: Charts contain leaked data!');
      console.log(JSON.stringify(chartsRes.data.data.daily_sales, null, 2));
    }

  } catch (err) {
    console.error('Verification failed:', err.response?.data || err.message);
  }
}

verify();
