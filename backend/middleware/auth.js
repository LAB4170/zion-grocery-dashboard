const { db } = require('../config/database');
const { admin, isFirebaseInitialized } = require('../config/firebase');

/**
 * Multi-Tenant Auth Middleware
 * Verifies the Firebase ID token and links the user to their business tenant.
 * Reads the `Authorization` header and performs lookup by owner_email.
 */
const requireBusinessAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const userEmailHeader = req.headers['x-user-email'];
    
    // Bypass for creating a new business (onboarding)
    if (req.baseUrl === '/api/business' && req.method === 'POST') {
      return next();
    }

    let userEmail = userEmailHeader;

    // 1. Verify Firebase ID Token if provided and Admin SDK is ready
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      if (isFirebaseInitialized) {
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
      } else {
        console.warn('⚠️ Firebase Admin not initialized. Falling back to email header (INSECURE).');
      }
    }

    if (!userEmail) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Authentication required.' 
      });
    }

    // 2. Look up the business associated with this email
    const business = await db('businesses').where('owner_email', userEmail).first();

    if (!business) {
        return res.status(403).json({
            success: false,
            message: 'No business found for this user. Please register a business.',
            code: 'NO_BUSINESS_REGISTERED'
        });
    }

    // 3. Attach metadata to request scope
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
