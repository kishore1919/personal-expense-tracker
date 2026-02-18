/**
 * Firebase configuration and initialization for the Personal Expense Tracker.
 * 
 * This module initializes Firebase services including Authentication and Firestore.
 * Configuration values are loaded from environment variables for security.
 * 
 * @module firebase
 * @requires firebase/app - Firebase app initialization
 * @requires firebase/auth - Firebase Authentication
 * @requires firebase/firestore - Firebase Firestore database
 * 
 * @example
 * // Import configured Firebase services
 * import { auth, db, googleProvider } from '@/app/firebase';
 * 
 * // Use in authentication
 * signInWithPopup(auth, googleProvider);
 * 
 * // Use in Firestore operations
 * const snapshot = await getDocs(collection(db, 'books'));
 */

// Firebase core imports
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

/**
 * Firebase configuration object.
 * Loads sensitive configuration from environment variables.
 * These must be set in your Firebase project console and .env file.
 * 
 * @constant {Object} firebaseConfig
 * @property {string} apiKey - Firebase API key
 * @property {string} authDomain - Firebase auth domain
 * @property {string} projectId - Firebase project ID
 * @property {string} storageBucket - Firebase storage bucket
 * @property {string} messagingSenderId - Firebase messaging sender ID
 * @property {string} appId - Firebase app ID
 * @property {string} [measurementId] - Firebase measurement ID (optional)
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase application.
 * This creates a Firebase app instance with the provided configuration.
 * 
 * @constant {Object} app - Initialized Firebase app instance
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication instance.
 * Provides methods for user authentication including Google Sign-In.
 * 
 * @constant {Object} auth - Firebase Auth instance
 */
const auth = getAuth(app);

/**
 * Firebase Firestore database instance.
 * Provides methods for reading and writing data to the database.
 * 
 * @constant {Object} db - Firestore database instance
 */
const db = getFirestore(app);

/**
 * Google Auth Provider for OAuth authentication.
 * Used with signInWithPopup() for Google Sign-In.
 * 
 * @constant {Object} googleProvider - Google Auth Provider instance
 */
const googleProvider = new GoogleAuthProvider();

/**
 * Connect to Firebase Emulators for testing.
 * This is only enabled when NEXT_PUBLIC_FIREBASE_EMULATOR is set to 'true'.
 * The emulators provide an isolated testing environment without affecting production data.
 */
if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true') {
  // Connect to Auth Emulator
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  
  // Connect to Firestore Emulator
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  
  console.log('🔧 Connected to Firebase Emulators');
}

// Export configured Firebase services for use throughout the app
export { auth, db, googleProvider };
