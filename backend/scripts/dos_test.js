const axios = require('axios');

async function dosTest() {
  const url = 'http://localhost:5000/health';
  console.log(`🚀 Starting DoS simulation on ${url}...`);
  
  const requests = [];
  for (let i = 0; i < 600; i++) {
    requests.push(
      axios.get(url)
        .then(res => ({ status: res.status, success: true }))
        .catch(err => ({ status: err.response?.status || 'ERROR', success: false }))
    );
  }

  const results = await Promise.all(requests);
  const success = results.filter(r => r.success).length;
  const blocked = results.filter(r => r.status === 429).length;
  const other = results.length - success - blocked;

  console.log(`\n📊 DoS Test Results:`);
  console.log(`✅ Successful Requests: ${success}`);
  console.log(`🚫 Blocked (429 Too Many Requests): ${blocked}`);
  console.log(`⚠️  Other Failures: ${other}`);

  if (blocked > 0) {
    console.log('\n🛡️  RATE LIMITER VERIFIED: The system correctly blocked the flood.');
  } else {
    console.log('\n⚠️  RATE LIMITER FAILED: All requests passed through.');
  }
}

dosTest();
