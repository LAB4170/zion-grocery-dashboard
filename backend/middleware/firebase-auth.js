const { admin, isFirebaseInitialized } = require('../config/firebase');
const { db } = require('../config/database');

const verifyToken = async (req, res, next) => {
  if (!isFirebaseInitialized) {
    console.warn('API Request rejected: Firebase Admin not initialized.');
    return res.status(500).json({ success: false, message: 'Auth service misconfigured on backend. Please configure Firebase credentials.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No or invalid token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    // Check if user exists in DB, or auto-create basic record
    // We assume the users table exists from migration 1002
    const dbUser = await db('users').where({ firebase_uid: decodedToken.uid }).first();
    
    if (!dbUser) {
      // Auto-provision user on first login
      const newUserRecord = {
        firebase_uid: decodedToken.uid,
        email: decodedToken.email || '',
        display_name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Unknown'),
        role: 'user', // Default role
        is_active: true
      };
      
      const [newUser] = await db('users').insert(newUserRecord).returning('*');
      req.dbUser = newUser;
    } else {
      if (!dbUser.is_active) {
         return res.status(403).json({ success: false, message: 'Account is disabled.' });
      }
      req.dbUser = dbUser;
    }
    
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token.' });
  }
};

module.exports = { verifyToken };
