/**
 * Subscription Middleware
 * Ensures the business has an active trial or a paid subscription.
 * Blocks write operations (POST, PUT, DELETE) if the subscription is expired.
 */
const requireActiveSubscription = async (req, res, next) => {
  const business = req.business;

  if (!business) {
    return res.status(403).json({ 
      success: false, 
      message: 'Business context required for subscription check.' 
    });
  }

  const now = new Date();
  const status = business.subscription_status;
  const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
  const subEndsAt = business.subscription_ends_at ? new Date(business.subscription_ends_at) : null;

  let isLevelActive = false;

  if (status === 'active') {
    // If explicitly active, check if sub has ended
    if (!subEndsAt || subEndsAt > now) {
      isLevelActive = true;
    }
  } else if (status === 'trial') {
    // If in trial, check if trial period is still valid
    if (trialEndsAt && trialEndsAt > now) {
      isLevelActive = true;
    }
  }

  // If not active/trial, block mutation requests
  // We usually allow GET requests so they can still see their data/billing page
  if (!isLevelActive && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(402).json({
      success: false,
      message: 'Subscription or trial expired. Please renew to continue performing actions.',
      code: 'SUBSCRIPTION_EXPIRED',
      status,
      trialEndsAt,
      subEndsAt
    });
  }

  next();
};

module.exports = {
  requireActiveSubscription
};
