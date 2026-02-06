/**
 * Plugin system types - inspired by Spotube's plugin architecture
 * @see spotube-clone/lib/models/metadata/plugin.dart
 * @see spotube-clone/lib/provider/metadata_plugin/metadata_plugin_provider.dart
 */

import type { Album, Artist, Playlist, SearchResults, Track } from './track.js';

export type PluginAbility =
  | 'metadata'       // Provide track/album/artist metadata
  | 'audio-source'   // Resolve audio stream URLs
  | 'search'         // Search for tracks
  | 'authentication' // OAuth/auth support
  | 'scrobbling'     // Track play history (Last.fm, ListenBrainz)
  | 'lyrics'         // Provide lyrics
  | 'recommendations'; // Suggest tracks

export type PluginStatus =
  | 'active'
  | 'inactive'
  | 'error'
  | 'loading';

export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  icon?: string;
  abilities: PluginAbility[];
  settings?: PluginSetting[];
}

export interface PluginSetting {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'secret';
  default?: string | number | boolean;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface AudioSource {
  url: string;
  mimeType?: string;
  codec?: string;
  bitrate?: number;
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  expiresAt?: number;
}

/**
 * Interface that plugins must implement
 */
export interface MediaPlugin {
  readonly config: PluginConfig;
  readonly status: PluginStatus;

  // Lifecycle
  initialize(): Promise<void>;
  dispose(): void;

  // Authentication (if ability includes 'authentication')
  authenticate?(): Promise<boolean>;
  logout?(): Promise<void>;
  isAuthenticated?(): boolean;

  // Metadata (if ability includes 'metadata')
  getTrack?(trackId: string): Promise<Track | null>;
  getAlbum?(albumId: string): Promise<Album | null>;
  getArtist?(artistId: string): Promise<Artist | null>;
  getPlaylist?(playlistId: string): Promise<Playlist | null>;

  // Search (if ability includes 'search')
  search?(query: string, limit?: number): Promise<SearchResults>;

  // Audio Source (if ability includes 'audio-source')
  resolveAudioSource?(track: Track): Promise<AudioSource | null>;

  // Scrobbling (if ability includes 'scrobbling')
  scrobble?(track: Track, timestamp: number): Promise<void>;
  updateNowPlaying?(track: Track): Promise<void>;

  // Lyrics (if ability includes 'lyrics')
  getLyrics?(track: Track): Promise<LyricData | null>;

  // Recommendations (if ability includes 'recommendations')
  getRecommendations?(seedTracks: Track[], limit?: number): Promise<Track[]>;
}

export interface LyricData {
  plainText?: string;
  syncedLyrics?: SyncedLyric[];
  source?: string;
  language?: string;
}

export interface SyncedLyric {
  time: number; // milliseconds
  text: string;
  endTime?: number;
}

export interface PluginManager {
  readonly plugins: Map<string, MediaPlugin>;
  readonly activeMetadataPlugin: MediaPlugin | null;
  readonly activeAudioSourcePlugin: MediaPlugin | null;

  register(plugin: MediaPlugin): void;
  unregister(pluginId: string): void;
  activate(pluginId: string): Promise<void>;
  deactivate(pluginId: string): void;

  setMetadataPlugin(pluginId: string): void;
  setAudioSourcePlugin(pluginId: string): void;

  getPluginsByAbility(ability: PluginAbility): MediaPlugin[];
}
