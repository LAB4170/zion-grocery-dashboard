
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_SECRET = process.env.ADMIN_SECRET;

async function runSecurityTests() {
  console.log('🛡️ Starting Security Verification Audit...\n');

  // Test 1: Unauthenticated Admin Access
  try {
    console.log('Test 1: GET /admin/overview (No Header) - Expected 401');
    await axios.get(`${BASE_URL}/admin/overview`);
    console.error('❌ FAIL: Accessed admin without secret key!');
  } catch (err) {
    if (err.response?.status === 401) console.log('✅ PASS: Blocked unauthenticated admin access.');
    else console.error(`❌ FAIL: Unexpected error status ${err.response?.status}`);
  }

  // Test 2: Invalid Admin Secret
  try {
    console.log('\nTest 2: GET /admin/overview (Invalid Header) - Expected 401');
    await axios.get(`${BASE_URL}/admin/overview`, {
      headers: { 'x-admin-key': 'wrong_secret_key_123' }
    });
    console.error('❌ FAIL: Accessed admin with wrong secret!');
  } catch (err) {
    if (err.response?.status === 401) console.log('✅ PASS: Blocked invalid admin secret.');
    else console.error(`❌ FAIL: Unexpected error status ${err.response?.status}`);
  }

  // Test 3: Authenticated Business Access (No Token)
  try {
    console.log('\nTest 3: GET /sales (No Token) - Expected 401');
    await axios.get(`${BASE_URL}/sales`);
    console.error('❌ FAIL: Accessed sales without token!');
  } catch (err) {
    if (err.response?.status === 401) console.log('✅ PASS: Blocked unauthenticated sales access.');
    else console.error(`❌ FAIL: Unexpected error status ${err.response?.status}`);
  }

  // Test 4: Valid Admin Key Functional Check
  try {
    console.log('\nTest 4: GET /admin/overview (Valid Key) - Expected 200');
    const res = await axios.get(`${BASE_URL}/admin/overview`, {
      headers: { 'x-admin-key': ADMIN_SECRET }
    });
    if (res.status === 200 && res.data.data) {
        console.log('✅ PASS: Admin overview returned data successfully.');
        console.log(`   → Total Businesses: ${res.data.data.totalBusinesses}`);
        console.log(`   → Total Revenue: KES ${res.data.data.totalRevenue?.toFixed(2)}`);
        console.log(`   → Retention Rate: ${res.data.data.retentionRate}%`);
        console.log(`   → Revenue Growth: ${res.data.data.growth?.revenue}%`);
    } else {
        console.error('❌ FAIL: Admin overview returned malformed data.', res.data);
    }
  } catch (err) {
    console.error(`❌ FAIL: Authorized admin access failed: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
  }

  console.log('\n🛡️ Security Audit Tests Completed.');
}

runSecurityTests();
