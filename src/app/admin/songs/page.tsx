'use client';

import React, { useState, useEffect } from 'react';
import { Music, CheckCircle, AlertCircle, RefreshCw, Edit, Trash2, Save, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { AdminNav } from '../components/AdminNav';
import { getAllSongs, updateSong, deleteSong, formatDuration, type Song } from '../../../lib/services/admin-service';

export default function SongsAdmin() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'featured' | 'has-streaming' | 'has-audio' | 'has-genre'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSong, setEditingSong] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Song | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSongs();
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (song: Song) => {
    setEditingSong(song.id);
    setEditForm({ ...song });
  };

  const handleEditCancel = () => {
    setEditingSong(null);
    setEditForm(null);
  };

  const handleEditSave = async () => {
    if (!editForm) return;

    try {
      const updatedSong = await updateSong(editForm.id, editForm);
      setSongs(songs.map(s => s.id === editForm.id ? updatedSong : s));
      setEditingSong(null);
      setEditForm(null);
    } catch (err) {
      console.error('Failed to save song:', err);
      setError(err instanceof Error ? err.message : 'Failed to save song');
    }
  };

  const handleDelete = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song?')) return;

    setDeleting(songId);
    try {
      await deleteSong(songId);
      setSongs(songs.filter(s => s.id !== songId));
    } catch (err) {
      console.error('Failed to delete song:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete song');
    } finally {
      setDeleting(null);
    }
  };


  useEffect(() => {
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (song.album && song.album.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'featured') return song.isFeatured;
    if (filter === 'has-streaming') return song.spotifyUrl || song.appleMusicUrl || song.youtubeUrl;
    if (filter === 'has-audio') return !!song.audioFileUrl;
    if (filter === 'has-genre') return !!song.genre;
    return true;
  });

  const stats = {
    total: songs.length,
    featured: songs.filter(s => s.isFeatured).length,
    hasStreaming: songs.filter(s => s.spotifyUrl || s.appleMusicUrl || s.youtubeUrl).length,
    hasAudio: songs.filter(s => s.audioFileUrl).length,
    hasGenre: songs.filter(s => s.genre).length,
    hasDuration: songs.filter(s => s.duration).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading songs from API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Songs</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchSongs}
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
              <h1 className="text-3xl font-bold text-white">BNDY Songs Admin</h1>
              <p className="text-gray-300 mt-1">Manage song library from AWS PostgreSQL API</p>
            </div>
            <button
              onClick={fetchSongs}
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
              <Music className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-gray-400">Total Songs</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.featured}</p>
                <p className="text-gray-400">Featured</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 rounded mr-3 flex items-center justify-center">
                <span className="text-white font-bold">🎵</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hasStreaming}</p>
                <p className="text-gray-400">Has Streaming</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-500 rounded mr-3 flex items-center justify-center">
                <span className="text-white font-bold">🎧</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hasAudio}</p>
                <p className="text-gray-400">Has Audio</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-500 rounded mr-3 flex items-center justify-center">
                <span className="text-white font-bold">🏷️</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hasGenre}</p>
                <p className="text-gray-400">Has Genre</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-cyan-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.hasDuration}</p>
                <p className="text-gray-400">Has Duration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search songs by title, artist, genre, or album..."
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
              onClick={() => setFilter('featured')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'featured'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Featured ({stats.featured})
            </button>
            <button
              onClick={() => setFilter('has-streaming')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'has-streaming'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Streaming ({stats.hasStreaming})
            </button>
            <button
              onClick={() => setFilter('has-audio')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'has-audio'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Audio ({stats.hasAudio})
            </button>
            <button
              onClick={() => setFilter('has-genre')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'has-genre'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Genre ({stats.hasGenre})
            </button>
          </div>
        </div>

        {/* Songs Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Song
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Streaming
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {filteredSongs.map(song => (
                  <tr key={song.id} className="hover:bg-slate-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {song.isFeatured ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                        {song.audioFileUrl && <span className="text-indigo-400" title="Has audio file">🎧</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {editingSong === song.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm?.title || ''}
                            onChange={(e) => setEditForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                            placeholder="Song title"
                          />
                          <input
                            type="text"
                            value={editForm?.album || ''}
                            onChange={(e) => setEditForm(prev => prev ? { ...prev, album: e.target.value } : null)}
                            className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                            placeholder="Album"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-white">{song.title}</div>
                          {song.album && <div className="text-gray-400 text-sm">{song.album}</div>}
                          <div className="text-gray-500 text-xs">
                            {formatDuration(song.duration)}
                            {song.releaseDate && ` • ${new Date(song.releaseDate).getFullYear()}`}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingSong === song.id ? (
                        <input
                          type="text"
                          value={editForm?.artistName || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, artistName: e.target.value } : null)}
                          className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                          placeholder="Artist name"
                        />
                      ) : (
                        <div className="text-gray-300">{song.artistName}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingSong === song.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm?.genre || ''}
                            onChange={(e) => setEditForm(prev => prev ? { ...prev, genre: e.target.value } : null)}
                            className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                            placeholder="Genre"
                          />
                          <input
                            type="text"
                            value={editForm?.tags.join(', ') || ''}
                            onChange={(e) => setEditForm(prev => prev ? {
                              ...prev,
                              tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                            } : null)}
                            className="w-full bg-slate-700 text-white px-3 py-1 rounded border border-slate-600"
                            placeholder="Tags (comma separated)"
                          />
                        </div>
                      ) : (
                        <div>
                          {song.genre && (
                            <span className="bg-slate-600 text-xs px-2 py-1 rounded mr-1">
                              {song.genre}
                            </span>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {song.tags.map(tag => (
                              <span key={tag} className="bg-slate-700 text-xs px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        {song.spotifyUrl && (
                          <a href={song.spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-green-400" title="Spotify">
                            🎵
                          </a>
                        )}
                        {song.appleMusicUrl && (
                          <a href={song.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400" title="Apple Music">
                            🍎
                          </a>
                        )}
                        {song.youtubeUrl && (
                          <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-red-400" title="YouTube">
                            📹
                          </a>
                        )}
                        {!song.spotifyUrl && !song.appleMusicUrl && !song.youtubeUrl && (
                          <span className="text-gray-500 text-xs">No streaming</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {editingSong === song.id ? (
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
                              onClick={() => handleEditStart(song)}
                              className="p-1 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                              title="Edit song"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(song.id)}
                              disabled={deleting === song.id}
                              className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
                              title="Delete song"
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

        {filteredSongs.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No songs found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}