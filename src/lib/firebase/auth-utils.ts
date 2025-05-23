/**
 * Authentication Utilities
 * 
 * This module provides utility functions for handling authentication in different contexts,
 * maintaining proper separation between client and server authentication mechanisms.
 */
import { cookies } from 'next/headers';
import { adminAuth } from '../firebase-admin';
import { redirect } from 'next/navigation';
import { DecodedIdToken } from 'firebase-admin/auth';

// Define types for better type safety
type ServerSideUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  customClaims: Record<string, any>;
  providers: string[];
  creationTime?: string;
  lastSignInTime?: string;
};

/**
 * Verifies a session cookie and returns the user information
 * 
 * @param cookieValue The session cookie value to verify
 * @returns The user information or null if verification fails
 */
async function verifySessionCookie(cookieValue: string): Promise<ServerSideUser | null> {
  try {
    console.log('[ServerAuth] Verifying session cookie');
    // Verify the session cookie with checkRevoked=true to ensure it's still valid
    const decodedClaims = await adminAuth.verifySessionCookie(cookieValue, true);
    console.log('[ServerAuth] Session cookie verified for user:', decodedClaims.uid);
    
    // Get the user record for additional information
    const userRecord = await adminAuth.getUser(decodedClaims.uid);
    console.log('[ServerAuth] User record retrieved from Firebase Admin');
    
    // Create a user object with the necessary information
    const user: ServerSideUser = {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      customClaims: decodedClaims.customClaims || {},
      providers: userRecord.providerData.map((provider: { providerId: string }) => provider.providerId),
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime
    };
    
    console.log('[ServerAuth] Server-side user object created successfully');
    return user;
  } catch (error) {
    console.error('[ServerAuth] Error verifying session cookie:', error);
    if (error instanceof Error) {
      console.error('[ServerAuth] Error details:', error.message);
    }
    return null;
  }
}

/**
 * Get the authenticated user from the session cookie on the server side
 * This should only be used in Server Components or API Routes
 * 
 * @returns The authenticated user or null if not authenticated
 */
export async function getServerSideUser(): Promise<ServerSideUser | null> {
  try {
    // Get the cookie store - in Next.js App Router, cookies() might return a Promise
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session');
    
    if (!sessionCookie || !sessionCookie.value) {
      console.log('[ServerAuth] No session cookie found');
      return null;
    }
    
    // Verify the session cookie and get user info
    return await verifySessionCookie(sessionCookie.value);
  } catch (error) {
    console.error('[ServerAuth] Unexpected error in getServerSideUser:', error);
    if (error instanceof Error) {
      console.error('[ServerAuth] Error details:', error.message);
    }
    return null;
  }
}

/**
 * Server-side middleware to protect routes that require authentication
 * This should only be used in Server Components or API Routes
 * 
 * @param redirectTo The path to redirect to if not authenticated
 * @returns The authenticated user object
 */
export async function requireServerAuth(redirectTo = '/login'): Promise<ServerSideUser> {
  console.log('[ServerAuth] Checking authentication for protected route');
  const user = await getServerSideUser();
  
  if (!user) {
    console.log('[ServerAuth] No authenticated user found, redirecting to:', redirectTo);
    redirect(redirectTo);
  }
  
  console.log('[ServerAuth] User authenticated for protected route:', user.uid);
  return user;
}

/**
 * Check if a user has the required roles
 * This can be used on both client and server side
 * 
 * @param user The user object with optional customClaims
 * @param requiredRoles The roles required for access
 * @returns True if the user has at least one of the required roles
 */
export function hasRequiredRoles(
  user: { customClaims?: { roles?: string[] } } | null, 
  requiredRoles: string[]
): boolean {
  if (!user) {
    console.log('[Auth] Role check failed: No user provided');
    return false;
  }
  
  if (!user.customClaims) {
    console.log('[Auth] Role check failed: No custom claims on user');
    return false;
  }
  
  const roles = user.customClaims.roles;
  if (!roles || !Array.isArray(roles)) {
    console.log('[Auth] Role check failed: No roles array in custom claims');
    return false;
  }
  
  const hasRole = requiredRoles.some(role => roles.includes(role));
  console.log('[Auth] Role check result:', hasRole, 'Required:', requiredRoles, 'User has:', roles);
  return hasRole;
}
