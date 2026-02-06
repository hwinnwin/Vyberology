// Native audio adapter for React Native (expo-av)
export { NativeAudioPlayer } from './native-audio.js';
export type { NativeAudioEvents } from './native-audio.js';

// React Native hooks
export {
  initializeNativePlayer,
  getNativePlayer,
  disposeNativePlayer,
  useNativePlayer,
  useNativePlaybackState,
  useNativeCurrentTrack,
  useNativeProgress,
  useNativeVolume,
  useNativeQueue,
} from './use-native-player.js';
