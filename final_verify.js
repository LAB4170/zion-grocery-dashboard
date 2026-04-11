const axios = require('axios');

async function testSale() {
  try {
    const response = await axios.post('http://localhost:5000/api/sales', {
      productId: '4209a7dc-130f-4848-94b9-5fded4dfb505',
      quantity: 1,
      paymentMethod: 'cash'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-dev-bypass': 'true'
      }
    });
    console.log('✅ Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ Failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    process.exit();
  }
}

testSale();
