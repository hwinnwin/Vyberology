// Track & Media types
export type {
  Artist,
  Album,
  Track,
  SourcedTrack,
  AudioSourceType,
  StreamQuality,
  Playlist,
  SearchResults,
} from './track.js';

// Player types
export type {
  PlaybackState,
  LoopMode,
  PlayerState,
  QueueState,
  IPlayerControls,
  PlayerEvents,
  PlayerEventType,
  PlayerConfig,
} from './player.js';

// Plugin types
export type {
  PluginAbility,
  PluginStatus,
  PluginConfig,
  PluginSetting,
  AudioSource,
  MediaPlugin,
  LyricData,
  SyncedLyric,
  PluginManager,
} from './plugin.js';
