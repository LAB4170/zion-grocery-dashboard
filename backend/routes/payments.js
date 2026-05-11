const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { requireBusinessAuth } = require('../middleware/auth');
const axios = require('axios');
const { debtPaymentValidationRules, validate } = require('../middleware/validation');
const { requireTenantContext } = require('../middleware/tenantGuard');

// POST /api/payments/pay
// Simplified subscription renewal (M-Pesa integration removed)
router.post('/pay', requireBusinessAuth, requireTenantContext, debtPaymentValidationRules, validate, async (req, res) => {
  try {
    const businessId = req.businessId;

    // Architecture Note: External payment integrations (M-Pesa) have been removed.
    // This endpoint now performs a direct subscription extension for development/simulated flow.
    
    const newSubscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db('businesses').where('id', businessId).update({
      subscription_status: 'active',
      subscription_ends_at: newSubscriptionEnd,
      updated_at: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Payment simulated successfully. Pro Features unlocked for 30 days!' 
    });

  } catch (error) {
    console.error('Payment Processing Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error while processing payment.' });
  }
});

module.exports = router;
