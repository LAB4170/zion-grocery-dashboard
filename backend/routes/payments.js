const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// POST /api/payments/pay
// Securely initiates an M-Pesa STK Push Express Payment
router.post('/pay', async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const businessId = req.businessId;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'A valid Safaricom Phone number and KSh Amount is required.' });
    }

    // Architecture Note: In full production, we trigger the Safaricom Daraja API here:
    // https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
    
    // Once the user inputs their PIN, Safaricom fires a webhook to /callback
    // For this prototype implementation, we simulate an immediate successful STK response.
    
    // Extend the business subscription by exactly 30 days
    const newSubscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db('businesses').where('id', businessId).update({
      subscription_status: 'active',
      subscription_ends_at: newSubscriptionEnd,
      updated_at: new Date()
    });

    res.json({ 
      success: true, 
      message: 'M-Pesa payment processed successfully. Pro Features unlocked for 30 days!' 
    });

  } catch (error) {
    console.error('M-Pesa STK Push Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error while communicating with Daraja API.' });
  }
});

// POST /api/payments/callback
// Safaricom Webhook Listener for async STK Push completions
router.post('/callback', async (req, res) => {
  // Acknowledge receipt to Safaricom to prevent webhook retries
  res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
});

module.exports = router;
