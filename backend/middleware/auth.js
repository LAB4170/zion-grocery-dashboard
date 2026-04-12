const { db } = require('../config/database');
const { admin, isFirebaseInitialized } = require('../config/firebase');
const { getCachedBusiness, cacheBusinessResult } = require('../utils/cache');

/**
 * Multi-Tenant Auth Middleware
 * Verifies the Firebase ID token and links the user to their business tenant.
 * Reads the `Authorization` header and performs lookup by owner_email.
 */
const requireBusinessAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const userEmailHeader = req.headers['x-user-email'];
    let userEmail = userEmailHeader;

    // Bypass for creating a new business (onboarding) OR checking if one exists (me)
    const isNewBusinessRoute = req.baseUrl === '/api/business' && (req.method === 'POST' || (req.method === 'GET' && req.path === '/me'));

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (isFirebaseInitialized) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          userEmail = decodedToken.email;
          console.log(`✅ Token verified for: ${userEmail}`);
        } catch (e) {
          console.error('❌ Token Verification Failed in Bypass:', e.message);
        }
      }
    }

    if (isNewBusinessRoute && userEmail) {
      req.userEmail = userEmail;
      return next();
    }

    // 1. Verify Firebase ID Token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No auth token provided. Authentication required.' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!isFirebaseInitialized) {
      console.warn('⚠️ Authentication bypassed/limited: Firebase Admin not initialized.');
      // In development, we might want to allow access with a mock email if provided via header
      if (process.env.NODE_ENV === 'development' && userEmailHeader) {
        userEmail = userEmailHeader;
      } else {
        return res.status(503).json({ 
          success: false, 
          message: 'Authentication service is temporarily unavailable. Please try again later.' 
        });
      }
    } else {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userEmail = decodedToken.email;
        console.log(`✅ Token verified for: ${userEmail}`);
      } catch (tokenError) {
        console.error('❌ Firebase Token Verification Failed:', tokenError.message);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid or expired authentication token.' 
        });
      }
    }

    // 2. Look up the business associated with this email
    // FIRST: Check Cache
    let business = await getCachedBusiness(userEmail);
    
    if (!business) {
      console.log(`🔍 Cache Miss for ${userEmail}. Fetching from DB.`);
      business = await db('businesses').where('owner_email', userEmail).first();
      
      if (business) {
        // SECOND: Populate Cache for next request
        await cacheBusinessResult(userEmail, business);
        console.log(`✅ Cached business for ${userEmail}`);
      }
    } else {
      console.log(`⚡ Cache Hit for ${userEmail}`);
    }

    if (!business) {
        return res.status(404).json({
            success: false,
            message: 'No business found for this user. Please register a business.',
            code: 'NO_BUSINESS_REGISTERED'
        });
    }

    if (business.is_suspended) {
        return res.status(403).json({
            success: false,
            message: 'This account has been suspended by an administrator. Please contact support.',
            code: 'ACCOUNT_SUSPENDED'
        });
    }

    // 3. Attach metadata to request scope
    req.business = business;
    req.businessId = business.id;
    req.userEmail = userEmail;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};

module.exports = {
  requireBusinessAuth
};
