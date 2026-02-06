/**
 * Core Audio Player - Cross-platform audio engine
 * Inspired by Spotube's audio_player service
 * @see spotube-clone/lib/services/audio_player/audio_player.dart
 *
 * Uses Howler.js for web audio playback with fallback to HTML5 Audio
 */

import { Howl, Howler } from 'howler';
import { EventEmitter } from 'eventemitter3';
import type {
  LoopMode,
  PlaybackState,
  PlayerConfig,
  IPlayerControls,
  PlayerState,
  QueueState,
} from '../types/player.js';
import type { SourcedTrack, Track } from '../types/track.js';

export interface AudioPlayerEvents {
  stateChange: (state: PlaybackState) => void;
  trackChange: (track: SourcedTrack | null) => void;
  positionChange: (position: number) => void;
  durationChange: (duration: number) => void;
  volumeChange: (volume: number) => void;
  queueChange: (queue: QueueState) => void;
  error: (error: Error) => void;
  end: () => void;
}

const DEFAULT_CONFIG: Required<PlayerConfig> = {
  initialVolume: 0.8,
  autoPlay: false,
  preferredQuality: 'high',
  gapless: true,
  crossfadeDuration: 0,
  normalizeVolume: false,
  outputDeviceId: 'default',
};

export class AudioPlayer implements IPlayerControls {
  private howl: Howl | null = null;
  private emitter = new EventEmitter<AudioPlayerEvents>();
  private config: Required<PlayerConfig>;
  private positionInterval: ReturnType<typeof setInterval> | null = null;

  // State
  private _state: PlaybackState = 'idle';
  private _currentTrack: SourcedTrack | null = null;
  private _position = 0;
  private _duration = 0;
  private _volume: number;
  private _muted = false;
  private _playbackRate = 1;
  private _loopMode: LoopMode = 'off';
  private _shuffled = false;

  // Queue
  private _queue: SourcedTrack[] = [];
  private _currentIndex = -1;
  private _originalOrder: SourcedTrack[] = [];

  constructor(config: PlayerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._volume = this.config.initialVolume;
    Howler.volume(this._volume);
  }

  // ─────────────────────────────────────────────────────────────────
  // State Getters
  // ─────────────────────────────────────────────────────────────────

  get state(): PlayerState {
    return {
      state: this._state,
      currentTrack: this._currentTrack,
      position: this._position,
      duration: this._duration,
      buffered: 0, // Howler doesn't expose buffered amount directly
      volume: this._volume,
      muted: this._muted,
      playbackRate: this._playbackRate,
      loopMode: this._loopMode,
      shuffled: this._shuffled,
    };
  }

  get queue(): QueueState {
    return {
      tracks: this._queue,
      currentIndex: this._currentIndex,
      originalOrder: this._originalOrder,
    };
  }

  get currentTrack(): SourcedTrack | null {
    return this._currentTrack;
  }

  // ─────────────────────────────────────────────────────────────────
  // Event Handling
  // ─────────────────────────────────────────────────────────────────

  on<K extends keyof AudioPlayerEvents>(
    event: K,
    listener: AudioPlayerEvents[K]
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.emitter.on(event, listener as any);
  }

  off<K extends keyof AudioPlayerEvents>(
    event: K,
    listener: AudioPlayerEvents[K]
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.emitter.off(event, listener as any);
  }

  // ─────────────────────────────────────────────────────────────────
  // Playback Controls
  // ─────────────────────────────────────────────────────────────────

  async play(): Promise<void> {
    if (!this.howl && this._currentTrack) {
      await this.loadTrack(this._currentTrack);
    }
    if (this.howl) {
      this.howl.play();
      this.setState('playing');
      this.startPositionTracking();
    }
  }

  pause(): void {
    if (this.howl) {
      this.howl.pause();
      this.setState('paused');
      this.stopPositionTracking();
    }
  }

  stop(): void {
    if (this.howl) {
      this.howl.stop();
      this.howl.unload();
      this.howl = null;
    }
    this._position = 0;
    this.setState('stopped');
    this.stopPositionTracking();
    this.emitter.emit('positionChange', 0);
  }

  toggle(): void {
    if (this._state === 'playing') {
      this.pause();
    } else {
      this.play();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Seeking
  // ─────────────────────────────────────────────────────────────────

  seek(positionMs: number): void {
    if (this.howl) {
      const positionSec = Math.max(0, positionMs / 1000);
      this.howl.seek(positionSec);
      this._position = positionMs;
      this.emitter.emit('positionChange', positionMs);
    }
  }

  seekRelative(deltaMs: number): void {
    this.seek(this._position + deltaMs);
  }

  // ─────────────────────────────────────────────────────────────────
  // Volume
  // ─────────────────────────────────────────────────────────────────

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    if (!this._muted) {
      Howler.volume(this._volume);
    }
    this.emitter.emit('volumeChange', this._volume);
  }

  mute(): void {
    this._muted = true;
    Howler.mute(true);
  }

  unmute(): void {
    this._muted = false;
    Howler.mute(false);
    Howler.volume(this._volume);
  }

  toggleMute(): void {
    if (this._muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Queue Navigation
  // ─────────────────────────────────────────────────────────────────

  async next(): Promise<void> {
    if (this._queue.length === 0) return;

    let nextIndex = this._currentIndex + 1;

    if (nextIndex >= this._queue.length) {
      if (this._loopMode === 'all') {
        nextIndex = 0;
      } else {
        this.setState('completed');
        this.emitter.emit('end');
        return;
      }
    }

    await this.skipTo(nextIndex);
  }

  async previous(): Promise<void> {
    if (this._queue.length === 0) return;

    // If past 3 seconds, restart current track
    if (this._position > 3000) {
      this.seek(0);
      return;
    }

    let prevIndex = this._currentIndex - 1;

    if (prevIndex < 0) {
      if (this._loopMode === 'all') {
        prevIndex = this._queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    await this.skipTo(prevIndex);
  }

  async skipTo(index: number): Promise<void> {
    if (index < 0 || index >= this._queue.length) return;

    this._currentIndex = index;
    const track = this._queue[index];
    await this.loadAndPlay(track);
    this.emitQueueChange();
  }

  // ─────────────────────────────────────────────────────────────────
  // Queue Management
  // ─────────────────────────────────────────────────────────────────

  addToQueue(tracks: Track | Track[]): void {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
    // For now, assume tracks are already sourced
    // In production, this would resolve sources via plugin
    this._queue.push(...(tracksArray as SourcedTrack[]));
    this._originalOrder.push(...(tracksArray as SourcedTrack[]));
    this.emitQueueChange();
  }

  removeFromQueue(index: number): void {
    if (index < 0 || index >= this._queue.length) return;

    this._queue.splice(index, 1);

    if (index < this._currentIndex) {
      this._currentIndex--;
    } else if (index === this._currentIndex) {
      // Current track removed, play next
      if (this._queue.length > 0) {
        this.skipTo(Math.min(this._currentIndex, this._queue.length - 1));
      } else {
        this.stop();
        this._currentTrack = null;
        this._currentIndex = -1;
      }
    }

    this.emitQueueChange();
  }

  clearQueue(): void {
    this.stop();
    this._queue = [];
    this._originalOrder = [];
    this._currentIndex = -1;
    this._currentTrack = null;
    this.emitter.emit('trackChange', null);
    this.emitQueueChange();
  }

  moveInQueue(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this._queue.length ||
      toIndex < 0 ||
      toIndex >= this._queue.length
    ) {
      return;
    }

    const [track] = this._queue.splice(fromIndex, 1);
    this._queue.splice(toIndex, 0, track);

    // Update current index if affected
    if (fromIndex === this._currentIndex) {
      this._currentIndex = toIndex;
    } else if (
      fromIndex < this._currentIndex &&
      toIndex >= this._currentIndex
    ) {
      this._currentIndex--;
    } else if (
      fromIndex > this._currentIndex &&
      toIndex <= this._currentIndex
    ) {
      this._currentIndex++;
    }

    this.emitQueueChange();
  }

  // ─────────────────────────────────────────────────────────────────
  // Playback Modes
  // ─────────────────────────────────────────────────────────────────

  setLoopMode(mode: LoopMode): void {
    this._loopMode = mode;
    if (this.howl) {
      this.howl.loop(mode === 'one');
    }
  }

  toggleShuffle(): void {
    this._shuffled = !this._shuffled;

    if (this._shuffled) {
      // Save original order and shuffle
      this._originalOrder = [...this._queue];
      this.shuffleQueue();
    } else {
      // Restore original order
      const currentTrack = this._currentTrack;
      this._queue = [...this._originalOrder];
      if (currentTrack) {
        this._currentIndex = this._queue.findIndex(
          (t) => t.id === currentTrack.id
        );
      }
    }

    this.emitQueueChange();
  }

  setPlaybackRate(rate: number): void {
    this._playbackRate = Math.max(0.5, Math.min(2, rate));
    if (this.howl) {
      this.howl.rate(this._playbackRate);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Direct Play
  // ─────────────────────────────────────────────────────────────────

  async playTrack(track: Track): Promise<void> {
    await this.playTracks([track], 0);
  }

  async playTracks(tracks: Track[], startIndex = 0): Promise<void> {
    this._queue = tracks as SourcedTrack[];
    this._originalOrder = [...this._queue];
    this._shuffled = false;

    if (this._queue.length > 0) {
      await this.skipTo(startIndex);
    }
  }

  async playPlaylist(playlistId: string, startIndex = 0): Promise<void> {
    // This would be implemented by the plugin system
    // For now, just log
    console.log(`[AudioPlayer] playPlaylist: ${playlistId} @ ${startIndex}`);
  }

  // ─────────────────────────────────────────────────────────────────
  // Internal Methods
  // ─────────────────────────────────────────────────────────────────

  private async loadTrack(track: SourcedTrack): Promise<void> {
    this.setState('loading');

    // Unload previous
    if (this.howl) {
      this.howl.unload();
    }

    this.howl = new Howl({
      src: [track.streamUrl],
      html5: true, // Enable streaming
      autoplay: false,
      volume: this._muted ? 0 : this._volume,
      rate: this._playbackRate,
      loop: this._loopMode === 'one',
      onload: () => {
        this._duration = (this.howl?.duration() ?? 0) * 1000;
        this.emitter.emit('durationChange', this._duration);
      },
      onplay: () => {
        this.setState('playing');
      },
      onpause: () => {
        this.setState('paused');
      },
      onend: () => {
        this.handleTrackEnd();
      },
      onloaderror: (_id: number, error: unknown) => {
        this.setState('error');
        this.emitter.emit('error', new Error(String(error)));
      },
      onplayerror: (_id: number, error: unknown) => {
        this.setState('error');
        this.emitter.emit('error', new Error(String(error)));
      },
    });

    this._currentTrack = track;
    this._position = 0;
    this.emitter.emit('trackChange', track);
    this.emitter.emit('positionChange', 0);
  }

  private async loadAndPlay(track: SourcedTrack): Promise<void> {
    await this.loadTrack(track);
    await this.play();
  }

  private handleTrackEnd(): void {
    this.stopPositionTracking();

    if (this._loopMode === 'one') {
      // Howler handles this with loop: true
      return;
    }

    this.next();
  }

  private setState(state: PlaybackState): void {
    this._state = state;
    this.emitter.emit('stateChange', state);
  }

  private startPositionTracking(): void {
    this.stopPositionTracking();
    this.positionInterval = setInterval(() => {
      if (this.howl && this._state === 'playing') {
        this._position = (this.howl.seek() as number) * 1000;
        this.emitter.emit('positionChange', this._position);
      }
    }, 250); // Update 4x per second
  }

  private stopPositionTracking(): void {
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  private emitQueueChange(): void {
    this.emitter.emit('queueChange', this.queue);
  }

  private shuffleQueue(): void {
    const currentTrack = this._currentTrack;

    // Fisher-Yates shuffle
    for (let i = this._queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._queue[i], this._queue[j]] = [this._queue[j], this._queue[i]];
    }

    // Move current track to front
    if (currentTrack) {
      const currentIdx = this._queue.findIndex((t) => t.id === currentTrack.id);
      if (currentIdx > 0) {
        this._queue.splice(currentIdx, 1);
        this._queue.unshift(currentTrack);
      }
      this._currentIndex = 0;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────

  dispose(): void {
    this.stop();
    this.emitter.removeAllListeners();
  }
}
