const { db } = require('./backend/config/database');
const Sale = require('./backend/models/Sale');

async function testSaleCreate() {
  const saleData = {
    productId: '4209a7dc-130f-4848-94b9-5fded4dfb505',
    productName: 'bananas',
    quantity: 1,
    unit_price: 10,
    total: 10,
    payment_method: 'cash',
    businessId: 'f681144b-d2cc-4d03-a915-828278df1333'
  };

  try {
    const sale = await Sale.create(saleData);
    console.log('✅ Sale created:', sale);
  } catch (err) {
    console.error('❌ Sale creation failed:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    process.exit();
  }
}

testSaleCreate();
