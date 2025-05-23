// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Global variables to track initialization status
let adminInitialized = false;

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bandflow2025';
    console.log('🔥 [ADMIN] Firebase Admin initialization - Project ID:', projectId);
    
    // Check for admin credentials in environment variables
    const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID || projectId;
    const adminClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const adminPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    console.log('🔥 [ADMIN] Checking for admin credentials:', {
      projectId: adminProjectId ? '✅ Found' : '❌ Missing',
      clientEmail: adminClientEmail ? '✅ Found' : '❌ Missing',
      privateKey: adminPrivateKey ? '✅ Found (length: ' + (adminPrivateKey?.length || 0) + ')' : '❌ Missing'
    });
    
    // If we have all the required credentials, use them
    if (adminProjectId && adminClientEmail && adminPrivateKey) {
      try {
        console.log('🔥 [ADMIN] Initializing Firebase Admin with service account credentials');
        
        // Format the private key correctly (replace escaped newlines with actual newlines)
        const formattedPrivateKey = adminPrivateKey.replace(/\\n/g, '\n');
        
        // Initialize with service account credentials
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: adminProjectId,
            clientEmail: adminClientEmail,
            privateKey: formattedPrivateKey
          }),
          projectId: adminProjectId
        });
        
        console.log('🔥 [ADMIN] Firebase Admin initialized with service account credentials');
        adminInitialized = true;
      } catch (error) {
        console.error('🔥 [ADMIN] Error initializing Firebase Admin with service account:', error);
        
        // Fall back to development mode initialization
        if (process.env.NODE_ENV === 'development') {
          console.log('🔥 [ADMIN] Falling back to development mode initialization');
          admin.initializeApp({
            projectId: adminProjectId
          });
          adminInitialized = true;
          (global as any).FIREBASE_ADMIN_DEV_MODE = true;
          console.log('🔥 [ADMIN] Firebase Admin initialized for development (auth-only mode)');
        } else {
          throw new Error('Failed to initialize Firebase Admin with service account credentials');
        }
      }
    }
    // For development environment without credentials
    else if (process.env.NODE_ENV === 'development') {
      try {
        console.log('🔥 [ADMIN] Development mode: Using direct initialization approach');
        
        // For development, we'll make a direct initialization that doesn't require service account credentials
        admin.initializeApp({
          projectId
        });
        
        console.log('🔥 [ADMIN] Firebase Admin initialized for development (auth-only mode)');
        adminInitialized = true;
        
        // Add special development-mode flag to handle Firestore operations differently
        (global as any).FIREBASE_ADMIN_DEV_MODE = true;
        console.log('🔥 [ADMIN] Development mode flag set - will use fallbacks for Firestore operations');
        
        // Configure to use Firestore emulator if available
        if (process.env.FIRESTORE_EMULATOR_HOST) {
          console.log(`🔥 [ADMIN] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
        }
      } catch (devError: unknown) {
        console.error('🔥 [ADMIN] Error initializing Firebase Admin in development:', devError);
        
        // Last resort fallback
        console.log('🔥 [ADMIN] Attempting emergency fallback initialization');
        if (!admin.apps.length) {
          admin.initializeApp();
          adminInitialized = true;
          (global as any).FIREBASE_ADMIN_DEV_MODE = true;
          console.log('🔥 [ADMIN] Firebase Admin initialized with emergency fallback');
        }
      }
    }
    // Fallback initialization if no credentials and not in development
    else {
      console.warn('🔥 [ADMIN] No Firebase Admin credentials found, using minimal initialization');
      admin.initializeApp({
        projectId
      });
      adminInitialized = true;
      console.log('🔥 [ADMIN] Firebase Admin initialized with fallback configuration');
    }
  } catch (error) {
    console.error('🔥 [ADMIN] Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin - cannot proceed with authentication');
  }
} else {
  adminInitialized = true;
  console.log('🔥 [ADMIN] Firebase Admin already initialized');
}

// Get Auth and Firestore instances with error handling
let adminAuth: any, adminDb: any;

if (adminInitialized) {
  try {
    adminAuth = getAuth();
    console.log('🔥 [ADMIN] Firebase Admin Auth initialized successfully');
    
    // Test the auth instance to ensure it's working properly
    adminAuth.tenantManager().listTenants(1)
      .then(() => console.log('🔥 [ADMIN] Auth instance verified successfully'))
      .catch((err: any) => {
        console.warn('🔥 [ADMIN] Auth instance warning (expected in dev):', err.message);
        // Continue despite warning - this is expected in dev environment
      });
  } catch (error) {
    console.error('🔥 [ADMIN] Error initializing Firebase Admin Auth:', error);
    // No mocks - we always want to use real data
    throw new Error('Failed to initialize Firebase Admin Auth - cannot proceed without proper authentication');
  }

  try {
    adminDb = getFirestore();
    console.log('🔥 [ADMIN] Firebase Admin Firestore initialized successfully');
    
    // Test the Firestore instance to ensure it's working properly
    adminDb.listCollections()
      .then((collections: any[]) => {
        console.log(`🔥 [ADMIN] Firestore instance verified - found ${collections.length} collections`);
        if (collections.length > 0) {
          console.log('🔥 [ADMIN] Collection names:', collections.map(c => c.id).join(', '));
        }
      })
      .catch((err: any) => {
        console.warn('🔥 [ADMIN] Firestore instance warning (expected in dev):', err.message);
        // Continue despite warning - this is expected in dev environment
      });
  } catch (error) {
    console.error('🔥 [ADMIN] Error initializing Firebase Admin Firestore:', error);
    // No mocks - we always want to use real data
    throw new Error('Failed to initialize Firebase Admin Firestore - cannot proceed without database access');
  }
} else {
  console.error('🔥 [ADMIN] Firebase Admin not initialized properly - cannot get Auth and Firestore instances');
  throw new Error('Firebase Admin not initialized properly');
}

// Double-check that we have valid instances before exporting
if (!adminAuth || !adminDb) {
  console.error('🔥 [ADMIN] Admin Auth or Firestore instances are undefined');
  throw new Error('Admin Auth or Firestore instances are undefined');
}

console.log('🔥 [ADMIN] Successfully initialized and exported Admin Auth and Firestore instances');

export { adminAuth, adminDb };