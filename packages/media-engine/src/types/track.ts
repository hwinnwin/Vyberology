/**
 * Core track types - inspired by Spotube's metadata models
 * @see spotube-clone/lib/models/metadata/metadata.dart
 */

export interface Artist {
  id: string;
  name: string;
  imageUrl?: string;
  genres?: string[];
}

export interface Album {
  id: string;
  name: string;
  artists: Artist[];
  imageUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album?: Album;
  durationMs: number;
  imageUrl?: string;
  previewUrl?: string;
  explicit?: boolean;
  popularity?: number;
  discNumber?: number;
  trackNumber?: number;
}

export interface SourcedTrack extends Track {
  sourceId: string;
  sourceType: AudioSourceType;
  streamUrl: string;
  codec?: string;
  bitrate?: number;
  quality?: StreamQuality;
}

export type AudioSourceType =
  | 'youtube'
  | 'local'
  | 'url'
  | 'jiosaavn'
  | 'piped'
  | 'custom';

export type StreamQuality =
  | 'low'      // ~96kbps
  | 'medium'   // ~160kbps
  | 'high'     // ~256kbps
  | 'lossless' // FLAC/WAV
  | 'auto';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tracks: Track[];
  owner?: {
    id: string;
    name: string;
  };
  isPublic?: boolean;
  collaborative?: boolean;
  totalTracks: number;
}

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}
