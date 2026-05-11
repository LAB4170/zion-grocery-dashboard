const axios = require('axios');

async function sqliTest() {
  const url = 'http://localhost:5000/api/products';
  // Attempt to inject a SQL comment or a UNION
  const maliciousSearch = "'; DROP TABLE products; --";
  
  console.log(`🚀 Attempting SQL Injection on ${url} with search: ${maliciousSearch}`);

  try {
    const res = await axios.get(url, {
      params: { search: maliciousSearch },
      headers: { 'Authorization': 'Bearer MOCK_TOKEN' } // We know this will fail auth but we want to see if the DB layer is touched
    });
    console.log('Response:', res.data);
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('🛡️ AUTH BLOCKED: Security layer prevented unauthenticated access.');
    } else {
      console.log('Error:', err.message);
    }
  }
}

sqliTest();
