/**
 * Native Audio Adapter for React Native (Expo)
 * Uses expo-av for audio playback on iOS/Android
 *
 * This adapter provides the same interface as the web Howler.js player
 * but uses expo-av under the hood for native mobile support.
 */

import { EventEmitter } from 'eventemitter3';
import type { PlaybackState, LoopMode, PlayerConfig } from '../types/player.js';
import type { SourcedTrack, Track } from '../types/track.js';

// Types for expo-av (will be provided at runtime)
interface ExpoAVSound {
  playAsync(): Promise<void>;
  pauseAsync(): Promise<void>;
  stopAsync(): Promise<void>;
  unloadAsync(): Promise<void>;
  setPositionAsync(positionMillis: number): Promise<void>;
  setVolumeAsync(volume: number): Promise<void>;
  setIsLoopingAsync(isLooping: boolean): Promise<void>;
  setRateAsync(rate: number, shouldCorrectPitch?: boolean): Promise<void>;
  getStatusAsync(): Promise<ExpoAVPlaybackStatus>;
  setOnPlaybackStatusUpdate(callback: (status: ExpoAVPlaybackStatus) => void): void;
}

interface ExpoAVPlaybackStatus {
  isLoaded: boolean;
  isPlaying?: boolean;
  isBuffering?: boolean;
  positionMillis?: number;
  durationMillis?: number;
  didJustFinish?: boolean;
  error?: string;
}

interface ExpoAVAudio {
  Sound: {
    createAsync(
      source: { uri: string } | number,
      initialStatus?: object,
      onPlaybackStatusUpdate?: (status: ExpoAVPlaybackStatus) => void
    ): Promise<{ sound: ExpoAVSound; status: ExpoAVPlaybackStatus }>;
  };
  setAudioModeAsync(mode: object): Promise<void>;
}

export interface NativeAudioEvents {
  stateChange: (state: PlaybackState) => void;
  trackChange: (track: SourcedTrack | null) => void;
  positionChange: (position: number) => void;
  durationChange: (duration: number) => void;
  volumeChange: (volume: number) => void;
  error: (error: Error) => void;
  end: () => void;
}

const DEFAULT_CONFIG: Required<PlayerConfig> = {
  initialVolume: 0.8,
  autoPlay: true,
  preferredQuality: 'high',
  gapless: false,
  crossfadeDuration: 0,
  normalizeVolume: false,
  outputDeviceId: 'default',
};

/**
 * Native Audio Player for React Native using expo-av
 */
export class NativeAudioPlayer {
  private sound: ExpoAVSound | null = null;
  private Audio: ExpoAVAudio | null = null;
  private emitter = new EventEmitter<NativeAudioEvents>();
  private config: Required<PlayerConfig>;
  private positionInterval: ReturnType<typeof setInterval> | null = null;

  // Player state
  private _state: PlaybackState = 'idle';
  private _currentTrack: SourcedTrack | null = null;
  private _position = 0;
  private _duration = 0;
  private _volume: number;
  private _muted = false;
  private _loopMode: LoopMode = 'off';
  private _playbackRate = 1;

  // Queue state
  private _queue: SourcedTrack[] = [];
  private _currentIndex = -1;
  private _originalOrder: SourcedTrack[] = [];
  private _shuffled = false;

  constructor(config: PlayerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._volume = this.config.initialVolume;
  }

  /**
   * Initialize the audio system (must be called with expo-av Audio module)
   */
  async initialize(Audio: ExpoAVAudio): Promise<void> {
    this.Audio = Audio;

    // Configure audio mode for background playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Event handling
  // ─────────────────────────────────────────────────────────────────

  on<K extends keyof NativeAudioEvents>(event: K, listener: NativeAudioEvents[K]): void {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
  }

  off<K extends keyof NativeAudioEvents>(event: K, listener: NativeAudioEvents[K]): void {
    this.emitter.off(event, listener as (...args: unknown[]) => void);
  }

  private emit<K extends keyof NativeAudioEvents>(
    event: K,
    ...args: Parameters<NativeAudioEvents[K]>
  ): void {
    (this.emitter.emit as (event: K, ...args: unknown[]) => void)(event, ...args);
  }

  // ─────────────────────────────────────────────────────────────────
  // State getters
  // ─────────────────────────────────────────────────────────────────

  get state(): PlaybackState {
    return this._state;
  }

  get currentTrack(): SourcedTrack | null {
    return this._currentTrack;
  }

  get position(): number {
    return this._position;
  }

  get duration(): number {
    return this._duration;
  }

  get volume(): number {
    return this._muted ? 0 : this._volume;
  }

  get muted(): boolean {
    return this._muted;
  }

  get loopMode(): LoopMode {
    return this._loopMode;
  }

  get shuffled(): boolean {
    return this._shuffled;
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  get queue(): SourcedTrack[] {
    return [...this._queue];
  }

  get currentIndex(): number {
    return this._currentIndex;
  }

  // ─────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────

  private setState(state: PlaybackState): void {
    if (this._state !== state) {
      this._state = state;
      this.emit('stateChange', state);
    }
  }

  private startPositionTracking(): void {
    this.stopPositionTracking();
    this.positionInterval = setInterval(async () => {
      if (this.sound && this._state === 'playing') {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && status.positionMillis !== undefined) {
          this._position = status.positionMillis;
          this.emit('positionChange', this._position);
        }
      }
    }, 250);
  }

  private stopPositionTracking(): void {
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  private handlePlaybackStatusUpdate = (status: ExpoAVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if (status.error) {
        this.setState('error');
        this.emit('error', new Error(status.error));
      }
      return;
    }

    // Update duration if available
    if (status.durationMillis && status.durationMillis !== this._duration) {
      this._duration = status.durationMillis;
      this.emit('durationChange', this._duration);
    }

    // Update position
    if (status.positionMillis !== undefined) {
      this._position = status.positionMillis;
    }

    // Handle track end
    if (status.didJustFinish) {
      this.handleTrackEnd();
    }

    // Update state based on playback status
    if (status.isBuffering) {
      this.setState('buffering');
    } else if (status.isPlaying) {
      this.setState('playing');
    }
  };

  private async handleTrackEnd(): Promise<void> {
    this.emit('end');

    // Handle loop mode
    if (this._loopMode === 'one') {
      await this.seek(0);
      await this.play();
      return;
    }

    // Check if there's a next track
    if (this._currentIndex < this._queue.length - 1) {
      await this.next();
    } else if (this._loopMode === 'all' && this._queue.length > 0) {
      // Loop back to start
      await this.skipTo(0);
    } else {
      this.setState('completed');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Playback controls
  // ─────────────────────────────────────────────────────────────────

  async play(): Promise<void> {
    if (!this.sound) return;

    try {
      await this.sound.playAsync();
      this.setState('playing');
      this.startPositionTracking();
    } catch (error) {
      this.setState('error');
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async pause(): Promise<void> {
    if (!this.sound) return;

    try {
      await this.sound.pauseAsync();
      this.setState('paused');
      this.stopPositionTracking();
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async toggle(): Promise<void> {
    if (this._state === 'playing') {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.stopPositionTracking();
    this._position = 0;
    this.setState('stopped');
  }

  async seek(positionMs: number): Promise<void> {
    if (!this.sound) return;

    try {
      await this.sound.setPositionAsync(positionMs);
      this._position = positionMs;
      this.emit('positionChange', positionMs);
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Volume controls
  // ─────────────────────────────────────────────────────────────────

  async setVolume(volume: number): Promise<void> {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this.sound && !this._muted) {
      await this.sound.setVolumeAsync(this._volume);
    }
    this.emit('volumeChange', this._volume);
  }

  async mute(): Promise<void> {
    this._muted = true;
    if (this.sound) {
      await this.sound.setVolumeAsync(0);
    }
    this.emit('volumeChange', 0);
  }

  async unmute(): Promise<void> {
    this._muted = false;
    if (this.sound) {
      await this.sound.setVolumeAsync(this._volume);
    }
    this.emit('volumeChange', this._volume);
  }

  async toggleMute(): Promise<void> {
    if (this._muted) {
      await this.unmute();
    } else {
      await this.mute();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Playback modes
  // ─────────────────────────────────────────────────────────────────

  async setLoopMode(mode: LoopMode): Promise<void> {
    this._loopMode = mode;
    if (this.sound) {
      await this.sound.setIsLoopingAsync(mode === 'one');
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    this._playbackRate = Math.max(0.5, Math.min(2, rate));
    if (this.sound) {
      await this.sound.setRateAsync(this._playbackRate, true);
    }
  }

  toggleShuffle(): void {
    this._shuffled = !this._shuffled;

    if (this._shuffled) {
      // Save original order and shuffle
      this._originalOrder = [...this._queue];
      const currentTrack = this._queue[this._currentIndex];

      // Fisher-Yates shuffle
      for (let i = this._queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this._queue[i], this._queue[j]] = [this._queue[j], this._queue[i]];
      }

      // Move current track to front
      if (currentTrack) {
        const idx = this._queue.indexOf(currentTrack);
        if (idx > 0) {
          this._queue.splice(idx, 1);
          this._queue.unshift(currentTrack);
        }
        this._currentIndex = 0;
      }
    } else {
      // Restore original order
      const currentTrack = this._queue[this._currentIndex];
      this._queue = [...this._originalOrder];
      if (currentTrack) {
        this._currentIndex = this._queue.indexOf(currentTrack);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Queue navigation
  // ─────────────────────────────────────────────────────────────────

  async next(): Promise<void> {
    if (this._currentIndex < this._queue.length - 1) {
      await this.skipTo(this._currentIndex + 1);
    } else if (this._loopMode === 'all') {
      await this.skipTo(0);
    }
  }

  async previous(): Promise<void> {
    // If more than 3 seconds in, restart current track
    if (this._position > 3000) {
      await this.seek(0);
      return;
    }

    if (this._currentIndex > 0) {
      await this.skipTo(this._currentIndex - 1);
    } else if (this._loopMode === 'all') {
      await this.skipTo(this._queue.length - 1);
    }
  }

  async skipTo(index: number): Promise<void> {
    if (index < 0 || index >= this._queue.length) return;

    this._currentIndex = index;
    const track = this._queue[index];
    await this.loadTrack(track);
  }

  // ─────────────────────────────────────────────────────────────────
  // Track loading
  // ─────────────────────────────────────────────────────────────────

  private async loadTrack(track: SourcedTrack): Promise<void> {
    if (!this.Audio) {
      throw new Error('Audio not initialized. Call initialize() with expo-av Audio first.');
    }

    // Unload previous sound
    if (this.sound) {
      this.stopPositionTracking();
      await this.sound.unloadAsync();
      this.sound = null;
    }

    this._currentTrack = track;
    this.emit('trackChange', track);
    this.setState('loading');

    try {
      const { sound, status } = await this.Audio.Sound.createAsync(
        { uri: track.streamUrl },
        {
          shouldPlay: this.config.autoPlay,
          volume: this._muted ? 0 : this._volume,
          rate: this._playbackRate,
          isLooping: this._loopMode === 'one',
        },
        this.handlePlaybackStatusUpdate
      );

      this.sound = sound;

      if (status.isLoaded && status.durationMillis) {
        this._duration = status.durationMillis;
        this.emit('durationChange', this._duration);
      }

      if (this.config.autoPlay) {
        this.setState('playing');
        this.startPositionTracking();
      } else {
        this.setState('paused');
      }
    } catch (error) {
      this.setState('error');
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Queue management
  // ─────────────────────────────────────────────────────────────────

  async playTrack(track: Track): Promise<void> {
    const sourcedTrack = track as SourcedTrack;
    this._queue = [sourcedTrack];
    this._originalOrder = [sourcedTrack];
    this._currentIndex = 0;
    await this.loadTrack(sourcedTrack);
  }

  async playTracks(tracks: Track[], startIndex = 0): Promise<void> {
    const sourcedTracks = tracks as SourcedTrack[];
    this._queue = [...sourcedTracks];
    this._originalOrder = [...sourcedTracks];
    this._currentIndex = startIndex;

    if (this._shuffled) {
      this.toggleShuffle();
      this.toggleShuffle();
    }

    if (sourcedTracks[startIndex]) {
      await this.loadTrack(sourcedTracks[startIndex]);
    }
  }

  addToQueue(tracks: Track | Track[]): void {
    const toAdd = Array.isArray(tracks) ? tracks : [tracks];
    this._queue.push(...(toAdd as SourcedTrack[]));
    this._originalOrder.push(...(toAdd as SourcedTrack[]));
  }

  removeFromQueue(index: number): void {
    if (index < 0 || index >= this._queue.length) return;

    const track = this._queue[index];
    this._queue.splice(index, 1);

    const origIdx = this._originalOrder.indexOf(track);
    if (origIdx !== -1) {
      this._originalOrder.splice(origIdx, 1);
    }

    if (index < this._currentIndex) {
      this._currentIndex--;
    } else if (index === this._currentIndex) {
      if (this._queue.length > 0) {
        this._currentIndex = Math.min(this._currentIndex, this._queue.length - 1);
        this.loadTrack(this._queue[this._currentIndex]);
      } else {
        this.stop();
      }
    }
  }

  clearQueue(): void {
    this._queue = [];
    this._originalOrder = [];
    this._currentIndex = -1;
    this.stop();
  }

  // ─────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────

  async dispose(): Promise<void> {
    this.stopPositionTracking();
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.emitter.removeAllListeners();
  }
}
