/**
 * API Route: /api/sessionLogout
 * 
 * This route clears the session cookie to log the user out.
 * It's designed to work with the cross-domain SSO setup by using
 * the same cookie attributes as the sessionLogin route.
 * 
 * As specified in the FinalAuthImplementation.md document (Phase 2).
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import configuration from bndy-ui
import { isDevelopment, COOKIE_DOMAIN } from '@/../../bndy-ui/auth/config';

export async function POST() {
  try {
    // Create a response object
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );
    
    // Set the cookie in the response with enhanced settings for cross-domain sharing
    // IMPORTANT: For cross-domain cookies to work properly, we need:
    // 1. SameSite=None with Secure=true
    // 2. A properly trusted HTTPS certificate
    // 3. Consistent domain settings
    const cookieOptions = {
      maxAge: 0, // Expire immediately
      httpOnly: true,
      secure: true, // Required for SameSite=None
      sameSite: 'none' as 'none', // Required for cross-domain sharing
      path: '/',
      domain: COOKIE_DOMAIN, // Use the centralized configuration
    };
    
    // Enhanced logging for cookie settings
    console.log('[SessionLogout] Using cookie domain:', cookieOptions.domain);
    console.log('[SessionLogout] Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
    console.log('[SessionLogout] Final cookie options:', JSON.stringify(cookieOptions));
    
    // Ensure the cookie domain is properly set
    console.log('[SessionLogout] COOKIE_DOMAIN from config:', COOKIE_DOMAIN);
    
    // Set the cookie
    response.cookies.set('__session', '', cookieOptions);
    
    // Return the response with the cleared cookie
    return response;
  } catch (error) {
    console.error('Session logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// For development/testing purposes, allow GET requests
export async function GET(request: NextRequest) {
  // Create a response object
  const response = NextResponse.json(
    { success: true },
    { status: 200 }
  );
  
  // Set the cookie in the response
  const cookieOptions = {
    maxAge: 0, // Expire immediately
    httpOnly: true,
    secure: true,
    sameSite: 'none' as 'none', // Type assertion to fix TypeScript error
    path: '/',
  };
  
  // In development mode, don't set a domain
  // In production, use the domain from config to allow sharing across subdomains
  if (COOKIE_DOMAIN) {
    Object.assign(cookieOptions, { domain: COOKIE_DOMAIN });
  }
  
  console.log('[SessionLogout] Using cookie domain (GET):', COOKIE_DOMAIN || 'None (default for development)');
  
  // Set the cookie
  response.cookies.set('__session', '', cookieOptions);
  
  return response;
}
