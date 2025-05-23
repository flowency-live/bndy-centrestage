'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search, Loader2 } from 'lucide-react';
import { useAuth } from 'bndy-ui';
import Providers from '../providers';

export default function AdminPage() {
  return (
    <Providers>
      <AdminContent />
    </Providers>
  );
}

function AdminContent() {
  const router = useRouter();
  const { currentUser } = useAuth();

  // DEBUG: Log currentUser object to verify roles and godMode
  console.log('[AdminPage] currentUser:', currentUser);
  
  // Check if user has admin role or godMode
  const isAdmin = currentUser?.roles?.includes('bndy_admin') || currentUser?.roles?.includes('global_admin') || currentUser?.godMode === true;

  // Show loading spinner if user info is loading
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin w-8 h-8 text-orange-500 mr-3" />
        <span className="text-lg text-slate-600">Loading...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <ShieldCheck className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
        <p className="text-slate-600">You do not have permission to access the admin panel.</p>
      </div>
    );
  }

  // If we're still here and have a user, they must be an admin
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center mb-8">
        <ShieldCheck className="w-8 h-8 text-orange-500 mr-3" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Admin Navigation Cards */}
        <div 
          onClick={() => router.push('/admin/users')}
          className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-2">User Management</h2>
          <p className="text-slate-600">View and manage user roles and permissions</p>
        </div>
        {/* Add more admin cards here as needed */}
      </div>
    </div>
  );
}
