const { db } = require('../config/database');

/**
 * Middleware to enforce active subscription status.
 * Blocks mutation requests (POST, PUT, DELETE) if the business has no active subscription or trial.
 * GET requests remain allowed (Read-Only Mode).
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    
    // If businessId is not attached, something is wrong with the auth flow
    if (!businessId) {
      return res.status(401).json({
        success: false,
        message: 'Business context missing. Authentication required.'
      });
    }

    const business = await db('businesses').where('id', businessId).first();

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business record not found.'
      });
    }

    const now = new Date();
    const trialExpired = business.trial_ends_at && new Date(business.trial_ends_at) < now;
    const subscriptionExpired = !business.subscription_ends_at || new Date(business.subscription_ends_at) < now;
    
    const isRestrictedMethod = ['POST', 'PUT', 'DELETE'].includes(req.method);

    // Allow everything if trial OR subscription is still valid
    if (!trialExpired || !subscriptionExpired) {
      return next();
    }

    // If both expired AND user is trying to modify data -> 402 Payment Required
    if (isRestrictedMethod) {
      return res.status(402).json({
        success: false,
        message: 'Subscription expired. Please upgrade to continue managing your business.',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }

    // Allow GET requests (Read-Only mode) even if expired
    next();
  } catch (error) {
    console.error('Subscription Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during subscription check' });
  }
};

module.exports = {
  requireActiveSubscription
};
