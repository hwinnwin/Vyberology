/**
 * React hooks for AudioPlayer - Zustand store integration
 * Inspired by Spotube's Riverpod providers
 * @see spotube-clone/lib/provider/audio_player/audio_player_streams.dart
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { LoopMode, PlaybackState, QueueState } from '../types/player.js';
import type { SourcedTrack, Track } from '../types/track.js';
import { AudioPlayer } from './audio-player.js';

// ─────────────────────────────────────────────────────────────────
// Store Types
// ─────────────────────────────────────────────────────────────────

interface PlayerStore {
  // Player instance
  player: AudioPlayer | null;

  // State (synced from player)
  state: PlaybackState;
  currentTrack: SourcedTrack | null;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  loopMode: LoopMode;
  shuffled: boolean;
  playbackRate: number;

  // Queue state
  queue: SourcedTrack[];
  currentIndex: number;

  // Derived state
  isPlaying: boolean;
  isLoading: boolean;
  progress: number; // 0-1

  // Actions
  initialize: () => void;
  dispose: () => void;

  // Player controls
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (positionMs: number) => void;
  seekPercent: (percent: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setLoopMode: (mode: LoopMode) => void;
  toggleShuffle: () => void;
  setPlaybackRate: (rate: number) => void;

  // Queue controls
  playTrack: (track: Track) => Promise<void>;
  playTracks: (tracks: Track[], startIndex?: number) => Promise<void>;
  addToQueue: (tracks: Track | Track[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  skipTo: (index: number) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// Store Implementation
// ─────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    player: null,
    state: 'idle',
    currentTrack: null,
    position: 0,
    duration: 0,
    volume: 0.8,
    muted: false,
    loopMode: 'off',
    shuffled: false,
    playbackRate: 1,
    queue: [],
    currentIndex: -1,

    // Derived
    get isPlaying() {
      return get().state === 'playing';
    },
    get isLoading() {
      return get().state === 'loading' || get().state === 'buffering';
    },
    get progress() {
      const { position, duration } = get();
      return duration > 0 ? position / duration : 0;
    },

    // Initialize player and subscribe to events
    initialize: () => {
      const existing = get().player;
      if (existing) return;

      const player = new AudioPlayer({
        initialVolume: get().volume,
      });

      // Subscribe to player events
      player.on('stateChange', (state) => set({ state }));
      player.on('trackChange', (currentTrack) => set({ currentTrack }));
      player.on('positionChange', (position) => set({ position }));
      player.on('durationChange', (duration) => set({ duration }));
      player.on('volumeChange', (volume) => set({ volume }));
      player.on('queueChange', (queueState: QueueState) =>
        set({
          queue: queueState.tracks,
          currentIndex: queueState.currentIndex,
        })
      );

      set({ player });
    },

    dispose: () => {
      const { player } = get();
      if (player) {
        player.dispose();
        set({ player: null });
      }
    },

    // Playback controls
    play: async () => {
      await get().player?.play();
    },
    pause: () => {
      get().player?.pause();
    },
    toggle: () => {
      get().player?.toggle();
    },
    stop: () => {
      get().player?.stop();
    },
    next: async () => {
      await get().player?.next();
    },
    previous: async () => {
      await get().player?.previous();
    },
    seek: (positionMs: number) => {
      get().player?.seek(positionMs);
    },
    seekPercent: (percent: number) => {
      const { duration } = get();
      get().player?.seek(duration * percent);
    },
    setVolume: (volume: number) => {
      get().player?.setVolume(volume);
      set({ volume });
    },
    toggleMute: () => {
      const { player, muted } = get();
      if (muted) {
        player?.unmute();
      } else {
        player?.mute();
      }
      set({ muted: !muted });
    },
    setLoopMode: (mode: LoopMode) => {
      get().player?.setLoopMode(mode);
      set({ loopMode: mode });
    },
    toggleShuffle: () => {
      get().player?.toggleShuffle();
      set((s) => ({ shuffled: !s.shuffled }));
    },
    setPlaybackRate: (rate: number) => {
      get().player?.setPlaybackRate(rate);
      set({ playbackRate: rate });
    },

    // Queue controls
    playTrack: async (track: Track) => {
      await get().player?.playTrack(track);
    },
    playTracks: async (tracks: Track[], startIndex = 0) => {
      await get().player?.playTracks(tracks, startIndex);
    },
    addToQueue: (tracks: Track | Track[]) => {
      get().player?.addToQueue(tracks);
    },
    removeFromQueue: (index: number) => {
      get().player?.removeFromQueue(index);
    },
    clearQueue: () => {
      get().player?.clearQueue();
    },
    skipTo: async (index: number) => {
      await get().player?.skipTo(index);
    },
  }))
);

// ─────────────────────────────────────────────────────────────────
// Convenience Hooks
// ─────────────────────────────────────────────────────────────────

/** Get current playback state */
export const usePlaybackState = () =>
  usePlayerStore((s) => s.state);

/** Get currently playing track */
export const useCurrentTrack = () =>
  usePlayerStore((s) => s.currentTrack);

/** Get position and duration for progress display */
export const useProgress = () =>
  usePlayerStore((s) => ({
    position: s.position,
    duration: s.duration,
    progress: s.duration > 0 ? s.position / s.duration : 0,
  }));

/** Get volume state */
export const useVolume = () =>
  usePlayerStore((s) => ({
    volume: s.volume,
    muted: s.muted,
  }));

/** Get queue state */
export const useQueue = () =>
  usePlayerStore((s) => ({
    queue: s.queue,
    currentIndex: s.currentIndex,
  }));

/** Get playback controls */
export const usePlayerControls = () =>
  usePlayerStore((s) => ({
    play: s.play,
    pause: s.pause,
    toggle: s.toggle,
    stop: s.stop,
    next: s.next,
    previous: s.previous,
    seek: s.seek,
    seekPercent: s.seekPercent,
  }));

/** Get queue controls */
export const useQueueControls = () =>
  usePlayerStore((s) => ({
    playTrack: s.playTrack,
    playTracks: s.playTracks,
    addToQueue: s.addToQueue,
    removeFromQueue: s.removeFromQueue,
    clearQueue: s.clearQueue,
    skipTo: s.skipTo,
  }));
