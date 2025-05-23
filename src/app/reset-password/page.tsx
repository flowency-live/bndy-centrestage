// src/app/reset-password/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { BndyLogo } from 'bndy-ui';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Providers from '../providers';

export default function ResetPasswordPage() {
  return (
    <Providers>
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordContent />
      </Suspense>
    </Providers>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-900 p-4 md:p-8 items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-white">Loading...</p>
    </main>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we have a reset code in the URL
  const oobCode = searchParams.get('oobCode');
  
  // Helper function to get error message
  const getErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    return 'An unknown error occurred';
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      console.log('Password reset requested for:', email);
      setResetSent(true);
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Reset any previous errors
    setPasswordError('');
    
    // Validate passwords
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }
    
    try {
      if (!oobCode) {
        throw new Error('Reset code is missing');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Password reset confirmed with code:', oobCode);
      
      // Show success message and redirect to login
      alert('Password has been reset successfully. You can now log in with your new password.');
      router.push('/login');
    } catch (err) {
      console.error('Error confirming password reset:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // If we don't have an oobCode, show the request reset form
  if (!oobCode) {
    return (
      <main className="min-h-screen flex flex-col bg-slate-900 p-4 md:p-8">
        <Link
          href="/login"
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>
        
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <h1 className="text-2xl font-bold text-white mb-8 text-center">
            Reset Password
          </h1>
          
          <div className="w-48 md:w-64 mx-auto mb-8">
            <BndyLogo className="w-full h-auto" color="#f97316" holeColor="#1e293b" />
          </div>
          
          {resetSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-900/20 border border-green-800 rounded-md text-green-400">
                <h3 className="font-medium text-lg mb-2">Reset Email Sent</h3>
                <p>
                  We&apos;ve sent password reset instructions to your email. 
                  Please check your inbox and follow the link to reset your password.
                </p>
              </div>
              
              <Link 
                href="/login" 
                className="text-orange-400 hover:text-orange-300 inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <p className="text-slate-300 text-sm">
                Enter your email address and we&apos;ll send you instructions to reset your password.
              </p>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                  placeholder="you@example.com"
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Link
                  href="/login"
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-md font-medium transition-colors border border-slate-700 text-center"
                >
                  Cancel
                </Link>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    );
  }
  
  // If we have an oobCode, show the password reset form
  return (
    <main className="min-h-screen flex flex-col bg-slate-900 p-4 md:p-8">
      <Link
        href="/login"
        className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to login
      </Link>
      
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-8 text-center">
          Create New Password
        </h1>
        
        <div className="w-48 md:w-64 mx-auto mb-8">
          <BndyLogo className="w-full h-auto" color="#f97316" holeColor="#1e293b" />
        </div>
        
        <form onSubmit={handleResetConfirm} className="space-y-4">
          {(error || passwordError) && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-400 text-sm">
              {passwordError || error}
            </div>
          )}
          
          <p className="text-slate-300 text-sm">
            Enter a new password for your account. Choose a strong password that you don&apos;t use elsewhere.
          </p>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </main>
  );
}