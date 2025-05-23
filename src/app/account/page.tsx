//path: src/app/account/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BndyLogo, BndySpinner } from 'bndy-ui';
import { ArrowLeft, LogOut } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import Link from 'next/link';
import Providers from '../providers';
import { useAuthIntegration } from '../../hooks/useAuthIntegration';

// Import modular components
import {
  ProfileTab,
  SettingsTab,
  NotificationsTab,
  SecurityTab,
  SidebarNavigation,
  MobileNavigation,
  AppLinks
} from './components';

export default function AccountPage() {
  // Account page component with auth context
  return (
    <Providers>
      <AccountContent />
    </Providers>
  );
}

import { useAuth } from 'bndy-ui';

function AccountContent() {
  // Use the auth integration hook to ensure user is added to Firestore
  const { currentUser: user, isLoading: authLoading } = useAuthIntegration({
    sourceApp: 'centrestage',
    onUserAdded: () => console.log('[Account] User added to Firestore')
  });
  const router = useRouter();
  
  // State for the account page
  const [actionLoading, setActionLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Combine auth loading with action loading
  const isLoading = authLoading || actionLoading;
  
  // Redirect to login if no user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);
  
  // Show loading state while auth is loading or redirecting
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
      </div>
    );
  }

  console.log("Rendering account page for user:", user.email);

  // Handle sending verification email (mocked)
  const handleSendVerification = async () => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      // Mock verification email sending
      console.log('Sending verification email to:', user.email);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setVerificationSent(true);
      setTimeout(() => {
        setVerificationSent(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending verification email:', error);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = () => {
    // Redirect to home page on sign out
    router.push('/');
  };

  // We have a user, show the account page
  console.log("Rendering account page for user:", user.email);
  
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <AppHeader />

      <div className="flex-grow p-4 md:p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Mobile Navigation */}
            <div className="lg:hidden">
              <MobileNavigation 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />
            </div>

            {/* Sidebar Navigation (Desktop) */}
            <div className="hidden lg:block lg:col-span-1">
              <SidebarNavigation 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onSignOut={handleSignOut}
              />
              
              {/* App Links */}
              <div className="mt-6">
                <AppLinks />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* User info */}
              <div className="flex flex-col items-center mb-6 p-4">
                <div className="relative">
                  <img 
                    src={user.photoURL || 'https://via.placeholder.com/150'} 
                    alt="Profile" 
                    className="h-24 w-24 rounded-full object-cover border-2 border-slate-200" 
                  />
                  {!user.emailVerified && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Unverified
                    </div>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-800">
                  {user.displayName || 'User'}
                </h2>
                <p className="text-sm text-slate-500">{user.email}</p>
                
                {/* Sign out button */}
                <button 
                  onClick={() => {
                    // Redirect to home page on sign out
                    router.push('/');
                  }}
                  className="mt-4 flex items-center px-3 py-1 text-sm text-slate-600 hover:text-orange-500 border border-slate-300 rounded-md hover:border-orange-500 transition-colors"
                >
                  <LogOut size={14} className="mr-1" />
                  Sign out
                </button>
              </div>

              {activeTab === 'profile' && (
                <ProfileTab 
                  verificationSent={verificationSent} 
                  sendingVerification={isLoading} 
                  handleSendVerification={handleSendVerification} 
                />
              )}
              
              {activeTab === 'settings' && (
                <SettingsTab />
              )}
              
              {activeTab === 'notifications' && (
                <NotificationsTab />
              )}
              
              {activeTab === 'security' && (
                <SecurityTab />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
