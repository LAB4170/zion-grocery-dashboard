const admin = require('firebase-admin');

// We use environment variables for the service account
// Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
let isFirebaseInitialized = false;

try {
  const hasRequiredVars = process.env.FIREBASE_PROJECT_ID && 
                          process.env.FIREBASE_CLIENT_EMAIL && 
                          process.env.FIREBASE_PRIVATE_KEY;
  
  const isPlaceholder = process.env.FIREBASE_PRIVATE_KEY === 'YOUR_PRIVATE_KEY';

  if (hasRequiredVars && !isPlaceholder) {
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
    const reason = isPlaceholder ? 'Private key is still a placeholder.' : 'Missing env vars.';
    console.warn(`⚠️ Firebase Admin NOT initialized: ${reason} (API will use lenient header-based auth for dev).`);
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
}

module.exports = { admin, isFirebaseInitialized };
