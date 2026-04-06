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

const uid = process.argv[2];

if (!uid) {
  console.error('❌ Usage: node setAdminClaim.js <firebase-uid>');
  console.error('   Find UIDs in Firebase Console → Authentication → Users');
  process.exit(1);
}

async function setAdminClaim() {
  if (!isFirebaseInitialized) {
    console.error('❌ Firebase Admin not initialized. Check your service account config.');
    process.exit(1);
  }

  try {
    // Verify user exists first
    const user = await admin.auth().getUser(uid);
    console.log(`\n👤 Found user: ${user.email} (${user.uid})`);

    // Set the admin claim
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    
    console.log(`✅ Admin claim set successfully for: ${user.email}`);
    console.log('\n📋 What to do next:');
    console.log('   1. The user must sign out and sign back in to refresh their token');
    console.log('   2. Their token will now include { role: "admin" }');
    console.log('   3. They can then authenticate via Firebase token in AdminDashboard');
    console.log('\n🔒 To revoke admin access later:');
    console.log(`   node setAdminClaim.js ${uid} --revoke`);

    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`❌ User not found with UID: ${uid}`);
      console.error('   Check the UID in Firebase Console → Authentication → Users');
    } else {
      console.error('❌ Failed to set admin claim:', err.message);
    }
    process.exit(1);
  }
}

// Handle revoke flag
if (process.argv[3] === '--revoke') {
  admin.auth().setCustomUserClaims(uid, { role: null })
    .then(() => { console.log(`✅ Admin claim REVOKED for UID: ${uid}`); process.exit(0); })
    .catch(err => { console.error('❌', err.message); process.exit(1); });
} else {
  setAdminClaim();
}
