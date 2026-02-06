/**
 * YouTube audio source - extracts audio streams from YouTube
 * Inspired by Spotube's youtube_engine implementations
 * @see spotube-clone/lib/services/youtube_engine/
 *
 * Note: For production use, consider using a backend proxy
 * to handle YouTube extraction and avoid CORS issues
 */

import type { AudioSource } from '../types/plugin.js';
import type { Track } from '../types/track.js';

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
}

export interface YouTubeStreamInfo {
  videoId: string;
  title: string;
  streams: YouTubeStream[];
}

export interface YouTubeStream {
  url: string;
  mimeType: string;
  bitrate: number;
  audioQuality?: 'AUDIO_QUALITY_LOW' | 'AUDIO_QUALITY_MEDIUM' | 'AUDIO_QUALITY_HIGH';
  itag: number;
}

/**
 * YouTube source configuration
 */
export interface YouTubeSourceConfig {
  /** API endpoint for YouTube extraction (backend proxy) */
  apiEndpoint?: string;

  /** Piped instance URL for privacy-friendly extraction */
  pipedInstance?: string;

  /** Invidious instance URL (alternative) */
  invidiousInstance?: string;

  /** Preferred audio quality */
  preferredQuality?: 'low' | 'medium' | 'high';
}

const DEFAULT_PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
  'https://api.piped.yt',
];

/**
 * YouTube audio source using Piped API (privacy-friendly)
 * Piped is the same backend that Spotube uses
 */
export class YouTubeSource {
  private config: YouTubeSourceConfig;
  private pipedInstance: string;

  constructor(config: YouTubeSourceConfig = {}) {
    this.config = config;
    this.pipedInstance =
      config.pipedInstance || DEFAULT_PIPED_INSTANCES[0];
  }

  /**
   * Search YouTube for tracks matching query
   */
  async search(query: string, limit = 10): Promise<YouTubeSearchResult[]> {
    try {
      const response = await fetch(
        `${this.pipedInstance}/search?q=${encodeURIComponent(query)}&filter=music_songs`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      return (data.items || [])
        .filter((item: { type: string }) => item.type === 'stream')
        .slice(0, limit)
        .map((item: {
          url: string;
          title: string;
          uploaderName: string;
          duration: number;
          thumbnail: string;
        }) => ({
          videoId: this.extractVideoId(item.url),
          title: item.title,
          artist: item.uploaderName,
          duration: item.duration * 1000, // Convert to ms
          thumbnail: item.thumbnail,
        }));
    } catch (error) {
      console.error('[YouTubeSource] Search error:', error);
      return [];
    }
  }

  /**
   * Find best YouTube match for a track
   */
  async matchTrack(track: Track): Promise<YouTubeSearchResult | null> {
    const query = `${track.artists.map((a) => a.name).join(' ')} ${track.name}`;
    const results = await this.search(query, 5);

    if (results.length === 0) return null;

    // Simple matching: find closest duration match
    const trackDuration = track.durationMs;
    const sorted = results.sort((a, b) => {
      const diffA = Math.abs(a.duration - trackDuration);
      const diffB = Math.abs(b.duration - trackDuration);
      return diffA - diffB;
    });

    // Only accept if duration is within 5 seconds
    const best = sorted[0];
    if (Math.abs(best.duration - trackDuration) < 5000) {
      return best;
    }

    // Fallback to first result
    return results[0];
  }

  /**
   * Get audio stream URL for a video
   */
  async getAudioSource(videoId: string): Promise<AudioSource | null> {
    try {
      const response = await fetch(
        `${this.pipedInstance}/streams/${videoId}`
      );

      if (!response.ok) {
        throw new Error(`Stream fetch failed: ${response.status}`);
      }

      const data = await response.json();

      // Get audio streams
      const audioStreams = data.audioStreams || [];

      if (audioStreams.length === 0) {
        return null;
      }

      // Sort by bitrate (highest first) and pick based on preference
      const sorted = audioStreams.sort(
        (a: { bitrate: number }, b: { bitrate: number }) => b.bitrate - a.bitrate
      );

      let stream: { url: string; mimeType: string; bitrate: number };

      switch (this.config.preferredQuality) {
        case 'low':
          stream = sorted[sorted.length - 1];
          break;
        case 'medium':
          stream = sorted[Math.floor(sorted.length / 2)];
          break;
        case 'high':
        default:
          stream = sorted[0];
          break;
      }

      return {
        url: stream.url,
        mimeType: stream.mimeType,
        bitrate: stream.bitrate,
        quality: this.bitrateToQuality(stream.bitrate),
      };
    } catch (error) {
      console.error('[YouTubeSource] Stream error:', error);
      return null;
    }
  }

  /**
   * Resolve track to audio source
   */
  async resolveTrack(track: Track): Promise<AudioSource | null> {
    const match = await this.matchTrack(track);
    if (!match) return null;

    return this.getAudioSource(match.videoId);
  }

  private extractVideoId(url: string): string {
    // Handle /watch?v=ID format
    const match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];

    // Handle /shorts/ID or direct /ID format
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  private bitrateToQuality(bitrate: number): 'low' | 'medium' | 'high' {
    if (bitrate >= 256000) return 'high';
    if (bitrate >= 128000) return 'medium';
    return 'low';
  }

  /**
   * Set Piped instance (for fallback/selection)
   */
  setPipedInstance(instance: string): void {
    this.pipedInstance = instance;
  }

  /**
   * Get available Piped instances
   */
  static getDefaultInstances(): string[] {
    return [...DEFAULT_PIPED_INSTANCES];
  }
}
