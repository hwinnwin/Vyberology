/**
 * Player state and control types - inspired by Spotube's audio_player
 * @see spotube-clone/lib/services/audio_player/audio_player.dart
 * @see spotube-clone/lib/provider/audio_player/state.dart
 */

import type { SourcedTrack, Track } from './track.js';

export type PlaybackState =
  | 'idle'
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'completed'
  | 'error';

export type LoopMode =
  | 'off'
  | 'one'
  | 'all';

export interface PlayerState {
  /** Current playback state */
  state: PlaybackState;

  /** Currently playing track */
  currentTrack: SourcedTrack | null;

  /** Current position in milliseconds */
  position: number;

  /** Duration of current track in milliseconds */
  duration: number;

  /** Buffered position in milliseconds */
  buffered: number;

  /** Volume level (0-1) */
  volume: number;

  /** Whether audio is muted */
  muted: boolean;

  /** Playback rate (0.5 - 2.0) */
  playbackRate: number;

  /** Loop mode */
  loopMode: LoopMode;

  /** Whether shuffle is enabled */
  shuffled: boolean;

  /** Error message if state is 'error' */
  error?: string;
}

export interface QueueState {
  /** All tracks in queue (includes history and upcoming) */
  tracks: SourcedTrack[];

  /** Current track index in queue */
  currentIndex: number;

  /** Original order before shuffle */
  originalOrder: SourcedTrack[];
}

export interface IPlayerControls {
  // Playback
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  toggle(): void;

  // Seeking
  seek(positionMs: number): void;
  seekRelative(deltaMs: number): void;

  // Volume
  setVolume(volume: number): void;
  mute(): void;
  unmute(): void;
  toggleMute(): void;

  // Queue navigation
  next(): Promise<void>;
  previous(): Promise<void>;
  skipTo(index: number): Promise<void>;

  // Queue management
  addToQueue(tracks: Track | Track[]): void;
  removeFromQueue(index: number): void;
  clearQueue(): void;
  moveInQueue(fromIndex: number, toIndex: number): void;

  // Playback modes
  setLoopMode(mode: LoopMode): void;
  toggleShuffle(): void;
  setPlaybackRate(rate: number): void;

  // Direct play
  playTrack(track: Track): Promise<void>;
  playTracks(tracks: Track[], startIndex?: number): Promise<void>;
  playPlaylist(playlistId: string, startIndex?: number): Promise<void>;
}

export interface PlayerEvents {
  onStateChange: (state: PlaybackState) => void;
  onTrackChange: (track: SourcedTrack | null) => void;
  onPositionChange: (position: number) => void;
  onDurationChange: (duration: number) => void;
  onVolumeChange: (volume: number) => void;
  onQueueChange: (queue: QueueState) => void;
  onError: (error: Error) => void;
  onEnd: () => void;
}

export type PlayerEventType = keyof PlayerEvents;

export interface PlayerConfig {
  /** Initial volume (0-1) */
  initialVolume?: number;

  /** Whether to auto-play on load */
  autoPlay?: boolean;

  /** Preferred stream quality */
  preferredQuality?: 'low' | 'medium' | 'high' | 'lossless' | 'auto';

  /** Enable gapless playback */
  gapless?: boolean;

  /** Crossfade duration in ms (0 to disable) */
  crossfadeDuration?: number;

  /** Normalize audio volume */
  normalizeVolume?: boolean;

  /** Audio output device ID */
  outputDeviceId?: string;
}
