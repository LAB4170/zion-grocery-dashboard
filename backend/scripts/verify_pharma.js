const { db } = require('../config/database');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

async function verifyPharmaCategory() {
  console.log('🧪 Starting Pharmacy Pilot Verification...');

  try {
    // 1. Create a dummy business for testing
    const businessId = uuidv4();
    await db('businesses').insert({
      id: businessId,
      name: 'Pharma Test Center',
      owner_email: 'pharma@test.com',
      business_category: 'pharmacy',
      settings: JSON.stringify({ auto_expiry_alerts: true })
    });
    console.log(`✅ Business created: ${businessId}`);

    // 2. Create a product with Pharmacy-specific metadata
    const pharmaProduct = await Product.create({
      businessId,
      name: 'Amoxicillin 500mg',
      category: 'Antibiotics',
      price: 15.00,
      stockQuantity: 100,
      unit: 'strips',
      metadata: {
        batch_no: 'BATCH-2026-001',
        expiry_date: '2026-12-31',
        requires_prescription: true,
        manufacturer: 'Nexus Health'
      }
    });
    console.log(`✅ Pharma Product created: ${pharmaProduct.name}`);
    console.log('📦 Metadata:', pharmaProduct.metadata);

    // 3. Retrieve it back
    const retrieved = await Product.findById(pharmaProduct.id, businessId);
    console.log('🔍 Retreival Check:');
    if (retrieved.metadata.batch_no === 'BATCH-2026-001') {
      console.log('✅ Metadata persistence verified');
    } else {
      console.log('❌ Metadata mismatch!');
    }

    // 4. Perform a JSONB search (simulate Expiry Alert)
    const expiringSoon = await db('products')
      .where('business_id', businessId)
      .whereRaw("metadata->>'expiry_date' <= ?", ['2027-01-01']);
    
    console.log(`📡 Expiry Search Found: ${expiringSoon.length} items expiring before 2027.`);
    if (expiringSoon.length > 0) {
      console.log('✅ JSONB Query Logic verified');
    }

    // Cleanup
    await db('products').where('business_id', businessId).del();
    await db('businesses').where('id', businessId).del();
    console.log('🧹 Cleanup complete.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
  }
}

verifyPharmaCategory();
