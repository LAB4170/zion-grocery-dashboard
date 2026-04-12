const { db } = require('../config/database');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const FiscalService = require('../services/fiscal/FiscalService');
const { v4: uuidv4 } = require('uuid');

async function verifyScalingAndCompliance() {
  console.log('🧪 Starting Universal Scaling & Compliance Verification...');

  try {
    // 1. Setup Test Business (Pharmacy Category)
    const businessId = uuidv4();
    const business = {
      id: businessId,
      name: 'Scaling Pharma Ltd',
      owner_email: 'scaling_pharma@test.com',
      business_category: 'pharmacy', // CRITICAL for validation/compliance
      settings: { tax_pin: 'P012345678Q', tims_id: 'VSCU-DEMO-01' }
    };
    
    await db('businesses').insert({
      ...business,
      settings: JSON.stringify(business.settings)
    });
    console.log('✅ Business Profile created (Pharmacy Category)');

    // 2. Test Category Engine Validation (Failure Case)
    console.log('🔍 Testing Validation Engine (Missing Batch Number)...');
    try {
      await Product.create({
        businessId,
        businessCategory: 'pharmacy',
        name: 'Paracetamol',
        category: 'Painkillers',
        price: 5.0,
        metadata: {} // Missing batch_no and expiry_date
      });
      console.log('❌ Error: Product was created without required Pharmacy metadata!');
    } catch (err) {
      console.log(`✅ Success: Validation blocked invalid product: ${err.message}`);
    }

    // 3. Test Category Engine Validation (Success Case)
    const pharmaProduct = await Product.create({
      businessId,
      businessCategory: 'pharmacy',
      name: 'Paracetamol',
      category: 'Painkillers',
      price: 5.0,
      metadata: { batch_no: 'B123', expiry_date: '2028-01-01' }
    });
    console.log('✅ Success: Product with correct metadata created');

    // 4. Test Fiscal Compliance Hook
    console.log('⚖️ Testing Fiscal Compliance Hook (KRA eTIMS)...');
    const dummySale = {
      id: uuidv4(),
      productId: pharmaProduct.id,
      quantity: 2,
      total_amount: 10.0,
      metadata: {}
    };

    const fiscalResult = await FiscalService.processSale(business, dummySale, pharmaProduct);
    console.log('📡 Fiscal Result:', fiscalResult);

    if (fiscalResult.success && fiscalResult.fiscal_signature) {
      console.log(`✅ Success: Fiscal signature generated: ${fiscalResult.fiscal_signature}`);
    } else {
      console.log('❌ Error: Fiscal reporting failed!');
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

verifyScalingAndCompliance();
