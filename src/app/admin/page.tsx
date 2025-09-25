'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, CheckCircle, AlertCircle, RefreshCw, Edit, Trash2, Save, X, User, Music, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { AdminNav } from './components/AdminNav';

interface Venue {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string;
  validated: boolean;
  profileImageUrl?: string;
}

export default function AdminDashboard() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'validated' | 'unvalidated'>('all');
  const [editingVenue, setEditingVenue] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Venue | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error(`Failed to fetch venues: ${response.status}`);
      }
      const data = await response.json();
      setVenues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (venue: Venue) => {
    setEditingVenue(venue.id);
    setEditForm({ ...venue });
  };

  const handleEditCancel = () => {
    setEditingVenue(null);
    setEditForm(null);
  };

  const handleEditSave = async () => {
    if (!editForm) return;

    try {
      // This would call a PUT endpoint when implemented
      console.log('Saving venue:', editForm);
      // For now, just update locally
      setVenues(venues.map(v => v.id === editForm.id ? editForm : v));
      setEditingVenue(null);
      setEditForm(null);
    } catch (err) {
      console.error('Failed to save venue:', err);
    }
  };

  const handleDelete = async (venueId: string) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    setDeleting(venueId);
    try {
      // This would call a DELETE endpoint when implemented
      console.log('Deleting venue:', venueId);
      // For now, just remove locally
      setVenues(venues.filter(v => v.id !== venueId));
    } catch (err) {
      console.error('Failed to delete venue:', err);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const filteredVenues = venues.filter(venue => {
    if (filter === 'validated') return venue.validated;
    if (filter === 'unvalidated') return !venue.validated;
    return true;
  });

  const stats = {
    total: venues.length,
    validated: venues.filter(v => v.validated).length,
    unvalidated: venues.filter(v => !v.validated).length,
    withImages: venues.filter(v => v.profileImageUrl).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading venues from API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Venues</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchVenues}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <AdminNav />

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">BNDY Admin Dashboard</h1>
              <p className="text-gray-300 mt-1">Manage venues, artists, and songs from AWS PostgreSQL API</p>
            </div>
            <button
              onClick={fetchVenues}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group cursor-pointer" onClick={() => window.location.href = '#venues'}>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="w-12 h-12 text-blue-500 mr-4" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Venues</h3>
                    <p className="text-gray-400">Manage venue data</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          </div>

          <Link href="/admin/artists" className="group">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-green-500 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="w-12 h-12 text-green-500 mr-4" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Artists</h3>
                    <p className="text-gray-400">Manage artist profiles</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
            </div>
          </Link>

          <Link href="/admin/songs" className="group">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-purple-500 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Music className="w-12 h-12 text-purple-500 mr-4" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Songs</h3>
                    <p className="text-gray-400">Manage song library</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
            </div>
          </Link>
        </div>

        {/* Venue Stats Title */}
        <h2 id="venues" className="text-2xl font-bold text-white mb-4">Venue Management</h2>

        {/* Venue Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-gray-400">Total Venues</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.validated}</p>
                <p className="text-gray-400">Validated</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.unvalidated}</p>
                <p className="text-gray-400">Need Review</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 rounded mr-3 flex items-center justify-center">
                <span className="text-white font-bold">📷</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withImages}</p>
                <p className="text-gray-400">With Images</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            All Venues ({stats.total})
          </button>
          <button
            onClick={() => setFilter('validated')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'validated'
                ? 'bg-green-500 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Validated ({stats.validated})
          </button>
          <button
            onClick={() => setFilter('unvalidated')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unvalidated'
                ? 'bg-yellow-500 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Need Review ({stats.unvalidated})
          </button>
        </div>

        {/* Venues Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {filteredVenues.map(venue => (
                  <tr key={venue.id} className="hover:bg-slate-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {venue.validated ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingVenue === venue.id ? (
                        <input
                          type="text"
                          value={editForm?.name || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                        />
                      ) : (
                        <div className="font-medium text-white">{venue.name}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingVenue === venue.id ? (
                        <textarea
                          value={editForm?.address || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, address: e.target.value } : null)}
                          className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600 h-20 resize-none"
                        />
                      ) : (
                        <div className="text-gray-300 text-sm max-w-xs">{venue.address}</div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingVenue === venue.id ? (
                        <div className="space-y-1">
                          <input
                            type="number"
                            step="any"
                            value={editForm?.location.lat || ''}
                            onChange={(e) => setEditForm(prev => prev ? {
                              ...prev,
                              location: { ...prev.location, lat: parseFloat(e.target.value) || 0 }
                            } : null)}
                            className="w-full bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 text-xs"
                            placeholder="Latitude"
                          />
                          <input
                            type="number"
                            step="any"
                            value={editForm?.location.lng || ''}
                            onChange={(e) => setEditForm(prev => prev ? {
                              ...prev,
                              location: { ...prev.location, lng: parseFloat(e.target.value) || 0 }
                            } : null)}
                            className="w-full bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 text-xs"
                            placeholder="Longitude"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">
                          <div>{venue.location.lat.toFixed(6)}</div>
                          <div>{venue.location.lng.toFixed(6)}</div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        {venue.googlePlaceId && <span className="text-blue-400">🗺️</span>}
                        {venue.profileImageUrl && <span className="text-purple-400">📷</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {editingVenue === venue.id ? (
                          <>
                            <button
                              onClick={handleEditSave}
                              className="p-1 bg-green-500 hover:bg-green-600 rounded transition-colors"
                              title="Save changes"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="p-1 bg-gray-500 hover:bg-gray-600 rounded transition-colors"
                              title="Cancel editing"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditStart(venue)}
                              className="p-1 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                              title="Edit venue"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(venue.id)}
                              disabled={deleting === venue.id}
                              className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
                              title="Delete venue"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {venue.googlePlaceId && (
                              <a
                                href={`https://www.google.com/maps/place/?q=place_id:${venue.googlePlaceId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-green-500 hover:bg-green-600 rounded transition-colors"
                                title="View on Google Maps"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <a
                              href={`https://www.google.com/maps/@${venue.location.lat},${venue.location.lng},17z`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-orange-500 hover:bg-orange-600 rounded transition-colors"
                              title="View coordinates on map"
                            >
                              <MapPin className="w-4 h-4" />
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredVenues.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No venues found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}