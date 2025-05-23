/**
 * User Claims Management
 * 
 * This module provides functions for managing custom claims in Firebase Auth tokens.
 * These claims are used for lightweight role information that can be accessed
 * without querying Firestore.
 */
import { adminAuth } from '../firebase-admin';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

/**
 * Synchronizes a user's roles from Firestore to their ID token custom claims
 * 
 * @param uid The user's UID
 * @returns A promise that resolves when the claims have been updated
 */
export async function syncUserRolesToClaims(uid: string): Promise<void> {
  try {
    console.log('[UserClaims] Syncing user roles to claims for user:', uid);
    
    // Get the user's roles from Firestore
    const firestore = getFirestore();
    const userRef = doc(firestore, 'bndy_users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('[UserClaims] User document not found in Firestore:', uid);
      return;
    }
    
    const userData = userDoc.data();
    const roles = userData.roles || ['user'];
    
    console.log('[UserClaims] Retrieved roles from Firestore:', roles);
    
    // Get the current custom claims
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};
    
    // Update the custom claims with the roles
    const newClaims = {
      ...currentClaims,
      roles,
      // Add a timestamp to force token refresh
      updated_at: new Date().getTime()
    };
    
    // Set the custom claims
    await adminAuth.setCustomUserClaims(uid, newClaims);
    
    console.log('[UserClaims] Custom claims updated successfully for user:', uid);
    console.log('[UserClaims] New claims:', JSON.stringify(newClaims));
    
    // Note: The user will need to get a new token for these claims to take effect
    // This typically happens on auth state change or when getIdToken(true) is called
  } catch (error) {
    console.error('[UserClaims] Error syncing user roles to claims:', error);
    if (error instanceof Error) {
      console.error('[UserClaims] Error details:', error.message);
    }
    throw error;
  }
}

/**
 * Adds a role to a user's custom claims
 * 
 * @param uid The user's UID
 * @param role The role to add
 * @returns A promise that resolves when the claims have been updated
 */
export async function addRoleToClaims(uid: string, role: string): Promise<void> {
  try {
    console.log(`[UserClaims] Adding role "${role}" to user:`, uid);
    
    // Get the current custom claims
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};
    const currentRoles = currentClaims.roles || [];
    
    // Check if the user already has this role
    if (Array.isArray(currentRoles) && currentRoles.includes(role)) {
      console.log(`[UserClaims] User already has role "${role}"`);
      return;
    }
    
    // Add the role to the claims
    const newRoles = Array.isArray(currentRoles) 
      ? [...currentRoles, role] 
      : [role];
    
    const newClaims = {
      ...currentClaims,
      roles: newRoles,
      updated_at: new Date().getTime()
    };
    
    // Set the custom claims
    await adminAuth.setCustomUserClaims(uid, newClaims);
    
    console.log(`[UserClaims] Role "${role}" added successfully to user:`, uid);
    console.log('[UserClaims] New claims:', JSON.stringify(newClaims));
  } catch (error) {
    console.error(`[UserClaims] Error adding role "${role}" to user:`, error);
    if (error instanceof Error) {
      console.error('[UserClaims] Error details:', error.message);
    }
    throw error;
  }
}

/**
 * Removes a role from a user's custom claims
 * 
 * @param uid The user's UID
 * @param role The role to remove
 * @returns A promise that resolves when the claims have been updated
 */
export async function removeRoleFromClaims(uid: string, role: string): Promise<void> {
  try {
    console.log(`[UserClaims] Removing role "${role}" from user:`, uid);
    
    // Get the current custom claims
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};
    const currentRoles = currentClaims.roles || [];
    
    // Check if the user has this role
    if (!Array.isArray(currentRoles) || !currentRoles.includes(role)) {
      console.log(`[UserClaims] User does not have role "${role}"`);
      return;
    }
    
    // Remove the role from the claims
    const newRoles = currentRoles.filter(r => r !== role);
    
    const newClaims = {
      ...currentClaims,
      roles: newRoles,
      updated_at: new Date().getTime()
    };
    
    // Set the custom claims
    await adminAuth.setCustomUserClaims(uid, newClaims);
    
    console.log(`[UserClaims] Role "${role}" removed successfully from user:`, uid);
    console.log('[UserClaims] New claims:', JSON.stringify(newClaims));
  } catch (error) {
    console.error(`[UserClaims] Error removing role "${role}" from user:`, error);
    if (error instanceof Error) {
      console.error('[UserClaims] Error details:', error.message);
    }
    throw error;
  }
}
