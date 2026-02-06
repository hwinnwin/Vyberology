/**
 * Lyrics provider - fetches synced lyrics for tracks
 * Inspired by Spotube's lyrics system
 * @see spotube-clone/lib/provider/lyrics/synced.dart
 */

import type { LyricData, SyncedLyric } from '../types/plugin.js';
import type { Track } from '../types/track.js';

export interface LyricsProviderConfig {
  /** LRCLIB API endpoint */
  lrclibEndpoint?: string;

  /** Cache lyrics in memory */
  enableCache?: boolean;
}

const DEFAULT_LRCLIB_ENDPOINT = 'https://lrclib.net/api';

/**
 * Lyrics provider using LRCLIB (same as Spotube)
 * LRCLIB is a free, open API for synced lyrics
 */
export class LyricsProvider {
  private config: LyricsProviderConfig;
  private cache: Map<string, LyricData> = new Map();
  private endpoint: string;

  constructor(config: LyricsProviderConfig = {}) {
    this.config = {
      enableCache: true,
      ...config,
    };
    this.endpoint = config.lrclibEndpoint || DEFAULT_LRCLIB_ENDPOINT;
  }

  /**
   * Get lyrics for a track
   */
  async getLyrics(track: Track): Promise<LyricData | null> {
    const cacheKey = this.getCacheKey(track);

    // Check cache
    if (this.config.enableCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const lyrics = await this.fetchLyrics(track);

      if (lyrics && this.config.enableCache) {
        this.cache.set(cacheKey, lyrics);
      }

      return lyrics;
    } catch (error) {
      console.error('[LyricsProvider] Error fetching lyrics:', error);
      return null;
    }
  }

  /**
   * Search for lyrics
   */
  async searchLyrics(
    trackName: string,
    artistName: string
  ): Promise<LyricData[]> {
    try {
      const params = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
      });

      const response = await fetch(`${this.endpoint}/search?${params}`);

      if (!response.ok) {
        return [];
      }

      const results = await response.json();

      return results.map((result: LRCLibResult) =>
        this.parseLRCLibResult(result)
      );
    } catch (error) {
      console.error('[LyricsProvider] Search error:', error);
      return [];
    }
  }

  /**
   * Get lyrics by LRCLIB ID
   */
  async getLyricsById(id: number): Promise<LyricData | null> {
    try {
      const response = await fetch(`${this.endpoint}/get/${id}`);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return this.parseLRCLibResult(result);
    } catch (error) {
      console.error('[LyricsProvider] Get by ID error:', error);
      return null;
    }
  }

  /**
   * Clear lyrics cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Parse LRC format string to synced lyrics
   */
  parseLRC(lrc: string): SyncedLyric[] {
    const lines = lrc.split('\n');
    const lyrics: SyncedLyric[] = [];

    // LRC format: [mm:ss.xx] Lyrics text
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

    for (const line of lines) {
      const matches = [...line.matchAll(timeRegex)];

      if (matches.length === 0) continue;

      // Get text after all timestamps
      const text = line.replace(timeRegex, '').trim();

      if (!text) continue;

      // Each timestamp creates a lyric entry
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centiseconds = parseInt(match[3].padEnd(3, '0'), 10);

        const time = minutes * 60000 + seconds * 1000 + centiseconds;

        lyrics.push({ time, text });
      }
    }

    // Sort by time
    return lyrics.sort((a, b) => a.time - b.time);
  }

  private async fetchLyrics(track: Track): Promise<LyricData | null> {
    const artistName = track.artists[0]?.name || '';
    const trackName = track.name;
    const albumName = track.album?.name || '';
    const duration = Math.round(track.durationMs / 1000);

    // Try exact match first
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
      album_name: albumName,
      duration: duration.toString(),
    });

    const response = await fetch(`${this.endpoint}/get?${params}`);

    if (response.ok) {
      const result = await response.json();
      return this.parseLRCLibResult(result);
    }

    // Fallback to search
    const searchResults = await this.searchLyrics(trackName, artistName);
    return searchResults[0] || null;
  }

  private parseLRCLibResult(result: LRCLibResult): LyricData {
    const data: LyricData = {
      source: 'lrclib',
    };

    if (result.syncedLyrics) {
      data.syncedLyrics = this.parseLRC(result.syncedLyrics);
    }

    if (result.plainLyrics) {
      data.plainText = result.plainLyrics;
    }

    return data;
  }

  private getCacheKey(track: Track): string {
    return `${track.artists[0]?.name || ''}-${track.name}`.toLowerCase();
  }
}

interface LRCLibResult {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

/**
 * Utility: Format time for display (mm:ss)
 */
export function formatLyricTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Utility: Find current lyric line based on position
 */
export function getCurrentLyricIndex(
  lyrics: SyncedLyric[],
  positionMs: number
): number {
  if (lyrics.length === 0) return -1;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (lyrics[i].time <= positionMs) {
      return i;
    }
  }

  return -1;
}
