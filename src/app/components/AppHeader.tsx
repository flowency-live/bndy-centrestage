//path: src/app/components/AppHeader.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BndyLogo, useAuth } from 'bndy-ui';
import { Menu, X, User, LogIn, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, signOut, isLoading } = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <BndyLogo className="h-8 w-auto" color="#f97316" holeColor='#ffffff' />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-orange-500"
            >
              Home
            </Link>
            <Link 
              href="https://bndy.live" 
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-orange-500"
            >
              Discover
            </Link>
            <Link 
              href="https://backstage.bndy.co.uk" 
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-orange-500"
            >
              Manage
            </Link>
            <Link 
              href="/about" 
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-orange-500"
            >
              About
            </Link>

            <div className="flex items-center space-x-3">
              {currentUser ? (
                <>
                  <Link 
                    href="/account" 
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-orange-500"
                  >
                    <User size={18} className="mr-1" />
                    Account
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                    disabled={isLoading}
                  >
                    <LogOut size={18} className="mr-1" />
                    Sign Out
                    {isLoading && <span className="ml-1">...</span>}
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  <LogIn size={18} className="mr-1" />
                  Sign In
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-slate-500 hover:text-slate-700"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
            <Link 
              href="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-orange-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="https://bndy.live" 
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-orange-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Discover
            </Link>
            <Link 
              href="https://backstage.bndy.co.uk" 
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-orange-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Manage
            </Link>
            <Link 
              href="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-orange-500"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            
            {/* Authentication links */}
            {currentUser ? (
              <>
                <Link 
                  href="/account" 
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-orange-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={18} className="mr-2" />
                  My Account
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-orange-500"
                  disabled={isLoading}
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                  {isLoading && <span className="ml-1">...</span>}
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-orange-500"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn size={18} className="mr-2" />
                Sign In
              </Link>
            )}

            <div className="w-full mt-2 flex items-center justify-center px-3 py-2 rounded-md text-base font-medium text-white bg-orange-500 hover:bg-orange-600">
              Menu
            </div>
          </div>
        </div>
      )}
    </header>
  );
}