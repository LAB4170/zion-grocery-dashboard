/**
 * Firebase Admin Auth Middleware (Custom Claims)
 * 
 * This is the NEXT-GENERATION admin auth that uses Firebase Custom Claims
 * instead of a static secret key. It requires the request to include a valid
 * Firebase ID token (Bearer) whose decoded payload contains { role: 'admin' }.
 * 
 * Benefits over static x-admin-key:
 *  - Named audit trail: we know exactly WHO is accessing admin endpoints
 *  - Revocable: remove claim via setAdminClaim.js --revoke, no code deploy needed
 *  - Token expiry: Firebase tokens expire after 1 hour, limiting exposure
 *  - MFA compatible: works with Firebase's built-in MFA
 * 
 * ACTIVATION:
 *  1. Run: node backend/scripts/setAdminClaim.js <your-firebase-uid>
 *  2. Update server.js to use requireFirebaseAdminAuth instead of requireAdminAuth
 *     for /api/admin routes
 *  3. Update AdminDashboard.jsx to use Firebase Login instead of password field
 * 
 * COMPATIBILITY:
 *  The old requireAdminAuth (x-admin-key) remains active as a fallback during
 *  the transition period. Both middlewares can coexist.
 */
const { admin, isFirebaseInitialized } = require('../config/firebase');

const requireFirebaseAdminAuth = async (req, res, next) => {
  if (!isFirebaseInitialized) {
    return res.status(500).json({
      success: false,
      message: 'Firebase Admin not initialized. Cannot verify admin identity.'
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Admin access requires a Firebase Bearer token.',
      hint: 'Sign in with your admin Google account and pass the ID token.'
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check the custom claim
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your account does not have admin privileges.',
        hint: 'Contact the system administrator to grant admin access.'
      });
    }

    // Attach admin identity to request for audit logging
    req.adminUid = decodedToken.uid;
    req.adminEmail = decodedToken.email;
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { requireFirebaseAdminAuth };
