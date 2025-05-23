import React, { useState, useEffect } from 'react';
import { BndySpinner, useAuth, BACKSTAGE_URL, FRONTSTAGE_URL, AUTH_URL } from 'bndy-ui';
import { PasswordInput } from './PasswordInput';
import { SocialLoginButtons } from './SocialLoginButtons';
import { useRouter } from 'next/navigation';
import { SourceApp } from '../../../../lib/firebase/user-management';

interface LoginFormProps {
  redirectUrl: string;
  sourceApp: SourceApp;
  clientId?: string;
}


export const LoginForm: React.FC<LoginFormProps> = ({ 
  redirectUrl, 
  sourceApp,
  clientId 
}) => {
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get authentication context
  const auth = useAuth();
  const { signInWithGoogle, error, isLoading, currentUser, clearError } = auth;
  
  // Router for navigation
  const router = useRouter();

  // Get the appropriate domain based on clientId using the centralized configuration
  const getDomainForClientId = (clientId: string | undefined): string => {
    // Use the centralized configuration from bndy-ui
    if (clientId === 'bndy-backstage') {
      return BACKSTAGE_URL;
    } else if (clientId === 'bndy-frontstage') {
      return FRONTSTAGE_URL;
    } else {
      // Default to centrestage/auth URL
      return AUTH_URL;
    }
  };
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (currentUser) {
      // Handle redirection based on clientId
      if (clientId && clientId !== 'bndy-centrestage') {
        // For cross-domain redirects (backstage, frontstage), construct the full URL
        const targetDomain = getDomainForClientId(clientId);
        const fullRedirectUrl = `${targetDomain}${redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`}`;
        console.log(`[LoginForm] Redirecting to ${clientId}:`, fullRedirectUrl);
        window.location.href = fullRedirectUrl;
      } else {
        // Default behavior for centrestage (same domain)
        console.log('[LoginForm] Redirecting to:', redirectUrl);
        router.push(redirectUrl);
      }
    }
  }, [currentUser, redirectUrl, router, clientId]);

  // Update local error state when auth error changes
  useEffect(() => {
    if (error) {
      // Format Firebase error messages to be more user-friendly
      let errorMessage = 'An error occurred during login';
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = 'Incorrect email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later';
      } else if (error.code) {
        errorMessage = error.message || 'Authentication error';
      }
      
      setLoginError(errorMessage);
    }
  }, [error]);
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    clearError();
    setIsSubmitting(true);

    try {
      // Basic validation before sending to Firebase
      if (!email || !email.includes('@')) {
        setLoginError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }
      
      if (!password || password.length < 6) {
        setLoginError('Password must be at least 6 characters');
        setIsSubmitting(false);
        return;
      }
      
      // Attempt to sign in with email and password
      // Using type assertion to fix TypeScript error
      await (auth as any).signInWithEmail(email, password);
      console.log('Login successful');
      
      // The redirect will happen in the useEffect when currentUser changes
    } catch (error: any) {
      // Error handling is done in the useEffect that watches for auth errors
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {loginError && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-400 text-sm mb-4">
          {loginError}
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-white">
            Email or Username
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Enter your email or username"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Password
            </label>
            <a href="#" className="text-xs text-orange-400 hover:text-orange-300">
              Forgot password?
            </a>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <BndySpinner size={20} className="mr-2" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <SocialLoginButtons 
        onError={setLoginError} 
        disabled={isSubmitting}
        sourceApp={sourceApp}
        clientId={clientId}
      />
    </>
  );
};
