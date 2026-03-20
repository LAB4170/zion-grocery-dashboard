const admin = require('firebase-admin');

// We use environment variables for the service account
// Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
let isFirebaseInitialized = false;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines from env var
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin initialized securely.');
  } else {
    console.warn('⚠️ Firebase Admin NOT initialized. Missing env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). API will reject secured routes.');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
}

module.exports = { admin, isFirebaseInitialized };
