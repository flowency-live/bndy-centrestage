'use client';

import React, { useState, useEffect } from 'react';
import { User, CheckCircle, AlertCircle, RefreshCw, Edit, Trash2, Save, X, Music } from 'lucide-react';
import Link from 'next/link';
import { AdminNav } from '../components/AdminNav';
import { getAllArtists, updateArtist, deleteArtist, type Artist } from '../../../lib/services/admin-service';

export default function ArtistsAdmin() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'claimed' | 'unclaimed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingArtist, setEditingArtist] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Artist | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchArtists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllArtists();
      setArtists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (artist: Artist) => {
    setEditingArtist(artist.id);
    setEditForm({ ...artist });
  };

  const handleEditCancel = () => {
    setEditingArtist(null);
    setEditForm(null);
  };

  const handleEditSave = async () => {
    if (!editForm) return;

    try {
      const updatedArtist = await updateArtist(editForm.id, editForm);
      setArtists(artists.map(a => a.id === editForm.id ? updatedArtist : a));
      setEditingArtist(null);
      setEditForm(null);
    } catch (err) {
      console.error('Failed to save artist:', err);
      setError(err instanceof Error ? err.message : 'Failed to save artist');
    }
  };

  const handleDelete = async (artistId: string) => {
    if (!confirm('Are you sure you want to delete this artist?')) return;

    setDeleting(artistId);
    try {
      await deleteArtist(artistId);
      setArtists(artists.filter(a => a.id !== artistId));
    } catch (err) {
      console.error('Failed to delete artist:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete artist');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artist.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artist.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'verified') return artist.isVerified;
    if (filter === 'unverified') return !artist.isVerified;
    if (filter === 'claimed') return artist.claimedByUserId !== null;
    if (filter === 'unclaimed') return artist.claimedByUserId === null;
    return true;
  });

  const stats = {
    total: artists.length,
    verified: artists.filter(a => a.isVerified).length,
    unverified: artists.filter(a => !a.isVerified).length,
    claimed: artists.filter(a => a.claimedByUserId !== null).length,
    unclaimed: artists.filter(a => a.claimedByUserId === null).length,
    withImages: artists.filter(a => a.profileImageUrl).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading artists from API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Artists</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchArtists}
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
              <h1 className="text-3xl font-bold text-white">BNDY Artists Admin</h1>
              <p className="text-gray-300 mt-1">Manage artist profiles from AWS PostgreSQL API</p>
            </div>
            <button
              onClick={fetchArtists}
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
              <User className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-gray-400">Total Artists</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-gray-400">Verified</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.unverified}</p>
                <p className="text-gray-400">Unverified</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-500 rounded mr-3 flex items-center justify-center">
                <span className="text-white font-bold">👤</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.claimed}</p>
                <p className="text-gray-400">Claimed</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-500 rounded mr-3 flex items-center justify-center">
                <span className="text-white font-bold">🔓</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unclaimed}</p>
                <p className="text-gray-400">Unclaimed</p>
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

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search artists by name, location, or genre..."
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
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'verified'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Verified ({stats.verified})
            </button>
            <button
              onClick={() => setFilter('unverified')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'unverified'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Unverified ({stats.unverified})
            </button>
            <button
              onClick={() => setFilter('claimed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'claimed'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Claimed ({stats.claimed})
            </button>
            <button
              onClick={() => setFilter('unclaimed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'unclaimed'
                  ? 'bg-gray-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Unclaimed ({stats.unclaimed})
            </button>
          </div>
        </div>

        {/* Artists Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Location & Genres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Bio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Social
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {filteredArtists.map(artist => (
                  <tr key={artist.id} className="hover:bg-slate-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {artist.isVerified ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        {artist.claimedByUserId ? (
                          <span className="text-indigo-400" title="Claimed by user">👤</span>
                        ) : (
                          <span className="text-gray-500" title="Unclaimed">🔓</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {editingArtist === artist.id ? (
                        <input
                          type="text"
                          value={editForm?.name || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                        />
                      ) : (
                        <div>
                          <div className="font-medium text-white">{artist.name}</div>
                          {artist.profileImageUrl && <span className="text-purple-400 text-sm">📷</span>}
                          <div className="text-gray-400 text-sm">{artist.followerCount} followers</div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingArtist === artist.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm?.location || ''}
                            onChange={(e) => setEditForm(prev => prev ? { ...prev, location: e.target.value } : null)}
                            className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                            placeholder="Location"
                          />
                          <input
                            type="text"
                            value={editForm?.genres.join(', ') || ''}
                            onChange={(e) => setEditForm(prev => prev ? {
                              ...prev,
                              genres: e.target.value.split(',').map(g => g.trim()).filter(g => g)
                            } : null)}
                            className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                            placeholder="Genres (comma separated)"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-gray-300 text-sm">{artist.location}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {artist.genres.map(genre => (
                              <span key={genre} className="bg-slate-600 text-xs px-2 py-1 rounded">
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingArtist === artist.id ? (
                        <textarea
                          value={editForm?.bio || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, bio: e.target.value } : null)}
                          className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600 h-20 resize-none"
                          placeholder="Artist bio"
                        />
                      ) : (
                        <div className="text-gray-300 text-sm max-w-xs">
                          {artist.bio || <span className="text-gray-500 italic">No bio</span>}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        {artist.facebookUrl && <a href={artist.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400">📘</a>}
                        {artist.instagramUrl && <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-400">📷</a>}
                        {artist.websiteUrl && <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-green-400">🌐</a>}
                        {artist.socialMediaUrls.length > 0 && <span className="text-gray-400">+{artist.socialMediaUrls.length}</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {editingArtist === artist.id ? (
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
                              onClick={() => handleEditStart(artist)}
                              className="p-1 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                              title="Edit artist"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(artist.id)}
                              disabled={deleting === artist.id}
                              className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
                              title="Delete artist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/admin/artists/${artist.id}/songs`}
                              className="p-1 bg-purple-500 hover:bg-purple-600 rounded transition-colors"
                              title="View artist's songs"
                            >
                              <Music className="w-4 h-4" />
                            </Link>
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

        {filteredArtists.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No artists found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}