'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, ROLE_GROUPS, getRoleDisplayName } from 'bndy-types';
import { useRouter } from 'next/navigation';
import Providers from '../../providers';
import { useAuth } from 'bndy-ui';
import { 
  Users, Search, Loader2, CheckCircle, XCircle, 
  ChevronDown, ChevronUp, RefreshCw, Save
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { getFirebaseFirestore } from '@/lib/firebase';
import { FirestoreUser } from '@/types/admin';

// Using centralized role definitions from bndy-ui (Single Auth Context Rule)

export default function UserManagementPage() {
  return (
    <Providers>
      <UserManagementContent />
    </Providers>
  );
}


function UserManagementContent() {
  const router = useRouter();
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FirestoreUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<{[key: string]: UserRole[]}>({});
  const [isSaving, setIsSaving] = useState<{[key: string]: boolean}>({});
  const [saveSuccess, setSaveSuccess] = useState<{[key: string]: boolean}>({});
  // Get Firestore instance
  const db = getFirebaseFirestore();
  
  // Get the authenticated user from auth context
  const { currentUser } = useAuth();
  
  // Check if user has admin role
  const isAdmin = currentUser?.roles?.some(role => 
    ROLE_GROUPS.ADMIN.includes(role as UserRole)
  );
  
  // Simulate admin access check with mock data
  const hasAdminRole = Array.isArray(currentUser?.roles) && 
    (currentUser?.roles?.includes('bndy_admin') || currentUser?.roles?.includes('global_admin'));
  const hasGodMode = false; // Mock value
  
  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Fetch users from Firestore
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setError(null);
    
    try {
      const usersCollection = collection(db, COLLECTIONS.USERS);
      const usersSnapshot = await getDocs(usersCollection);
      
      const usersData: FirestoreUser[] = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as FirestoreUser;
        usersData.push({
          ...userData,
          id: doc.id,
          roles: userData.roles || [],
        });
      });
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      
      // Initialize selected roles
      const initialSelectedRoles: {[key: string]: UserRole[]} = {};
      usersData.forEach(user => {
        initialSelectedRoles[user.id || user.uid] = user.roles || [];
      });
      setSelectedRoles(initialSelectedRoles);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to fetch users: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      user => 
        user.email?.toLowerCase().includes(query) ||
        user.displayName?.toLowerCase().includes(query) ||
        user.fullName?.toLowerCase().includes(query) ||
        user.id?.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const toggleEditUser = (userId: string) => {
    if (editingUser === userId) {
      setEditingUser(null);
    } else {
      setEditingUser(userId);
    }
  };

  const toggleRole = (userId: string, role: UserRole) => {
    const currentRoles = [...(selectedRoles[userId] || [])];
    const roleIndex = currentRoles.indexOf(role);
    
    if (roleIndex > -1) {
      currentRoles.splice(roleIndex, 1);
    } else {
      currentRoles.push(role);
    }
    
    setSelectedRoles({
      ...selectedRoles,
      [userId]: currentRoles
    });
  };

  const saveUserRoles = async (userId: string) => {
    if (!selectedRoles[userId]) return;
    
    setIsSaving({ ...isSaving, [userId]: true });
    setSaveSuccess({ ...saveSuccess, [userId]: false });
    
    try {
      // Get the roles from the selected state
      const roles = selectedRoles[userId];
      
      // Get Firestore reference
      const userRef = doc(getFirebaseFirestore(), COLLECTIONS.USERS, userId);
      
      // Update the roles field
      await updateDoc(userRef, { roles });
      
      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, roles } : user
      ));
      
      // Set success state
      setSaveSuccess({ ...saveSuccess, [userId]: true });
      
      // Clear success after 3 seconds
      setTimeout(() => {
        setSaveSuccess(prev => ({ ...prev, [userId]: false }));
      }, 3000);
    } catch (error) {
      console.error('Error updating user roles:', error);
      setError(`Failed to update roles: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving({ ...isSaving, [userId]: false });
    }
  };

  const refreshUsers = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoadingUsers(true);
      setError(null);
      
      const usersCollection = collection(db, COLLECTIONS.USERS);
      const usersSnapshot = await getDocs(usersCollection);
      
      const usersData: FirestoreUser[] = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as FirestoreUser;
        usersData.push({
          ...userData,
          id: doc.id,
          roles: userData.roles || [],
        });
      });
      
      setUsers(usersData);
      setFilteredUsers(searchQuery ? 
        usersData.filter(
          user => 
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.id?.toLowerCase().includes(searchQuery.toLowerCase())
        ) : 
        usersData
      );
      
      // Update selected roles with current user roles
      const updatedSelectedRoles: {[key: string]: UserRole[]} = {};
      usersData.forEach(user => {
        if (user.id) {
          updatedSelectedRoles[user.id] = user.roles || [];
        }
      });
      setSelectedRoles(updatedSelectedRoles);
    } catch (err) {
      console.error('Error refreshing users:', err);
      setError('Failed to refresh users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      (user.displayName || '').toLowerCase().includes(lowerCaseQuery) ||
      (user.email || '').toLowerCase().includes(lowerCaseQuery) ||
      (user.id || '').toLowerCase().includes(lowerCaseQuery) ||
      (user.uid || '').toLowerCase().includes(lowerCaseQuery)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);
  
  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <Users className="w-8 h-8 mr-3 text-orange-500" />
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        
        {currentUser && (
          <div className="mb-8 bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h2 className="text-lg font-semibold mb-2">Admin Access</h2>
            <p className="text-slate-300 mb-1">Logged in as: <span className="text-white font-medium">{currentUser.email}</span></p>
            <p className="text-slate-300">Access level: <span className="text-orange-400 font-medium">{hasGodMode ? 'God Mode' : 'Admin'}</span></p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="mr-2" />
            User Management
          </h1>
          
          <button 
            onClick={refreshUsers}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 transition-colors"
            disabled={isLoadingUsers}
          >
            {isLoadingUsers ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search users by name, email or ID..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Error message (only once) */}
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-800 rounded-md text-red-400 text-sm p-3">
            {error}
          </div>
        )}
        <div className="bg-slate-800 rounded-lg shadow divide-y divide-slate-700">
        {filteredUsers.length === 0 ? (
          <div className="text-center p-8 text-slate-400">No users found matching your search criteria.</div>
        ) : (
          <ul>
            {filteredUsers.map((user) => (
              <li key={user.id} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-5 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-900/60 flex items-center justify-center text-xl font-bold text-orange-200">
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{user.displayName || user.email || 'Unknown User'}</div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      <div className="text-xs text-slate-600 truncate">User ID: {user.id || user.uid}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(user.roles || []).map((role) => (
                          <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-900/70 text-orange-300">
                            {getRoleDisplayName(role)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => toggleEditUser(user.id || user.uid)}
                    className="inline-flex items-center px-3 py-1.5 border border-slate-600 text-xs font-medium rounded text-slate-200 bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {editingUser === (user.id || user.uid) ? (
                      <>
                        <ChevronUp className="mr-1 h-4 w-4" />
                        Hide Roles
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1 h-4 w-4" />
                        Edit Roles
                      </>
                    )}
                  </button>
                  {editingUser === (user.id || user.uid) && (
                    <div className="mt-4 w-full md:w-[32rem] bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-lg">
                      <div className="mb-3 flex justify-between items-center">
                        <h3 className="font-medium text-white">Assign Roles</h3>
                        <div className="flex items-center">
                          {saveSuccess[user.id || user.uid] && (
                            <span className="text-green-400 text-sm mr-2 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Saved
                            </span>
                          )}
                          <button
                            onClick={() => saveUserRoles(user.id || user.uid)}
                            disabled={isSaving[user.id || user.uid]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            {isSaving[user.id || user.uid] ? (
                              <>
                                <Loader2 className="animate-spin h-4 w-4 mr-1" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" />
                                Save Roles
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(ROLE_GROUPS).map(([groupName, roles]) => (
                          <div key={groupName} className="border border-slate-600 rounded-md p-3 bg-slate-800">
                            <h4 className="font-medium text-sm mb-2 text-slate-300">{groupName}</h4>
                            <div className="space-y-1">
                              {roles.map(role => (
                                <label key={role} className="flex items-center gap-2 cursor-pointer text-slate-200 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={selectedRoles[user.id || user.uid]?.includes(role) || false}
                                    onChange={() => toggleRole(user.id || user.uid, role)}
                                    className="form-checkbox h-4 w-4 text-orange-500 rounded border-slate-600 focus:ring-orange-500"
                                  />
                                  {getRoleDisplayName(role)}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);
}
