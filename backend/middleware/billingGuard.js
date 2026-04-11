const { AppError } = require('./errorHandler');

/**
 * Billing Guard Middleware
 * Ensures the business has an active subscription or is within a trial period.
 * 
 * It depends on req.business being populated by the requireBusinessAuth middleware.
 */
const requireActiveSubscription = (req, res, next) => {
  const business = req.business;

  if (!business) {
    return next(new AppError('Authentication context missing. Cannot verify billing status.', 401));
  }

  const { subscription_status, trial_ends_at, subscription_ends_at } = business;
  const now = new Date();

  // 1. Check for 'active' or 'trialing' status
  if (subscription_status === 'active' || subscription_status === 'trialing') {
    return next();
  }

  // 2. Check Trial Expiration
  // trial_ends_at might be null if they never had a trial or it was manually set
  if (trial_ends_at) {
    const trialEnd = new Date(trial_ends_at);
    if (trialEnd > now) {
      return next(); // Still in trial
    }
  }

  // 3. Fallback: If status is handled by a simple 'active' flag but they expired
  if (subscription_status === 'expired' || subscription_status === 'past_due') {
    return next(new AppError(
      'Payment Required: Your subscription has expired or is past due. Please update your billing information to continue.',
      402 // Payment Required
    ));
  }

  // 4. Final Fail-Close
  console.warn(`🛡️ BillingGuard Blocked Business ${business.id}: Status is ${subscription_status}, Trial ended ${trial_ends_at}`);
  
  return next(new AppError(
    'Subscription Inactive: Access to this feature is restricted. Please subscribe to continue.',
    402
  ));
};

module.exports = { requireActiveSubscription };
