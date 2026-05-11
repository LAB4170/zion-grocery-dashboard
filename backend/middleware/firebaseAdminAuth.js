/**
 * Firebase Admin Auth Middleware (Custom Claims)
 * 
 * This is the PRIMARY admin authentication method for the Nexus POS platform.
 * It requires the request to include a valid Firebase ID token (Bearer) 
 * whose decoded payload contains { role: 'admin' }.
 * 
 * SECURITY DESIGN:
 *  - No static keys: prevents broad compromise from single key leak.
 *  - Identity-linked: every admin action is linked to a specific Firebase UID/Email.
 *  - Time-bound: Firebase tokens expire after 1 hour.
 *  - Revocable: access can be revoked instantly by removing the 'admin' claim in Firebase.
 * 
 * ACTIVATION:
 *  - Admin claims are managed via the 'backend/scripts/setAdminClaim.js' utility.
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

    // DEBUG: Log claims to see why it's failing
    console.log(`🔐 Admin Auth Debug [${decodedToken.email}]:`, decodedToken.role);

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
