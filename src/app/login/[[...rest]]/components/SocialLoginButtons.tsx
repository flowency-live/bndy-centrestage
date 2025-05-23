import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'bndy-ui';
import { SourceApp } from '../../../../lib/firebase/user-management';
import { FirebaseError } from 'firebase/app';

interface SocialLoginButtonsProps {
  onError: (message: string) => void;
  disabled?: boolean;
  sourceApp: SourceApp;
  clientId?: string;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ 
  onError,
  disabled = false,
  sourceApp,
  clientId
}) => {
  const router = useRouter();
  const auth = useAuth();
  const { signInWithGoogle, signInWithFacebook } = auth;
  
  const handleGoogleSignIn = async () => {
    try {
      console.log('[SocialLogin] Initiating Google sign-in');
      const userCredential = await signInWithGoogle();
      console.log('[SocialLogin] Google sign-in successful. UID:', userCredential.user.uid);
      console.log('[SocialLogin] Authentication provider:', userCredential.providerId);
      
      // User record creation is now handled by the AuthProvider in auth-context.tsx
      // No need to manually create/update the user record here
      
      // Redirect will be handled by the useEffect in the parent component
      // that watches for currentUser changes
    } catch (err: any) {
      console.error('[SocialLogin] Google sign-in error:', err);
      
      // Provide user-friendly error messages based on the error code
      if (err instanceof FirebaseError) {
        console.error('[SocialLogin] Firebase error code:', err.code);
        
        if (err.code === 'auth/popup-blocked') {
          onError('Please allow popups or try a different browser');
        } else if (err.code === 'auth/popup-closed-by-user') {
          onError('Login was cancelled. Please try again');
        } else if (err.code === 'auth/account-exists-with-different-credential') {
          onError('You already have an account with a different sign-in method');
        } else {
          onError('Failed to sign in with Google. Please try again');
        }
      } else {
        onError('Failed to sign in with Google. Please try again');
      }
    }
  };
  
  const handleFacebookSignIn = async () => {
    try {
      console.log('[SocialLogin] Initiating Facebook sign-in');
      const userCredential = await signInWithFacebook();
      console.log('[SocialLogin] Facebook sign-in successful. UID:', userCredential.user.uid);
      console.log('[SocialLogin] Authentication provider:', userCredential.providerId);
      
      // AuthContext will handle adding the user to Firestore
      // No need to manually create/update the user record here
      
      // Redirect will be handled by the useEffect in the parent component
      // that watches for currentUser changes
    } catch (err: any) {
      console.error('[SocialLogin] Facebook sign-in error:', err);
      
      // Provide user-friendly error messages based on the error code
      if (err instanceof FirebaseError) {
        console.error('[SocialLogin] Firebase error code:', err.code);
        
        if (err.code === 'auth/popup-blocked') {
          onError('Please allow popups or try a different browser');
        } else if (err.code === 'auth/popup-closed-by-user') {
          onError('Login was cancelled. Please try again');
        } else if (err.code === 'auth/account-exists-with-different-credential') {
          onError('You already have an account with a different sign-in method');
        } else {
          onError('Failed to sign in with Facebook. Please try again');
        }
      } else {
        onError('Failed to sign in with Facebook. Please try again');
      }
    }
  };
  
  const handleAppleSignIn = async () => {
    try {
      console.log('[SocialLogin] Initiating Apple sign-in');
      const userCredential = await auth.signInWithApple();
      console.log('[SocialLogin] Apple sign-in successful. UID:', userCredential.user.uid);
      console.log('[SocialLogin] Authentication provider:', userCredential.providerId);
      
      // AuthContext will handle adding the user to Firestore
      // No need to manually create/update the user record here
      
      // Redirect will be handled by the useEffect in the parent component
      // that watches for currentUser changes
    } catch (err: any) {
      console.error('[SocialLogin] Apple sign-in error:', err);
      
      // Provide user-friendly error messages based on the error code
      if (err instanceof FirebaseError) {
        console.error('[SocialLogin] Firebase error code:', err.code);
        
        if (err.code === 'auth/popup-blocked') {
          onError('Please allow popups or try a different browser');
        } else if (err.code === 'auth/popup-closed-by-user') {
          onError('Login was cancelled. Please try again');
        } else if (err.code === 'auth/account-exists-with-different-credential') {
          onError('You already have an account with a different sign-in method');
        } else {
          onError('Failed to sign in with Apple. Please try again');
        }
      } else {
        onError('Failed to sign in with Apple. Please try again');
      }
    }
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-900 text-slate-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={disabled}
          className="w-full flex justify-center items-center px-4 py-2 border border-slate-700 rounded-md shadow-sm bg-slate-800 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
            </g>
          </svg>
          Google
        </button>

        <button
          disabled={true}
          className="w-full flex justify-center items-center px-4 py-2 border border-slate-700 rounded-md shadow-sm bg-slate-800/50 text-sm font-medium text-slate-500 cursor-not-allowed"
        >
          <svg className="h-5 w-5 mr-2 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
          </svg>
          Facebook
        </button>
      </div>
    </div>
  );
};
