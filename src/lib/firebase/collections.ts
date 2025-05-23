// src/lib/firebase/collections.ts
// Collection names for Firestore

/**
 * Firebase collection names used across the bndy platform
 * These should match the collection names used in other repositories
 */
export const COLLECTIONS = {
  // Main collections
  USERS: 'bndy_users',
  ARTISTS: 'bndy_artists',
  VENUES: 'bndy_venues',
  STUDIOS: 'bndy_studios',          // Added for future use
  PUBLIC_EVENTS: 'bndy_public_events', // Added for optimized public events
  SONGS: 'bndy_songs',              // Base songs collection
 
  
  // Legacy collection name (for backward compatibility during migration)
  EVENTS: 'bndy_events',            // Will be replaced by subcollections
  
  // Subcollections
  USER_EVENTS: 'events',            // Subcollection under users
  ARTIST_EVENTS: 'events',          // Subcollection under artists
  VENUE_EVENTS: 'events',           // Subcollection under venues
  STUDIO_EVENTS: 'events',          // Subcollection under studios
  
  // Artist-specific subcollections
  ARTIST_SONGS: 'songs',            // Artist-specific song versions
  ARTIST_SETLISTS: 'setlists',      // Artist-specific setlists
  ARTIST_INVITES: 'invites',        // Artist membership invitations
  
  MEMBERS: 'members',               // Subcollection for entity members
};
