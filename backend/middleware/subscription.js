const { db } = require('../config/database');

const requireActiveSubscription = async (req, res, next) => {
  // Always permit read operations so users can view historical data
  if (req.method === 'GET') {
    return next();
  }

  // The auth middleware attaches req.businessId
  if (!req.businessId) {
    // If there's no business context yet (e.g., creating a business), allow it
    if (req.baseUrl === '/api/business' && req.method === 'POST') {
      return next();
    }
    return res.status(400).json({ success: false, message: 'Missing business context for transaction.' });
  }

  try {
    const business = await db('businesses').where('id', req.businessId).first();
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business explicitly not found.' });
    }

    const now = new Date();

    // 1. Check Active Status
    if (business.subscription_status === 'active') {
      if (business.subscription_ends_at && new Date(business.subscription_ends_at) >= now) {
        return next();
      } else {
        // Expired!
        await db('businesses').where('id', business.id).update({ subscription_status: 'past_due' });
        return res.status(402).json({ success: false, message: 'Subscription expired. Please renew.' });
      }
    }

    // 2. Check Trial Status
    if (business.subscription_status === 'trial') {
      if (new Date(business.trial_ends_at) >= now) {
        return next();
      } else {
        // Trial Expired
        await db('businesses').where('id', business.id).update({ subscription_status: 'past_due' });
        return res.status(402).json({ success: false, message: 'Your 14-day free trial has expired. Payment required to continue.' });
      }
    }

    // 3. Fallback (past_due or canceled)
    return res.status(402).json({ success: false, message: 'Action blocked. Active subscription required.' });

  } catch (error) {
    console.error('Error verifying subscription lock state:', error);
    res.status(500).json({ success: false, message: 'Server error authorizing database write.' });
  }
};

module.exports = { requireActiveSubscription };
