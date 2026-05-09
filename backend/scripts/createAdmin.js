const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { admin, isFirebaseInitialized } = require('../config/firebase');

async function createAdmin() {
  if (!isFirebaseInitialized) {
    console.error('Firebase Admin not initialized.');
    process.exit(1);
  }

  const email = 'eobordtech@gmail.com';
  const password = 'Ny@mw3y@7$$';

  try {
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`User already exists: ${user.uid}`);
      // Update password just in case
      await admin.auth().updateUser(user.uid, { password });
      console.log('Password updated');
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        user = await admin.auth().createUser({
          email,
          password,
          emailVerified: true
        });
        console.log(`User created: ${user.uid}`);
      } else {
        throw e;
      }
    }

    // Set admin claim
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    console.log(`Admin claim set for ${email} (${user.uid})`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
