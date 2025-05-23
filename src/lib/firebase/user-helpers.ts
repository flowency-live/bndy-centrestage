/**
 * User Management Helpers for Firebase
 * 
 * This module provides functions for managing user records in Firestore
 * and synchronizing user roles with custom claims.
 */
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore, firestore } from 'bndy-ui';
import { COLLECTIONS } from './collections';

// Import the claims functionality if we're in a server context
let syncUserRolesToClaims: ((uid: string) => Promise<void>) | null = null;

// Dynamically import the claims functionality if needed
const loadClaimsModule = async () => {
  try {
    if (typeof window === 'undefined') {
      // We're in a server context, so we can import the claims module
      const claimsModule = await import('./user-claims');
      syncUserRolesToClaims = claimsModule.syncUserRolesToClaims;
      console.log('[User Helpers] Claims module loaded successfully');
    }
  } catch (error) {
    console.error('[User Helpers] Error loading claims module:', error);
  }
};

// Load the claims module
loadClaimsModule();

/**
 * Creates or updates a user in Firestore
 * This is a simplified function to be called directly after signup or OAuth login
 * 
 * @param userData Basic user data to store
 * @returns Promise that resolves when the user is added to Firestore
 */
export const createOrUpdateUser = async (userData: {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<void> => {
  console.log('[user-helpers] createOrUpdateUser called for UID:', userData?.uid);
  
  if (!userData || !userData.uid) {
    console.error('[User Helpers] Cannot create/update user: Invalid user data');
    return;
  }

  try {
    // Get the Firestore instance
    const db = firestore || getFirebaseFirestore();
    
    if (!db) {
      throw new Error('[user-helpers] Firestore DB is undefined');
    }
    
    const userRef = doc(db, COLLECTIONS.USERS, userData.uid);
    
    // Check if the user already exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user
      await setDoc(userRef, {
        ...userData,
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
      console.log(`[User Helpers] Updated user ${userData.uid} in Firestore`);
    } else {
      // Create new user with basic role
      await setDoc(userRef, {
        ...userData,
        roles: ['user'],
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      console.log(`[User Helpers] Created new user ${userData.uid} in Firestore`);
    }
    
    // After creating/updating the user in Firestore, sync the roles to custom claims
    // This will only work in a server context
    if (syncUserRolesToClaims) {
      try {
        console.log(`[User Helpers] Syncing roles to claims for user ${userData.uid}`);
        await syncUserRolesToClaims(userData.uid);
        console.log(`[User Helpers] Successfully synced roles to claims for user ${userData.uid}`);
      } catch (claimsError) {
        console.error('[User Helpers] Error syncing roles to claims:', claimsError);
        // Don't throw to prevent disrupting auth flow
      }
    } else {
      console.log(`[User Helpers] Claims sync not available in client context for user ${userData.uid}`);
    }
  } catch (error) {
    console.error('[User Helpers] Error creating/updating user in Firestore:', error);
    if (error instanceof Error) {
      console.error('[User Helpers] Error details:', error.message);
    }
    // Log error but don't throw to prevent disrupting auth flow
  }
};
