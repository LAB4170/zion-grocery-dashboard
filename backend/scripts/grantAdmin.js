const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { admin, isFirebaseInitialized } = require('../config/firebase');

async function grantAdmin(email) {
  if (!isFirebaseInitialized) {
    console.error('❌ Firebase Admin not initialized. Check your environment variables.');
    process.exit(1);
  }

  if (!email) {
    console.error('❌ Please provide an email address: node scripts/grantAdmin.js user@example.com');
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    
    console.log(`✅ SUCCESS: Admin privileges granted to ${email}`);
    console.log(`🔑 UID: ${user.uid}`);
    console.log('🔄 Please log out and log back in on the website for the changes to take effect.');
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ ERROR: No user found with email ${email}. Make sure the user has signed up first.`);
    } else {
      console.error('❌ ERROR:', error.message);
    }
    process.exit(1);
  }
}

const targetEmail = process.argv[2];
grantAdmin(targetEmail);
