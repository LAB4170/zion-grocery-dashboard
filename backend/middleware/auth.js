const { db } = require('../config/database');

/**
 * Multi-Tenant Auth Middleware
 * Reads the `x-user-email` header provided by the frontend (after Google login).
 * Looks up the corresponding business where owner_email = x-user-email.
 * Attaches `req.businessId` to the request to isolate all queries to that tenant.
 */
const requireBusinessAuth = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    
    // Bypass for creating a new business (onboarding)
    if (req.path === '/api/business' && req.method === 'POST') {
      return next();
    }

    if (!userEmail) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Missing x-user-email header.' 
      });
    }

    // Look up the business associated with this email
    const business = await db('businesses').where('owner_email', userEmail).first();

    if (!business) {
        // Return 403 Forbidden to trigger the frontend into /onboarding routing
        return res.status(403).json({
            success: false,
            message: 'No business found for this user. Please register a business.',
            code: 'NO_BUSINESS_REGISTERED'
        });
    }

    // Attach to request scope
    req.businessId = business.id;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};

module.exports = {
  requireBusinessAuth
};
