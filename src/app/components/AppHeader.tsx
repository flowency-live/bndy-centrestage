//path: src/app/components/AppHeader.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BndyLogo from './BndyLogo';
import { Menu, X } from 'lucide-react';

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900 shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <BndyLogo
                className="h-8 w-auto"
                color="#f97316"
                holeColor='#0f172a'
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-orange-500 transition-colors"
            >
              Home
            </Link>
            <a
              href="https://bndy.live"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-cyan-500 transition-colors"
            >
              Discover Events
            </a>
            <a
              href="https://backstage.bndy.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-cyan-500 transition-colors"
            >
              Manage Music
            </a>
            <Link
              href="/admin"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-purple-500 transition-colors"
            >
              Venue Admin
            </Link>
            <Link
              href="/test-map"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-green-500 transition-colors"
            >
              Map Test
            </Link>
            <Link
              href="/about"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-orange-500 transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-300 hover:text-orange-500 hover:bg-slate-800 transition-colors"
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
          <div className="pt-2 pb-3 space-y-1 px-4 sm:px-6 lg:px-8 border-t border-slate-800 bg-slate-900">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-orange-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <a
              href="https://bndy.live"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-cyan-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Discover Events
            </a>
            <a
              href="https://backstage.bndy.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-cyan-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Manage Music
            </a>
            <Link
              href="/admin"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-purple-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Venue Admin
            </Link>
            <Link
              href="/test-map"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-green-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Map Test
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-orange-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}