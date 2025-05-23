/**
 * Authentication Integration Hook
 * 
 * This hook connects the authentication flow with the user management functionality
 * to ensure users are added to the bndy_users collection with appropriate roles.
 */
import { useEffect, useState } from 'react';
import { useAuth } from 'bndy-ui';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

import { addUserToFirestore, updateUserLastLogin, SourceApp, getRolesForSourceApp } from '../lib/firebase/user-management';
import { COLLECTIONS } from '../lib/firebase/collections';

interface UseAuthIntegrationOptions {
  sourceApp: SourceApp;
  onUserAdded?: () => void;
}

/**
 * Hook to integrate authentication with user management
 * This ensures users are added to the bndy_users collection after authentication
 * 
 * @param options Configuration options
 * @returns The current user from the auth context
 */
export const useAuthIntegration = ({ sourceApp, onUserAdded }: UseAuthIntegrationOptions) => {
  console.log('[useAuthIntegration] Hook loaded');
  const { currentUser, isLoading } = useAuth();
  
  // State to track if the user has been added to Firestore
  const [userAdded, setUserAdded] = useState(false);

  // Effect to add user to Firestore when authenticated
  useEffect(() => {
    const handleUserAuthentication = async (): Promise<void> => {
      if (currentUser && !isLoading && !userAdded) {
        setUserAdded(false); // Defensive: reset in case of re-auth
        let firestoreWriteError: string | null = null;
        try {
          console.log(`[Auth Integration] User authenticated: ${currentUser.uid} from ${sourceApp}`);
          console.log('[AuthIntegration] Hook triggered for user:', currentUser?.uid);
          
          // Log the current user for debugging
          console.log('[useAuthIntegration.ts] User object in integration:', {
            uid: currentUser.uid,
            email: currentUser.email,

          });
          
          // Get the Firestore instance from bndy-ui
          // This ensures we're using the same instance throughout the application
          const db = getFirestore();
          console.log('[useAuthIntegration] Firestore DB instance:', db);

          // Attempt Firestore write to bndy_users for this user
          const userRef = doc(db, 'bndy_users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            // Create full user doc on first login
            const userDocData = {
              uid: currentUser.uid,
              email: currentUser.email,

              roles: ['user'],
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              emailVerified: currentUser.emailVerified
            };
            await setDoc(userRef, userDocData);
            console.log(`[Auth Integration] Created new user doc for ${currentUser.uid}`);
          } else {
            // Only update login metadata ONCE per session (not on every navigation)
            const sessionKey = `bndy_lastLoginAt_${currentUser.uid}`;
            if (!sessionStorage.getItem(sessionKey)) {
              await setDoc(userRef, {
                lastLoginAt: new Date().toISOString(),
                emailVerified: currentUser.emailVerified
              }, { merge: true });
              sessionStorage.setItem(sessionKey, 'true');
              console.log(`[Auth Integration] Updated last login for user ${currentUser.uid}`);
            } else {
              console.log(`[Auth Integration] Skipped last login update for user ${currentUser.uid} (already set this session)`);
            }
          }
        } catch (error: any) {
          const errorDetails = {
            code: error.code || 'unknown',
            message: error.message || 'Unknown error',
            stack: error.stack
          };
          console.error('[Auth Integration] Error handling user authentication:', errorDetails);
        }
      }
    };
    
    handleUserAuthentication();
  } , [currentUser, isLoading, sourceApp, onUserAdded, userAdded]);
  
  // If Firestore write failed, show error to user and block navigation

  // Only call onUserAdded if user was definitely added
  if (userAdded && typeof onUserAdded === 'function') {
    onUserAdded();
  }
  
  return { currentUser, isLoading };
};

/**
 * Utility function to add a user to Firestore with appropriate roles
 * This can be called directly when needed outside of the hook
 * 
 * @param user The Firebase user object
 * @param sourceApp The source application
 * @returns Promise that resolves when the user is added
 */
export const ensureUserInFirestore = async (user: User, sourceApp: SourceApp) => {
  if (!user) return;
  
  try {
    await addUserToFirestore(user, sourceApp);
  } catch (error) {
    console.error('[Auth Integration] Error ensuring user in Firestore:', error);
    throw error;
  }
};
