// components/LoginContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BndyLogo, BndyLoadingScreen } from 'bndy-ui';
import { BackButton } from './BackButton';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { SocialLoginButtons } from './SocialLoginButtons';

export const LoginContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  );
  
  // Get redirect URL if any - check both returnUrl and returnTo for compatibility
  const redirectUrl = searchParams.get('returnUrl') || searchParams.get('returnTo') || '/account';
  
  // Get clientId if any
  const clientId = searchParams.get('clientId');
  
  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Determine the source app based on the current URL and URL parameters
  const determineSourceApp = (): 'backstage' | 'centrestage' | 'frontstage' => {
    // First check if the source app is specified in the URL parameters
    const sourceAppParam = searchParams.get('source') as 'backstage' | 'centrestage' | 'frontstage' | null;
    if (sourceAppParam && ['backstage', 'centrestage', 'frontstage'].includes(sourceAppParam)) {
      return sourceAppParam;
    }
    
    if (typeof window === 'undefined') return 'centrestage'; // Default for server-side
    
    // If not in URL parameters, determine from hostname
    const hostname = window.location.hostname;
    const isLocalBndyTest = hostname.endsWith('.local.bndy.test');
    
    if (hostname.includes('backstage') || (isLocalBndyTest && hostname.startsWith('backstage'))) {
      return 'backstage';
    } else if (hostname.includes('bndy.live') || hostname.includes('frontstage') || 
              (isLocalBndyTest && hostname.startsWith('frontstage'))) {
      return 'frontstage';
    } else {
      return 'centrestage'; // Default for www.bndy.co.uk or centrestage.local.bndy.test
    }
  };

  useEffect(() => {
    setIsHydrated(true);
    console.log('Login page hydrated', { 
      redirectUrl,
      searchParams: Object.fromEntries(searchParams.entries()),
      pathname: window.location.pathname
    });
  }, [redirectUrl, searchParams]);
  
  if (!isHydrated) {
    return <BndyLoadingScreen label="Loading..." />;
  }
  
  return (
    <main className="min-h-screen flex flex-col bg-slate-900 p-4 md:p-8">
      <BackButton />

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-8 text-center">
          Welcome Back
        </h1>

        <div className="w-48 md:w-64 mx-auto mb-8">
          <BndyLogo className="w-full h-auto" color="#f97316" holeColor='#171717' />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-6">
          <button
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === 'login'
                ? 'border-b-2 border-orange-500 font-medium text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === 'signup'
                ? 'border-b-2 border-orange-500 font-medium text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {activeTab === 'login' ? (
          <LoginForm 
            redirectUrl={redirectUrl} 
            sourceApp={determineSourceApp()}
            clientId={clientId || ''}
          />
        ) : (
          <SignupForm 
            redirectUrl={redirectUrl}
            sourceApp={determineSourceApp()}
            clientId={clientId || ''}
          />
        )}
      </div>
    </main>
  );
};