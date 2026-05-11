/**
 * Set Firebase Admin Custom Claims
 * 
 * Usage: node backend/scripts/setAdminClaim.js <firebase-uid>
 * 
 * You can find a user's Firebase UID in the Firebase Console → Authentication → Users
 * 
 * This grants `role: 'admin'` to the specified user, enabling them to authenticate
 * with the Nexus POS Admin Command Center using their Firebase token instead of a static secret key.
 * 
 * Example:
 *   node backend/scripts/setAdminClaim.js abc123uid456
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { admin, isFirebaseInitialized } = require('../config/firebase');

const identifier = process.argv[2];
const isRevoke = process.argv.includes('--revoke');

if (!identifier) {
  console.error('❌ Usage: node setAdminClaim.js <uid|email> [--revoke]');
  process.exit(1);
}

async function run() {
  if (!isFirebaseInitialized) {
    console.error('❌ Firebase Admin not initialized.');
    process.exit(1);
  }

  try {
    let user;
    if (identifier.includes('@')) {
      user = await admin.auth().getUserByEmail(identifier);
    } else {
      user = await admin.auth().getUser(identifier);
    }

    console.log(`\n👤 User: ${user.email} (${user.uid})`);

    const claims = isRevoke ? { role: null } : { role: 'admin' };
    await admin.auth().setCustomUserClaims(user.uid, claims);

    console.log(`✅ Admin claim ${isRevoke ? 'REVOKED' : 'SET'} for: ${user.email}`);
    console.log('\n⚠️ IMPORTANT: The user MUST sign out and sign back in to refresh their token.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
