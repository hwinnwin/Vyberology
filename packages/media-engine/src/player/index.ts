// Core player
export { AudioPlayer } from './audio-player.js';
export type { AudioPlayerEvents } from './audio-player.js';

// React/Zustand integration
export {
  usePlayerStore,
  usePlaybackState,
  useCurrentTrack,
  useProgress,
  useVolume,
  useQueue,
  usePlayerControls,
  useQueueControls,
} from './use-player.js';
