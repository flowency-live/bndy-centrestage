import React, { useState, useEffect } from 'react';
import { BndySpinner, useAuth, firebaseApp } from 'bndy-ui';
import { PasswordInput } from './PasswordInput';
import { SocialLoginButtons } from './SocialLoginButtons';
import { useRouter } from 'next/navigation';
import { SourceApp } from '../../../../lib/firebase/user-management';
import { getFirebaseFirestore } from '../../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface SignupFormProps {
  redirectUrl: string;
  sourceApp: 'backstage' | 'centrestage' | 'frontstage';
  clientId?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({ 
  redirectUrl,
  sourceApp
}) => {
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Get authentication context
  const auth = useAuth();
  const { error, isLoading, currentUser, clearError } = auth;
  
  // Router for navigation
  const router = useRouter();
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (currentUser) {
      router.push(redirectUrl);
    }
  }, [currentUser, redirectUrl, router]);

  // Update local error state when auth error changes
  useEffect(() => {
    if (error) {
      // Format Firebase error messages to be more user-friendly
      let errorMessage = 'An error occurred during signup';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please try logging in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code) {
        errorMessage = error.message || 'Authentication error';
      }
      
      setSignupError(errorMessage);
    }
  }, [error]);
  
  // Debug function to log signup information
  const logSignupDebugInfo = (data: any) => {
    console.log('SIGNUP DEBUG INFO:', data);
    setDebugInfo(data);
    return data;
  };
  
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    clearError();
    setIsSubmitting(true);
    
    try {
      // Validate input
      if (!signupEmail || !signupEmail.includes('@')) {
        setSignupError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }
      
      if (!signupPassword || signupPassword.length < 8) {
        setSignupError('Password must be at least 8 characters');
        setIsSubmitting(false);
        return;
      }
      
      if (signupPassword !== confirmPassword) {
        setSignupError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }
      
      // Log signup info for debugging
      logSignupDebugInfo({ 
        email: signupEmail, 
        passwordLength: signupPassword.length,
        sourceApp
      });
      
      // Create user with email and password
      console.log('Creating user with email:', signupEmail);
      const userCredential = await auth.createUserWithEmail(signupEmail, signupPassword);
      
      console.log('User created successfully:', userCredential.user.uid);
      console.log('[SignupForm] Signup succeeded. Firebase UID:', userCredential?.user?.uid);
      console.log('[SignupForm] User object:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });
      
      // Ensure client is authenticated as the user before writing to Firestore
      try {
        // Force re-authentication to avoid Firebase race condition
        await auth.signInWithEmail(signupEmail, signupPassword);
        const firestore = getFirebaseFirestore();
        const userDocRef = doc(firestore, 'bndy_users', userCredential.user.uid);
        const userDocData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          // Parse roles from URL if present, otherwise default to ['user']
          roles: (() => {
            if (typeof window !== 'undefined') {
              const params = new URLSearchParams(window.location.search);
              const rolesParam = params.get('roles');
              if (rolesParam) {
                // Split by comma, trim whitespace, filter out empty values
                return rolesParam.split(',').map(r => r.trim()).filter(Boolean);
              }
            }
            return ['user'];
          })(),
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, userDocData, { merge: true });
        console.log('[SignupForm] User added to bndy_users in Firestore:', userDocData);
      } catch (firestoreError: any) {
        setSignupError('Failed to save user profile. Please try again.');
        console.error('[SignupForm] Firestore write failed:', firestoreError);
        setIsSubmitting(false);
        return;
      }

      console.log('Signup successful');
      // The redirect will happen in the useEffect when currentUser changes
    } catch (error: any) {
      // Error handling is done in the useEffect that watches for auth errors
      console.error('Signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {signupError && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-400 text-sm mb-4">
          {signupError}
        </div>
      )}
      
      <form onSubmit={handleSignupSubmit} className="space-y-4">
        
        
        <div>
          <label htmlFor="signupEmail" className="block text-sm font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            id="signupEmail"
            type="email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="you@example.com"
          />
        </div>

        <PasswordInput
          id="signupPassword"
          value={signupPassword}
          onChange={(e) => setSignupPassword(e.target.value)}
          label="Password"
          required
          minLength={6}
          disabled={isSubmitting}
        />

        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          label="Confirm Password"
          required
          disabled={isSubmitting}
        />

        {/* Space for future CAPTCHA implementation */}
        <div className="mt-4"></div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <BndySpinner size={20} className="mr-2" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <SocialLoginButtons 
        onError={setSignupError}
        disabled={isSubmitting}
        sourceApp={sourceApp}
      />
    </>
  );
};
