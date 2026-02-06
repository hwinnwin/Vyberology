/**
 * React Native hook for NativeAudioPlayer
 * Provides the same API as usePlayerStore but for mobile
 */

import { useCallback, useSyncExternalStore } from 'react';
import type { LoopMode, PlaybackState } from '../types/player.js';
import type { SourcedTrack, Track } from '../types/track.js';
import { NativeAudioPlayer } from './native-audio.js';

// Singleton player instance
let player: NativeAudioPlayer | null = null;
let subscribers = new Set<() => void>();
let isInitialized = false;

// State snapshot for useSyncExternalStore
interface PlayerSnapshot {
  state: PlaybackState;
  currentTrack: SourcedTrack | null;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  loopMode: LoopMode;
  shuffled: boolean;
  playbackRate: number;
  queue: SourcedTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
}

let snapshot: PlayerSnapshot = {
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
  isPlaying: false,
  isLoading: false,
  progress: 0,
};

function updateSnapshot(): void {
  if (!player) return;

  const newSnapshot: PlayerSnapshot = {
    state: player.state,
    currentTrack: player.currentTrack,
    position: player.position,
    duration: player.duration,
    volume: player.volume,
    muted: player.muted,
    loopMode: player.loopMode,
    shuffled: player.shuffled,
    playbackRate: player.playbackRate,
    queue: player.queue,
    currentIndex: player.currentIndex,
    isPlaying: player.state === 'playing',
    isLoading: player.state === 'loading' || player.state === 'buffering',
    progress: player.duration > 0 ? player.position / player.duration : 0,
  };

  // Only update if changed
  if (JSON.stringify(newSnapshot) !== JSON.stringify(snapshot)) {
    snapshot = newSnapshot;
    subscribers.forEach((callback) => callback());
  }
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot(): PlayerSnapshot {
  return snapshot;
}

/**
 * Initialize the native audio player
 * Call this once in your app's root component with expo-av Audio
 */
export async function initializeNativePlayer(Audio: unknown): Promise<void> {
  if (isInitialized) return;

  player = new NativeAudioPlayer();
  await player.initialize(Audio as Parameters<NativeAudioPlayer['initialize']>[0]);

  // Subscribe to player events
  player.on('stateChange', updateSnapshot);
  player.on('trackChange', updateSnapshot);
  player.on('positionChange', updateSnapshot);
  player.on('durationChange', updateSnapshot);
  player.on('volumeChange', updateSnapshot);

  isInitialized = true;
  updateSnapshot();
}

/**
 * Get the raw player instance (for advanced use)
 */
export function getNativePlayer(): NativeAudioPlayer | null {
  return player;
}

/**
 * Dispose the native audio player
 */
export async function disposeNativePlayer(): Promise<void> {
  if (player) {
    await player.dispose();
    player = null;
  }
  isInitialized = false;
  snapshot = {
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
    isPlaying: false,
    isLoading: false,
    progress: 0,
  };
}

/**
 * React hook for using the native audio player
 * Provides the same interface as usePlayerStore for consistency
 */
export function useNativePlayer() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Actions
  const play = useCallback(async () => {
    await player?.play();
  }, []);

  const pause = useCallback(async () => {
    await player?.pause();
  }, []);

  const toggle = useCallback(async () => {
    await player?.toggle();
  }, []);

  const stop = useCallback(async () => {
    await player?.stop();
  }, []);

  const next = useCallback(async () => {
    await player?.next();
  }, []);

  const previous = useCallback(async () => {
    await player?.previous();
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    await player?.seek(positionMs);
  }, []);

  const seekPercent = useCallback(async (percent: number) => {
    if (player && player.duration > 0) {
      await player.seek(player.duration * percent);
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    await player?.setVolume(volume);
  }, []);

  const toggleMute = useCallback(async () => {
    await player?.toggleMute();
  }, []);

  const setLoopMode = useCallback(async (mode: LoopMode) => {
    await player?.setLoopMode(mode);
  }, []);

  const toggleShuffle = useCallback(() => {
    player?.toggleShuffle();
    updateSnapshot();
  }, []);

  const setPlaybackRate = useCallback(async (rate: number) => {
    await player?.setPlaybackRate(rate);
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    await player?.playTrack(track);
  }, []);

  const playTracks = useCallback(async (tracks: Track[], startIndex = 0) => {
    await player?.playTracks(tracks, startIndex);
  }, []);

  const addToQueue = useCallback((tracks: Track | Track[]) => {
    player?.addToQueue(tracks);
    updateSnapshot();
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    player?.removeFromQueue(index);
    updateSnapshot();
  }, []);

  const clearQueue = useCallback(() => {
    player?.clearQueue();
    updateSnapshot();
  }, []);

  const skipTo = useCallback(async (index: number) => {
    await player?.skipTo(index);
  }, []);

  return {
    // State
    ...state,

    // Actions
    play,
    pause,
    toggle,
    stop,
    next,
    previous,
    seek,
    seekPercent,
    setVolume,
    toggleMute,
    setLoopMode,
    toggleShuffle,
    setPlaybackRate,
    playTrack,
    playTracks,
    addToQueue,
    removeFromQueue,
    clearQueue,
    skipTo,

    // Initialization
    isInitialized,
  };
}

// Convenience hooks for specific state slices
export function useNativePlaybackState(): PlaybackState {
  return useSyncExternalStore(subscribe, () => snapshot.state, () => snapshot.state);
}

export function useNativeCurrentTrack(): SourcedTrack | null {
  return useSyncExternalStore(subscribe, () => snapshot.currentTrack, () => snapshot.currentTrack);
}

export function useNativeProgress(): { position: number; duration: number; progress: number } {
  return useSyncExternalStore(
    subscribe,
    () => ({
      position: snapshot.position,
      duration: snapshot.duration,
      progress: snapshot.progress,
    }),
    () => ({
      position: snapshot.position,
      duration: snapshot.duration,
      progress: snapshot.progress,
    })
  );
}

export function useNativeVolume(): { volume: number; muted: boolean } {
  return useSyncExternalStore(
    subscribe,
    () => ({ volume: snapshot.volume, muted: snapshot.muted }),
    () => ({ volume: snapshot.volume, muted: snapshot.muted })
  );
}

export function useNativeQueue(): { queue: SourcedTrack[]; currentIndex: number } {
  return useSyncExternalStore(
    subscribe,
    () => ({ queue: snapshot.queue, currentIndex: snapshot.currentIndex }),
    () => ({ queue: snapshot.queue, currentIndex: snapshot.currentIndex })
  );
}
