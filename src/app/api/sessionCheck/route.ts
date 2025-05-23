/**
 * API Route: /api/sessionCheck
 * 
 * This route verifies the session cookie and returns the user's authentication status.
 * It provides detailed information about the session, including any custom claims
 * and basic user information, without exposing sensitive data.
 * 
 * As specified in the FinalAuthImplementation.md document (Refactor Phase).
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session');
    
    if (!sessionCookie?.value) {
      console.log('[SessionCheck] No session cookie found');
      return NextResponse.json(
        { 
          authenticated: false,
          reason: 'no_cookie'
        },
        { status: 200 }
      );
    }
    
    try {
      // Verify the session cookie with checkRevoked=true to ensure it's still valid
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true);
      
      // Get the user record for additional information
      const userRecord = await adminAuth.getUser(decodedClaims.uid);
      
      console.log('[SessionCheck] Valid session for user:', decodedClaims.uid);
      
      return NextResponse.json(
        { 
          authenticated: true,
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          // Include custom claims if any
          customClaims: decodedClaims.customClaims || {},
          // Include provider data
          providers: userRecord.providerData.map((provider: { providerId: string }) => provider.providerId),
          // Include creation and last sign in time
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('[SessionCheck] Error verifying session cookie:', error);
      
      // Determine the specific error type for better client handling
      let reason = 'invalid_session';
      if (error instanceof Error) {
        if (error.message.includes('revoked')) {
          reason = 'session_revoked';
        } else if (error.message.includes('expired')) {
          reason = 'session_expired';
        }
        console.error('[SessionCheck] Error details:', error.message);
      }
      
      return NextResponse.json(
        { 
          authenticated: false, 
          reason
        },
        { status: 200 } // Still return 200 to avoid leaking info
      );
    }
  } catch (error) {
    console.error('[SessionCheck] Unexpected error:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        reason: 'server_error'
      },
      { status: 500 }
    );
  }
}
