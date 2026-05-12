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
    let userEmail = null;

    // Bypass for creating a new business (onboarding) OR checking if one exists (me)
    const isNewBusinessRoute = (req.baseUrl === '/api/business' || req.originalUrl === '/api/business/me') && 
                               (req.method === 'POST' || (req.method === 'GET' && (req.path === '/me' || req.path === '/')));

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (isFirebaseInitialized) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          userEmail = decodedToken.email;
          if (userEmail) {
            console.log(`[AUTH] 👤 Identity verified: ${userEmail}`);
          } else {
            console.warn('[AUTH] ⚠️ Token verified but no email found in payload.');
          }
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
      const userEmailHeader = req.headers['x-user-email'];
      const isLocalDev = process.env.NODE_ENV === 'development' || !process.env.RENDER;
      if (isLocalDev && userEmailHeader) {
        userEmail = userEmailHeader;
        console.warn(`🛠️ Dev Auth Bypass active for: ${userEmail}`);
      } else {
        console.error('🛡️ Security: Attempted dev bypass in production environment');
        return res.status(503).json({ 
          success: false, 
          message: 'Authentication service is unavailable.' 
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
    if (!userEmail) {
      console.error('🛡️ Security Alert: Attempted business lookup with null email');
      return res.status(401).json({ 
        success: false, 
        message: 'Identity could not be verified. Please log in again.' 
      });
    }

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
        // Special case: if we're just checking 'me', return 200 with null data to keep console clean
        const isMeRoute = req.path === '/me' || req.originalUrl.endsWith('/me');
        return res.status(isMeRoute ? 200 : 404).json({
            success: isMeRoute,
            data: null,
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
    // 5. ATTACH TO REQUEST
    req.businessId = business.id;
    req.business = business;

    // 6. RLS HANDSHAKE: Set the session variable for Postgres Row-Level Security
    // This physically prevents data leaks at the database level even if code filters fail.
    await db.raw("SELECT set_config('app.current_business_id', ?, false)", [business.id]);

    console.log(`[AUTH] 🛡️ RLS Locked: [User: ${userEmail}] -> [Business: ${business.name} (${business.id})]`);
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};

/**
 * Admin-Only Authorization Middleware
 * Strictly checks for the 'admin' role in Firebase Custom Claims.
 */
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Only verify if Firebase is initialized
    if (!isFirebaseInitialized) {
      if (process.env.NODE_ENV === 'development') return next();
      return res.status(503).json({ success: false, message: 'Security service unavailable' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (decodedToken.role === 'admin') {
      console.log(`[AUTH] 🎖️ Admin access granted: ${decodedToken.email}`);
      req.user = decodedToken;
      next();
    } else {
      console.warn(`[AUTH] 🛑 Admin access DENIED: ${decodedToken.email}`);
      res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You do not have permission to perform this action.' 
      });
    }
  } catch (error) {
    console.error('Admin Auth Error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid or expired administrative session' });
  }
};

module.exports = {
  requireBusinessAuth,
  requireAdmin
};
