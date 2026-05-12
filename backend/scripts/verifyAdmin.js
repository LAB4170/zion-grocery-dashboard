const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { admin, isFirebaseInitialized } = require('../config/firebase');

async function verifyAdmin(email) {
  if (!isFirebaseInitialized) {
    console.error('❌ Firebase Admin not initialized.');
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log('--- 🛡️ Admin Verification Report ---');
    console.log(`👤 Email: ${user.email}`);
    console.log(`🔑 UID:   ${user.uid}`);
    console.log(`📜 Claims: ${JSON.stringify(user.customClaims || {})}`);
    
    if (user.customClaims && user.customClaims.role === 'admin') {
      console.log('✅ VERIFIED: This account is a VALID ADMINISTRATOR.');
    } else {
      console.log('❌ FAILED: This account is a standard user (missing admin role).');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fetching user:', err.message);
    process.exit(1);
  }
}

verifyAdmin('eobordtech@gmail.com');
