/**
 * API Route: /api/sessionLogin
 * 
 * This route accepts a Firebase ID token and converts it to a session cookie
 * using the Firebase Admin SDK. The session cookie is then set in the response
 * with the appropriate attributes for cross-domain SSO.
 * 
 * As specified in the FinalAuthImplementation.md document (Phase 2).
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

// Import configuration from bndy-ui
import { isDevelopment, SESSION_DURATION_SECONDS, COOKIE_DOMAIN } from '@/../../bndy-ui/auth/config';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the ID token
    const { idToken } = await request.json();
    
    if (!idToken) {
      console.error('[SessionLogin] No ID token received');
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }
    
    // Log the token length for debugging
    console.log('[SessionLogin] Received ID token of length', idToken.length);

    try {
      console.log('[SessionLogin] Attempting to verify ID token...');
      
      // Verify the ID token with checkRevoked=false to prevent issues with token rotation
      const decodedIdToken = await adminAuth.verifyIdToken(idToken, false);
      
      console.log('[SessionLogin] Token verified successfully, auth_time:', new Date(decodedIdToken.auth_time * 1000).toISOString());
      console.log('[SessionLogin] Token user:', decodedIdToken.uid, decodedIdToken.email);
      
      // Check if the token is too old (more than 60 minutes for SSO purposes)
      // This is more lenient than the default 5 minutes to support cross-domain SSO
      const tokenAge = new Date().getTime() / 1000 - decodedIdToken.auth_time;
      console.log('[SessionLogin] Token age in seconds:', tokenAge);
      
      // For cross-domain SSO, we're more lenient with token age
      // Only reject if token is older than 60 minutes
      if (tokenAge > 60 * 60) {
        console.log('[SessionLogin] Token too old (> 60 minutes), rejecting');
        return NextResponse.json(
          { error: 'Recent sign-in required. Please sign in again.' },
          { status: 401 }
        );
      }
      
      console.log('[SessionLogin] Token age acceptable for SSO');
      
      console.log('[SessionLogin] Token age check passed');

      // Create a session cookie
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_DURATION_SECONDS * 1000 // milliseconds
      });

      // Create a response object
      const response = NextResponse.json(
        { success: true },
        { status: 200 }
      );
      
      // Set secure cookie attributes for cross-domain SSO with enhanced settings
      // IMPORTANT: For cross-domain cookies to work properly, we need:
      // 1. SameSite=None with Secure=true
      // 2. A properly trusted HTTPS certificate
      // 3. Consistent domain settings
      const cookieOptions = {
        httpOnly: true,
        secure: true, // Required for SameSite=None
        sameSite: 'none' as 'none', // Required for cross-domain sharing
        path: '/',
        domain: COOKIE_DOMAIN, // Use the centralized configuration
        maxAge: SESSION_DURATION_SECONDS,
      };
      
      // Enhanced logging for cookie settings
      console.log('[SessionLogin] Setting cookie with domain:', cookieOptions.domain);
      console.log('[SessionLogin] Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
      console.log('[SessionLogin] Final cookie options:', JSON.stringify(cookieOptions));
      
      // Ensure the cookie domain is properly set
      console.log('[SessionLogin] COOKIE_DOMAIN from config:', COOKIE_DOMAIN);
      
      // Set the cookie
      response.cookies.set('__session', sessionCookie, cookieOptions);

      // Log all cookies for debugging
      const allCookies = response.cookies.getAll();
      console.log('[SessionLogin] Response cookies:', allCookies.map(c => c.name));
      
      // Detailed cookie inspection
      const sessionCookieObj = allCookies.find(c => c.name === '__session');
      console.log('[SessionLogin] __session cookie details:', {
        name: sessionCookieObj?.name,
        value: sessionCookieObj?.value ? `${sessionCookieObj.value.substring(0, 10)}...` : 'none',
        // Next.js ResponseCookie doesn't expose options directly, so we log what we know
        domain: cookieOptions.domain,
        path: cookieOptions.path,
        sameSite: cookieOptions.sameSite,
        secure: cookieOptions.secure,
        httpOnly: cookieOptions.httpOnly,
        maxAge: cookieOptions.maxAge
      });
      
      // Add headers to verify the cookie is being set
      response.headers.set('X-Debug-Cookie-Set', 'true');
      response.headers.set('X-Debug-Cookie-Domain', cookieOptions.domain);
      response.headers.set('X-Debug-Cookie-SameSite', cookieOptions.sameSite);
      response.headers.set('X-Debug-Cookie-Secure', cookieOptions.secure.toString());
      
      // Add a header with the current timestamp for cache busting
      response.headers.set('X-Debug-Timestamp', Date.now().toString());

      // Return the response with the session cookie
      return response;
    } catch (error) {
      console.error('[SessionLogin] Error verifying token or creating session cookie:', error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('[SessionLogin] Error name:', error.name);
        console.error('[SessionLogin] Error message:', error.message);
        console.error('[SessionLogin] Error stack:', error.stack);
        
        // Provide specific error messages based on the error type
        if (error.message.includes('Firebase ID token has expired')) {
          return NextResponse.json(
            { error: 'ID token has expired. Please sign in again.', code: 'token_expired' },
            { status: 401 }
          );
        } else if (error.message.includes('Firebase ID token has been revoked')) {
          return NextResponse.json(
            { error: 'Your session has been revoked. Please sign in again.', code: 'token_revoked' },
            { status: 401 }
          );
        } else if (error.message.includes('Firebase ID token has invalid signature')) {
          return NextResponse.json(
            { error: 'Invalid authentication. Please sign in again.', code: 'token_invalid' },
            { status: 401 }
          );
        }
      }
      
      // Generic error for other cases
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.', code: 'auth_error' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[SessionLogin] Unexpected server error:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[SessionLogin] Error name:', error.name);
      console.error('[SessionLogin] Error message:', error.message);
      console.error('[SessionLogin] Error stack:', error.stack);
    }
    
    // Return a generic error message to avoid leaking implementation details
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again later.', 
        code: 'server_error' 
      },
      { status: 500 }
    );
  }
}

// For development/testing purposes, allow GET requests to return session status
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session');
  
  if (!sessionCookie?.value) {
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
  
  try {
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true);
    return NextResponse.json(
      { 
        authenticated: true,
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        // Include basic user info but not sensitive data
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Invalid session' },
      { status: 200 } // Still return 200 to avoid leaking info
    );
  }
}
