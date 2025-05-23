/**
 * User Management Utilities for Firebase
 * 
 * This module provides utility functions for managing users in Firebase,
 * including adding new users to Firestore with appropriate roles based on source application.
 */
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseFirestore, firestore } from 'bndy-ui';
import { COLLECTIONS } from './collections';
import { UserRole } from 'bndy-types';

/**
 * Source application type for role assignment
 */
export type SourceApp = 'backstage' | 'centrestage' | 'frontstage';

/**
 * Determines the appropriate roles for a user based on the source application
 * 
 * @param sourceApp The application where the user is signing up
 * @returns Array of user roles
 */
export const getRolesForSourceApp = (sourceApp: SourceApp): UserRole[] => {
  const baseRoles: UserRole[] = ['user'];
  
  switch (sourceApp) {
    case 'backstage':
      // For backstage, users are typically artists or studios
      return [...baseRoles, 'bndy_artist', 'bndy_studio'];
    case 'frontstage':
      // For frontstage, users are typically giggoers
      return [...baseRoles, 'live_giggoer'];
    case 'centrestage':
    default:
      // For centrestage or unknown sources, just use the base user role
      return baseRoles;
  }
};

/**
 * Adds a new user to Firestore with appropriate roles based on source application
 * This function should be called when a new user signs up
 * 
 * @param user Firebase Auth User object
 * @param sourceApp The application where the user is signing up
 * @returns Promise that resolves when the user is added to Firestore
 */
export const addUserToFirestore = async (user: User, sourceApp?: SourceApp): Promise<void> => {
  console.log('[user-management] addUserToFirestore called for UID:', user?.uid);
  console.log('[user-management] Attempting to create user doc for:', user?.uid);
  
  if (!user || !user.uid) {
    console.error('[User Management] Cannot add user to Firestore: Invalid user object');
    return;
  }

  try {
    // Get the Firestore instance from bndy-ui
    // This ensures we're using the same instance throughout the application
    let db = firestore;
    console.log('[user-management] Firestore DB in addUserToFirestore:', db ? 'Available' : 'Undefined');
    console.log('[user-management] Is Firestore valid:', typeof db === 'object');
    
    if (!db) {
      console.error('[User Management] Firestore is not available, falling back to getFirebaseFirestore()');
      // Try to get Firestore using the getter function as a fallback
      db = getFirebaseFirestore();
      console.log('[user-management] Fallback Firestore DB:', db ? 'Available' : 'Undefined');
      console.log('[user-management] Is fallback Firestore valid:', typeof db === 'object');
      
      if (!db) {
        console.error('[user-management] FIRESTORE DB IS UNDEFINED AFTER FALLBACK');
        throw new Error('[user-management] Firestore DB is undefined');
      }
    }
    
    // Hard verification check for Firestore instance
    if (!db) {
      throw new Error('[user-management] Firestore DB is undefined');
    }
    
    if (typeof db !== 'object') {
      throw new Error('[user-management] Firestore DB is not a valid Firestore instance');
    }
    
    console.log('[user-management] DB validated:', db);
    
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    
    // Check if the user already exists in Firestore
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`[User Management] User ${user.uid} already exists in Firestore`);
      return;
    }
    
    // Determine roles based on source application
    const roles = sourceApp ? getRolesForSourceApp(sourceApp) : ['user'];
    
    // Create the user document with appropriate roles
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified || false,
      isAnonymous: user.isAnonymous || false,
      roles,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    
    await setDoc(userRef, userData);
    console.log(`[User Management] Added user ${user.uid} to Firestore with roles: ${roles.join(', ')}`);
    console.log('[user-management] User document successfully written to Firestore:', user.uid);
  } catch (error) {
    console.error('[User Management] Error adding user to Firestore:', error);
    throw error;
  }
};

/**
 * Updates the user's last login timestamp in Firestore
 * This function should be called when a user signs in
 * 
 * @param user Firebase Auth User object
 * @param sourceApp The application where the user is signing in
 * @returns Promise that resolves when the user's last login is updated
 */
export const updateUserLastLogin = async (user: User, sourceApp?: SourceApp): Promise<void> => {
  console.log('[user-management] updateUserLastLogin called for UID:', user?.uid);
  
  if (!user || !user.uid) {
    console.error('[User Management] Cannot update last login: Invalid user object');
    return;
  }

  try {
    // Get the Firestore instance from bndy-ui
    // This ensures we're using the same instance throughout the application
    let db = firestore;
    console.log('[user-management] Firestore DB in updateUserLastLogin:', db ? 'Available' : 'Undefined');
    console.log('[user-management] Is Firestore valid:', typeof db === 'object');
    
    if (!db) {
      console.error('[User Management] Firestore is not available, falling back to getFirebaseFirestore()');
      // Try to get Firestore using the getter function as a fallback
      db = getFirebaseFirestore();
      console.log('[user-management] Fallback Firestore DB:', db ? 'Available' : 'Undefined');
      console.log('[user-management] Is fallback Firestore valid:', typeof db === 'object');
      
      if (!db) {
        console.error('[user-management] FIRESTORE DB IS UNDEFINED AFTER FALLBACK');
        throw new Error('[user-management] Firestore DB is undefined');
      }
    }
    
    // Hard verification check for Firestore instance
    if (!db) {
      throw new Error('[user-management] Firestore DB is undefined');
    }
    
    if (typeof db !== 'object') {
      throw new Error('[user-management] Firestore DB is not a valid Firestore instance');
    }
    
    console.log('[user-management] DB validated:', db);
    
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    
    // Check if the user exists in Firestore
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // If the user doesn't exist, add them to Firestore with appropriate roles
      return addUserToFirestore(user, sourceApp);
    }
    
    // Update the last login timestamp
    await setDoc(userRef, {
      lastLoginAt: new Date().toISOString(),
      // Update emailVerified status if it has changed
      emailVerified: user.emailVerified
    }, { merge: true });
    
    console.log(`[User Management] Updated last login for user ${user.uid}`);
  } catch (error) {
    console.error('[User Management] Error updating user last login:', error);
    // Don't throw the error here to prevent disrupting the authentication flow
  }
};
