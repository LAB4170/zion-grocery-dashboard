/**
 * Subscription Middleware - BILLING DISABLED
 * Billing is not enforced. All users have full access.
 * This middleware is kept as a placeholder for future billing implementation.
 */
const requireActiveSubscription = async (req, res, next) => {
  return next();
};

module.exports = {
  requireActiveSubscription
};
