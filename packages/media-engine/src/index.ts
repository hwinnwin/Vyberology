/**
 * @vybe/media-engine
 *
 * Cross-platform audio/video engine for Vybe apps
 * Inspired by Spotube's architecture
 *
 * @example
 * ```typescript
 * import { AudioPlayer, usePlayerStore, YouTubeSource } from '@vybe/media-engine';
 *
 * // Initialize player in React
 * usePlayerStore.getState().initialize();
 *
 * // Play a track
 * const player = usePlayerStore.getState();
 * await player.playTrack(track);
 * ```
 */

// Types
export type {
  // Track types
  Artist,
  Album,
  Track,
  SourcedTrack,
  AudioSourceType,
  StreamQuality,
  Playlist,
  SearchResults,
  // Player types
  PlaybackState,
  LoopMode,
  PlayerState,
  QueueState,
  IPlayerControls,
  PlayerEvents,
  PlayerEventType,
  PlayerConfig,
  // Plugin types
  PluginAbility,
  PluginStatus,
  PluginConfig,
  PluginSetting,
  AudioSource,
  MediaPlugin,
  LyricData,
  SyncedLyric,
  PluginManager as IPluginManager,
} from './types/index.js';

// Player
export {
  AudioPlayer,
  usePlayerStore,
  usePlaybackState,
  useCurrentTrack,
  useProgress,
  useVolume,
  useQueue,
  usePlayerControls,
  useQueueControls,
} from './player/index.js';
export type { AudioPlayerEvents } from './player/index.js';

// Sources
export {
  YouTubeSource,
  LocalSource,
  createFileInput,
  openFilePicker,
  SUPPORTED_AUDIO_FORMATS,
  AUDIO_EXTENSIONS,
} from './sources/index.js';
export type {
  YouTubeSearchResult,
  YouTubeStreamInfo,
  YouTubeStream,
  YouTubeSourceConfig,
  LocalTrackMetadata,
  LocalFile,
} from './sources/index.js';

// Plugins
export {
  PluginManager,
  getPluginManager,
  YouTubeAudioPlugin,
  createYouTubePlugin,
} from './plugins/index.js';

// Lyrics
export {
  LyricsProvider,
  formatLyricTime,
  getCurrentLyricIndex,
} from './lyrics/index.js';
export type { LyricsProviderConfig } from './lyrics/index.js';

// Utils
export {
  formatTime,
  formatTimeLong,
  parseTime,
  formatDuration,
  getRemainingTime,
  getProgress,
} from './utils/index.js';

// Components
export {
  PlayerControls,
  ProgressBar,
  TrackInfo,
  VolumeControl,
  MiniPlayer,
  FullPlayer,
  Queue,
} from './components/index.js';
export type {
  PlayerControlsProps,
  ProgressBarProps,
  TrackInfoProps,
  VolumeControlProps,
  MiniPlayerProps,
  FullPlayerProps,
  QueueProps,
} from './components/index.js';

// Native adapters (React Native / Expo)
export {
  NativeAudioPlayer,
  initializeNativePlayer,
  getNativePlayer,
  disposeNativePlayer,
  useNativePlayer,
  useNativePlaybackState,
  useNativeCurrentTrack,
  useNativeProgress,
  useNativeVolume,
  useNativeQueue,
} from './adapters/index.js';
export type { NativeAudioEvents } from './adapters/index.js';
