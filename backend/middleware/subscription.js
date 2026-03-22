const requireActiveSubscription = async (req, res, next) => {
  // Pass through all requests - Billing removed by user request
  return next();
};

module.exports = {
  requireActiveSubscription
};
