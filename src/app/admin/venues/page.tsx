'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, AlertCircle, RefreshCw, Edit, Trash2, Save, X, Phone } from 'lucide-react';
import Link from 'next/link';
import { AdminNav } from '../components/AdminNav';
import { getAllVenues, updateVenue, deleteVenue, type Venue } from '../../../lib/services/admin-service';

export default function VenuesAdmin() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'validated' | 'unvalidated' | 'has-coords' | 'has-images'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVenue, setEditingVenue] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Venue | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllVenues();
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
      const updatedVenue = await updateVenue(editForm.id, editForm);
      setVenues(venues.map(v => v.id === editForm.id ? updatedVenue : v));
      setEditingVenue(null);
      setEditForm(null);
    } catch (err) {
      console.error('Failed to save venue:', err);
      setError(err instanceof Error ? err.message : 'Failed to save venue');
    }
  };

  const handleDelete = async (venueId: string) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    setDeleting(venueId);
    try {
      await deleteVenue(venueId);
      setVenues(venues.filter(v => v.id !== venueId));
    } catch (err) {
      console.error('Failed to delete venue:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete venue');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.postcode.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'validated') return venue.validated;
    if (filter === 'unvalidated') return !venue.validated;
    if (filter === 'has-coords') return venue.latitude !== 0 && venue.longitude !== 0;
    if (filter === 'has-images') return venue.profileImageUrl !== null;
    return true;
  });

  const stats = {
    total: venues.length,
    validated: venues.filter(v => v.validated).length,
    unvalidated: venues.filter(v => !v.validated).length,
    hasCoords: venues.filter(v => v.latitude !== 0 && v.longitude !== 0).length,
    hasImages: venues.filter(v => v.profileImageUrl).length,
    hasPhone: venues.filter(v => v.phone).length,
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
              <div className="flex items-center gap-4 mb-2">
                <Link href="/admin" className="text-gray-400 hover:text-white">
                  ← Back to Admin
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-white">BNDY Venues Admin</h1>
              <p className="text-gray-300 mt-1">Manage venue profiles from DynamoDB API</p>
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

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
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
                <p className="text-gray-400">Unvalidated</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-500 rounded mr-3 flex items-center justify-center">
                <span className="text-white font-bold">📍</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hasCoords}</p>
                <p className="text-gray-400">Has Coordinates</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 rounded mr-3 flex items-center justify-center">
                <span className="text-white font-bold">📷</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hasImages}</p>
                <p className="text-gray-400">With Images</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <Phone className="w-8 h-8 text-cyan-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.hasPhone}</p>
                <p className="text-gray-400">Has Phone</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search venues by name, address, or postcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              All ({stats.total})
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
              Unvalidated ({stats.unvalidated})
            </button>
            <button
              onClick={() => setFilter('has-coords')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'has-coords'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Has Coords ({stats.hasCoords})
            </button>
            <button
              onClick={() => setFilter('has-images')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'has-images'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              With Images ({stats.hasImages})
            </button>
          </div>
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
                    Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Contact
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
                      <div className="flex items-center gap-2">
                        {venue.validated ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        {venue.profileImageUrl && <span className="text-purple-400" title="Has image">📷</span>}
                        {venue.latitude !== 0 && venue.longitude !== 0 && <span className="text-indigo-400" title="Has coordinates">📍</span>}
                      </div>
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
                        <div>
                          <div className="font-medium text-white">{venue.name}</div>
                          {venue.googlePlaceId && <div className="text-gray-400 text-sm">Google Place ID</div>}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingVenue === venue.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm?.address || ''}
                            onChange={(e) => setEditForm(prev => prev ? { ...prev, address: e.target.value } : null)}
                            className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                            placeholder="Address"
                          />
                          <input
                            type="text"
                            value={editForm?.postcode || ''}
                            onChange={(e) => setEditForm(prev => prev ? { ...prev, postcode: e.target.value } : null)}
                            className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                            placeholder="Postcode"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-gray-300 text-sm">{venue.address}</div>
                          {venue.postcode && <div className="text-gray-400 text-sm">{venue.postcode}</div>}
                          {venue.latitude && venue.longitude && venue.latitude !== 0 && venue.longitude !== 0 && (
                            <div className="text-gray-500 text-xs">
                              {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingVenue === venue.id ? (
                        <input
                          type="text"
                          value={editForm?.phone || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, phone: e.target.value } : null)}
                          className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                          placeholder="Phone number"
                        />
                      ) : (
                        <div>
                          {venue.phone ? (
                            <div className="text-gray-300 text-sm">{venue.phone}</div>
                          ) : (
                            <span className="text-gray-500 italic text-sm">No phone</span>
                          )}
                          <div className="flex items-center gap-1 text-sm mt-1">
                            {venue.socialMediaURLs.length > 0 && (
                              <span className="text-gray-400">🔗 {venue.socialMediaURLs.length}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {venue.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {venue.facilities.slice(0, 3).map(facility => (
                              <span key={facility} className="bg-slate-600 text-xs px-2 py-1 rounded">
                                {facility}
                              </span>
                            ))}
                            {venue.facilities.length > 3 && (
                              <span className="text-gray-400 text-xs">+{venue.facilities.length - 3}</span>
                            )}
                          </div>
                        )}
                        {venue.standardTicketed && (
                          <span className="text-green-400 text-xs">🎫 Ticketed</span>
                        )}
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