import { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDY-zEP_8HDewz9QcIo2y7Ck1fDpSBJ54I",
  authDomain: "eobordtech-pos.firebaseapp.com",
  projectId: "eobordtech-pos",
  storageBucket: "eobordtech-pos.firebasestorage.app",
  messagingSenderId: "821131892978",
  appId: "1:821131892978:web:fb0a5228e05f40ab0c986b",
  measurementId: "G-XBZ76KWR0E"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Automatically sync Firebase user state to React State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signupWithEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    loginWithGoogle: () => signInWithPopup(auth, googleProvider),
    logout: () => signOut(auth),
    auth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
