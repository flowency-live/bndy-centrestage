'use client';

import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  GoogleMapsProvider, 
  initFirebase, 
  AuthProvider,
  UserDataProvider
} from 'bndy-ui';

// Import configuration from bndy-ui
import { AUTH_URL } from '../../../bndy-ui/auth/config';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // State to track if Firebase has been initialized
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  
  // Initialize Firebase on the client side and check for existing session
  useEffect(() => {
    const initializeFirebaseAndSession = async () => {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        try {
          // Initialize Firebase with the configuration
          const { firebaseApp, auth, firestore } = initFirebase({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
          });
          console.log('[PROVIDERS] Firebase initialized successfully');
          console.log('[PROVIDERS] Firestore instance:', firestore ? 'Available' : 'Not available');
          console.log('[PROVIDERS] Auth instance:', auth ? 'Available' : 'Not available');
          console.log('[PROVIDERS] Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
          setFirebaseInitialized(true);
          
          // Simple diagnostic check for session cookie without complex auth sync
          console.log('[PROVIDERS] Checking for existing session on server');
          try {
            const sessionResponse = await fetch('/api/sessionCheck', {
              method: 'GET',
              credentials: 'include',
            });
            
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              console.log('[PROVIDERS] Server session check result:', sessionData);
              
              if (sessionData.authenticated) {
                console.log('[PROVIDERS] Valid session exists on server for user:', sessionData.uid);
                console.log('[PROVIDERS] Firebase should handle auth state automatically via onAuthStateChanged');
              }
            }
          } catch (sessionError) {
            console.error('[PROVIDERS] Error checking server session:', sessionError);
          }
          
          // Log cookie information for debugging
          if (typeof document !== 'undefined') {
            console.log('[PROVIDERS] Document cookies:', document.cookie);
            console.log('[PROVIDERS] Has __session cookie:', document.cookie.includes('__session='));
            const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.local.bndy.test';
            console.log('[PROVIDERS] Cookie domain from config:', cookieDomain);
          }
        } catch (error) {
          console.error('[PROVIDERS] Firebase initialization error:', error);
        }
      } else {
        console.error('[PROVIDERS] Firebase API key not found or not in browser environment');
      }
    };
    
    initializeFirebaseAndSession();
  }, []);

  // Get Google Maps API key from environment variables
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  
  // Log initialization in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[PROVIDERS] Initializing providers...');
    }
  }, []);

  // Handle session logout (clear the session cookie)
  const handleSessionLogout = async () => {
    try {
      // Log the AUTH_URL for debugging
      console.log('[AUTH] Using AUTH_URL for logout:', AUTH_URL);
      
      // Send request to the session logout API
      const logoutEndpoint = `${AUTH_URL}/api/sessionLogout`;
      console.log('[AUTH] Sending logout request to:', logoutEndpoint);
      
      const response = await fetch(logoutEndpoint, {
        method: 'POST',
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AUTH] Session logout failed:', errorData);
        throw new Error(`Session logout failed: ${errorData.error || response.statusText}`);
      }
      
      console.log('[AUTH] Session logout successful');
    } catch (error) {
      console.error('[AUTH] Session logout error:', error);
    }
  };
  
  // Handle session login (convert Firebase ID token to session cookie)
  const handleSessionLogin = async (user: any) => {
    try {
      // Get the ID token from the user with forceRefresh to ensure it's fresh
      const idToken = await user.getIdToken(/* forceRefresh */ true);
      
      // Log the token length for debugging
      console.log('[AUTH] Sending ID token of length', idToken.length);
      
      // Log the AUTH_URL for debugging
      console.log('[AUTH] Using AUTH_URL:', AUTH_URL);
      
      // Send the ID token to the session login API
      // Use the AUTH_URL from the config for cross-domain authentication
      const loginEndpoint = `${AUTH_URL}/api/sessionLogin`;
      console.log('[AUTH] Sending ID token to:', loginEndpoint);
      
      // Log document cookies before the request
      console.log('[AUTH] Cookies before session login request:', document.cookie);
      console.log('[AUTH] Has __session cookie before request:', document.cookie.includes('__session='));
      
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
        credentials: 'include', // Important for cookies
      });
      
      // Inspect response headers for debugging
      console.log('[AUTH] Response status:', response.status);
      console.log('[AUTH] Response headers:');
      response.headers.forEach((value, key) => {
        console.log(`[AUTH] ${key}: ${value}`);
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AUTH] Session login failed:', errorData);
        throw new Error(`Session login failed: ${errorData.error || response.statusText}`);
      }
      
      // Log document cookies after the request
      console.log('[AUTH] Session login successful');
      console.log('[AUTH] Cookies after session login response:', document.cookie);
      console.log('[AUTH] Has __session cookie after response:', document.cookie.includes('__session='));
      
      // Check if the cookie is actually set
      if (!document.cookie.includes('__session=')) {
        console.warn('[AUTH] WARNING: __session cookie not found after successful login response');
        console.warn('[AUTH] This may indicate browser security restrictions preventing cookie storage');
        console.warn('[AUTH] Check browser console for security warnings related to cookies');
      }
    } catch (error) {
      console.error('[AUTH] Session login error:', error);
    }
  };

  // No duplicate function needed here

  // Loading state while Firebase initializes
  if (!firebaseInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading application...</p>
      </div>
    );
  }

  // Render the full application once Firebase is initialized
  return (
    <AuthProvider
      // @ts-ignore - These props are defined in the AuthProvider component but TypeScript isn't recognizing them
      onSessionLogin={handleSessionLogin}
      onSessionLogout={handleSessionLogout}
    >
      {/* Wrap with UserDataProvider to manage Firestore user profile data */}
      <UserDataProvider>
        {mapsApiKey ? (
          // Only render GoogleMapsProvider when API key is available
          <GoogleMapsProvider apiKey={mapsApiKey}>
            {children}
          </GoogleMapsProvider>
        ) : (
          // Skip the GoogleMapsProvider when no API key is available
          children
        )}
      </UserDataProvider>
    </AuthProvider>
  );
}
