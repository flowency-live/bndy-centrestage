'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Define role types for the application
type UserRole = string;
type UserRoles = string[];

export const AppLinks: React.FC = () => {
  // For simplicity, assume the user has admin access if they're logged in

  // Mock roles for demonstration purposes
  const userRoles = ['admin', 'user'];

  const appLinks = [
    {
      name: 'BNDY Live',
      description: 'Discover music events near you',
      url: 'https://bndy.live',
      role: 'user' as UserRole,
      icon: <ExternalLink className="w-4 h-4 ml-1" />
    },
    {
      name: 'BNDY App',
      description: 'Manage your music, setlists, and events',
      url: 'https://backstage.bndy.co.uk',
      role: ['live_admin', 'live_builder', 'live_giggoer', 'bndy_band', 'bndy_artist', 'bndy_venue', 'bndy_agent', 'bndy_studio', 'user'] as UserRole[],
      icon: <ExternalLink className="w-4 h-4 ml-1" />
    }
  ];

  const hasRole = (role: UserRole | UserRole[]) => {
    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }
    
    return userRoles.includes(role);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm p-6">
      <h3 className="text-lg font-medium text-slate-900 mb-4">BNDY Apps</h3>
      <div className="space-y-4">
        {appLinks.map((app, index) => (
          hasRole(app.role) && (
            <Link
              key={index}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-slate-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-md font-medium text-slate-900 flex items-center">
                    {app.name}
                    {app.icon}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {app.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        ))}
      </div>
    </div>
  );
};
