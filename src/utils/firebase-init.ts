import { initFirebase, getFirebaseFirestore } from 'bndy-ui';

// Track initialization state
let isInitialized = false;

/**
 * Ensures Firebase is initialized before performing Firestore operations
 * This is a utility function to avoid multiple initialization attempts
 * @returns The Firestore instance
 */
export const ensureFirebaseInitialized = () => {
  // If already initialized, just return the Firestore instance
  if (isInitialized) {
    return getFirebaseFirestore();
  }
  
  try {
    // Initialize Firebase with environment variables
    initFirebase({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    });
    
    // Verify initialization by getting Firestore instance
    const db = getFirebaseFirestore();
    
    if (!db) {
      throw new Error('Failed to get Firestore instance after initialization');
    }
    
    console.log('✅ Firebase initialized successfully');
    isInitialized = true;
    return db;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    throw error; // Re-throw to allow caller to handle
  }
};
