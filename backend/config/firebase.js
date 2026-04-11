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
    try {
      // Robust private key parsing
      const rawKey = process.env.FIREBASE_PRIVATE_KEY;
      const privateKey = rawKey.includes('\\n') 
        ? rawKey.replace(/\\n/g, '\n') 
        : rawKey.replace(/"/g, ''); // Handle potential double quoting

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey
        })
      });
      isFirebaseInitialized = true;
      console.log('✅ Firebase Admin initialized securely.');
    } catch (initError) {
      console.error('❌ Firebase Admin initialization error (Invalid key format?):', initError.message);
    }
  } else {
    const reason = isPlaceholder ? 'Private key is still a placeholder.' : 'Missing env vars.';
    console.warn(`⚠️ Firebase Admin NOT initialized: ${reason} (API will use lenient header-based auth for dev).`);
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
}

module.exports = { admin, isFirebaseInitialized };
