/**
 * Local file audio source - handles local audio files
 * For desktop (Tauri) and mobile apps
 */

import type { SourcedTrack, Artist, Album } from '../types/track.js';

export interface LocalTrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  genre?: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

export interface LocalFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  lastModified: number;
}

/**
 * Supported audio formats
 */
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',      // MP3
  'audio/mp4',       // M4A, AAC
  'audio/ogg',       // OGG Vorbis
  'audio/flac',      // FLAC
  'audio/wav',       // WAV
  'audio/webm',      // WebM Audio
  'audio/aac',       // AAC
  'audio/x-m4a',     // M4A
] as const;

export const AUDIO_EXTENSIONS = [
  '.mp3',
  '.m4a',
  '.aac',
  '.ogg',
  '.flac',
  '.wav',
  '.webm',
  '.opus',
] as const;

/**
 * Local file source for handling local audio files
 */
export class LocalSource {
  private libraryPaths: string[] = [];
  private cachedTracks: Map<string, SourcedTrack> = new Map();

  /**
   * Add a library path to scan
   */
  addLibraryPath(path: string): void {
    if (!this.libraryPaths.includes(path)) {
      this.libraryPaths.push(path);
    }
  }

  /**
   * Remove a library path
   */
  removeLibraryPath(path: string): void {
    this.libraryPaths = this.libraryPaths.filter((p) => p !== path);
  }

  /**
   * Get all library paths
   */
  getLibraryPaths(): string[] {
    return [...this.libraryPaths];
  }

  /**
   * Check if file is a supported audio format
   */
  isAudioFile(filename: string): boolean {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    return AUDIO_EXTENSIONS.includes(ext as typeof AUDIO_EXTENSIONS[number]);
  }

  /**
   * Convert a local file to a SourcedTrack
   * In browser context, this works with File API
   * In Tauri/native context, this would use file system APIs
   */
  fileToTrack(file: File | LocalFile, metadata?: LocalTrackMetadata): SourcedTrack {
    const isFileApi = file instanceof File;
    const filename = isFileApi ? file.name : file.name;
    const path = isFileApi ? URL.createObjectURL(file) : file.path;

    // Parse filename for fallback metadata
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    const [artistFromName, titleFromName] = this.parseFilename(nameWithoutExt);

    const artist: Artist = {
      id: `local-artist-${metadata?.artist || artistFromName}`,
      name: metadata?.artist || artistFromName || 'Unknown Artist',
    };

    const album: Album | undefined = metadata?.album
      ? {
          id: `local-album-${metadata.album}`,
          name: metadata.album,
          artists: [artist],
        }
      : undefined;

    const track: SourcedTrack = {
      id: `local-${path}`,
      name: metadata?.title || titleFromName || nameWithoutExt,
      artists: [artist],
      album,
      durationMs: (metadata?.duration || 0) * 1000,
      trackNumber: metadata?.trackNumber,
      discNumber: metadata?.discNumber,
      sourceId: path,
      sourceType: 'local',
      streamUrl: path,
    };

    // Cache for later retrieval
    this.cachedTracks.set(track.id, track);

    return track;
  }

  /**
   * Create tracks from File API files (drag & drop, file picker)
   */
  async createTracksFromFiles(files: FileList | File[]): Promise<SourcedTrack[]> {
    const tracks: SourcedTrack[] = [];

    for (const file of Array.from(files)) {
      if (this.isAudioFile(file.name)) {
        const track = this.fileToTrack(file);
        tracks.push(track);
      }
    }

    return tracks;
  }

  /**
   * Get track by ID (from cache)
   */
  getTrack(trackId: string): SourcedTrack | undefined {
    return this.cachedTracks.get(trackId);
  }

  /**
   * Get all cached local tracks
   */
  getAllTracks(): SourcedTrack[] {
    return Array.from(this.cachedTracks.values());
  }

  /**
   * Clear cached tracks
   */
  clearCache(): void {
    // Revoke object URLs to free memory
    for (const track of this.cachedTracks.values()) {
      if (track.streamUrl.startsWith('blob:')) {
        URL.revokeObjectURL(track.streamUrl);
      }
    }
    this.cachedTracks.clear();
  }

  /**
   * Parse filename to extract artist and title
   * Common formats: "Artist - Title", "01 - Title", "Title"
   */
  private parseFilename(filename: string): [string | undefined, string | undefined] {
    // Try "Artist - Title" format
    const dashMatch = filename.match(/^(.+?)\s*-\s*(.+)$/);
    if (dashMatch) {
      const [, part1, part2] = dashMatch;

      // Check if part1 is just a track number
      if (/^\d+$/.test(part1.trim())) {
        return [undefined, part2.trim()];
      }

      return [part1.trim(), part2.trim()];
    }

    // Try "01 Title" format (track number prefix)
    const numberMatch = filename.match(/^\d+\s+(.+)$/);
    if (numberMatch) {
      return [undefined, numberMatch[1].trim()];
    }

    // Just the title
    return [undefined, filename];
  }
}

/**
 * Create a file input for selecting audio files
 */
export function createFileInput(options: {
  multiple?: boolean;
  onChange: (files: FileList) => void;
}): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = AUDIO_EXTENSIONS.join(',');
  input.multiple = options.multiple ?? true;

  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0) {
      options.onChange(input.files);
    }
  });

  return input;
}

/**
 * Open file picker dialog
 */
export function openFilePicker(options?: {
  multiple?: boolean;
}): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = createFileInput({
      multiple: options?.multiple ?? true,
      onChange: (files) => resolve(files),
    });

    // Handle cancel
    const handleFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          resolve(null);
        }
        window.removeEventListener('focus', handleFocus);
      }, 300);
    };

    window.addEventListener('focus', handleFocus);
    input.click();
  });
}
