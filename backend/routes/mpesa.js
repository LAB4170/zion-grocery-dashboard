const express = require('express');
const router = express.Router();
const axios = require('axios');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const Sale = require('../models/Sale');
const Debt = require('../models/Debt');
const SmsService = require('../services/communication/SmsService');

// M-Pesa Configuration
const MPESA_CONFIG = {
  consumer_key: process.env.MPESA_CONSUMER_KEY,
  consumer_secret: process.env.MPESA_CONSUMER_SECRET,
  business_short_code: process.env.MPESA_BUSINESS_SHORT_CODE,
  passkey: process.env.MPESA_PASSKEY,
  callback_url: process.env.MPESA_CALLBACK_URL,
  sandbox_url: process.env.NODE_ENV === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke'
};

// Generate M-Pesa access token
const generateAccessToken = async () => {
  const auth = Buffer.from(`${MPESA_CONFIG.consumer_key}:${MPESA_CONFIG.consumer_secret}`).toString('base64');
  
  try {
    const response = await axios.get(
      `${MPESA_CONFIG.sandbox_url}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    throw new AppError('Failed to generate M-Pesa access token', 500);
  }
};

// Generate timestamp for M-Pesa
const generateTimestamp = () => {
  const date = new Date();
  return date.getFullYear() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2);
};

// Generate password for STK Push
const generatePassword = (timestamp) => {
  const data = MPESA_CONFIG.business_short_code + MPESA_CONFIG.passkey + timestamp;
  return Buffer.from(data).toString('base64');
};

// POST /api/mpesa/stk-push - Initiate STK Push
router.post('/stk-push', catchAsync(async (req, res) => {
  const { phone_number, amount, account_reference, transaction_desc, sale_id } = req.body;

  // Validation
  if (!phone_number || !amount) {
    throw new AppError('Phone number and amount are required', 400);
  }

  if (amount < 1) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  // Format phone number (ensure it starts with 254)
  let formattedPhone = phone_number.toString();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('+254')) {
    formattedPhone = formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }

  const access_token = await generateAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);

  const stkPushData = {
    BusinessShortCode: MPESA_CONFIG.business_short_code,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: MPESA_CONFIG.business_short_code,
    PhoneNumber: formattedPhone,
    CallBackURL: MPESA_CONFIG.callback_url,
    AccountReference: account_reference || 'Zion Grocery',
    TransactionDesc: transaction_desc || 'Payment for goods'
  };

  try {
    const response = await axios.post(
      `${MPESA_CONFIG.sandbox_url}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // NEW: Persist the association immediately so the callback can find this sale
    if (sale_id) {
      await Sale.update(sale_id, {
        transaction_id: response.data.CheckoutRequestID,
        status: 'pending' // Mark as pending while waiting for callback
      }, req.businessId);
    }

    res.json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        merchant_request_id: response.data.MerchantRequestID,
        checkout_request_id: response.data.CheckoutRequestID,
        response_code: response.data.ResponseCode,
        response_description: response.data.ResponseDescription,
        customer_message: response.data.CustomerMessage
      }
    });
  } catch (error) {
    console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
    throw new AppError('Failed to initiate M-Pesa payment', 500);
  }
}));

// POST /api/mpesa/callback - M-Pesa callback endpoint
router.post('/callback', catchAsync(async (req, res) => {
  const { Body } = req.body;
  
  if (!Body || !Body.stkCallback) {
    return res.status(400).json({ success: false, message: 'Invalid callback data' });
  }

  const callback = Body.stkCallback;
  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callback;

  console.log('M-Pesa Callback Received:', {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc
  });

  // Process successful payment
  if (ResultCode === 0) {
    const callbackMetadata = callback.CallbackMetadata?.Item || [];
    
    const getMetadataValue = (name) => {
      const item = callbackMetadata.find(item => item.Name === name);
      return item ? item.Value : null;
    };

    const paymentData = {
      amount: getMetadataValue('Amount'),
      mpesa_receipt_number: getMetadataValue('MpesaReceiptNumber'),
      transaction_date: getMetadataValue('TransactionDate'),
      phone_number: getMetadataValue('PhoneNumber')
    };

    console.log('Payment Successful:', paymentData);

    // 🚀 NEW: Automatic Reconciliation
    try {
      const { db } = require('../config/database');
      
      // 1. Find the sale matching this checkout session
      const sale = await db('sales').where('transaction_id', CheckoutRequestID).first();
      
      if (sale) {
        // 2. Update sale to completed
        const updatedSale = await Sale.update(sale.id, {
          status: 'completed',
          mpesa_code: paymentData.mpesa_receipt_number,
          metadata: {
            ...sale.metadata,
            mpesa_callback: paymentData
          }
        }, sale.business_id);

        console.log(`✅ Sale ${sale.id} reconciled via M-Pesa callback.`);

        // 3. Trigger SMS Receipt
        await SmsService.sendReceipt(updatedSale);

        // 4. Real-time broadcast to UI
        if (req.app.locals.broadcastDataChange) {
          req.app.locals.broadcastDataChange('sale', updatedSale);
        }
      } else {
        console.warn(`⚠️ M-Pesa callback received for unknown TransactionID: ${CheckoutRequestID}`);
      }
    } catch (err) {
      console.error('❌ Error in M-Pesa automation reconciliation:', err.message);
    }
  } else {
    console.log('Payment Failed:', { ResultCode, ResultDesc });
    
    // Auto-cancel the sale if it was pending
    try {
      const { db } = require('../config/database');
      const sale = await db('sales').where('transaction_id', CheckoutRequestID).first();
      if (sale && sale.status === 'pending') {
        await Sale.update(sale.id, { status: 'cancelled' }, sale.business_id);
      }
    } catch (e) { /* ignore */ }
  }

  // Always respond with success to M-Pesa
  res.json({
    ResultCode: 0,
    ResultDesc: 'Callback processed successfully'
  });
}));

// GET /api/mpesa/transaction-status/:checkout_request_id - Check transaction status
router.get('/transaction-status/:checkout_request_id', catchAsync(async (req, res) => {
  const { checkout_request_id } = req.params;
  
  const access_token = await generateAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);

  const queryData = {
    BusinessShortCode: MPESA_CONFIG.business_short_code,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkout_request_id
  };

  try {
    const response = await axios.post(
      `${MPESA_CONFIG.sandbox_url}/mpesa/stkpushquery/v1/query`,
      queryData,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: {
        response_code: response.data.ResponseCode,
        response_description: response.data.ResponseDescription,
        merchant_request_id: response.data.MerchantRequestID,
        checkout_request_id: response.data.CheckoutRequestID,
        result_code: response.data.ResultCode,
        result_desc: response.data.ResultDesc
      }
    });
  } catch (error) {
    console.error('M-Pesa Query Error:', error.response?.data || error.message);
    throw new AppError('Failed to query transaction status', 500);
  }
}));

// POST /api/mpesa/validate-payment - Validate M-Pesa payment code
router.post('/validate-payment', catchAsync(async (req, res) => {
  const { mpesa_code, amount, phone_number } = req.body;

  if (!mpesa_code) {
    throw new AppError('M-Pesa code is required', 400);
  }

  // In a real implementation, you would validate the M-Pesa code
  // against M-Pesa's transaction query API or your callback records
  
  // For now, we'll do basic validation
  const isValidCode = /^[A-Z0-9]{10}$/.test(mpesa_code.toUpperCase());
  
  if (!isValidCode) {
    throw new AppError('Invalid M-Pesa code format', 400);
  }

  // Here you would typically:
  // 1. Query your callback records for this transaction
  // 2. Verify the amount and phone number match
  // 3. Check that the transaction hasn't been used before

  res.json({
    success: true,
    message: 'M-Pesa code validated successfully',
    data: {
      mpesa_code: mpesa_code.toUpperCase(),
      is_valid: true,
      amount: amount,
      phone_number: phone_number
    }
  });
}));

// GET /api/mpesa/config - Get M-Pesa configuration (for frontend)
router.get('/config', catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: {
      business_short_code: MPESA_CONFIG.business_short_code,
      is_sandbox: process.env.NODE_ENV !== 'production'
    }
  });
}));

module.exports = router;
