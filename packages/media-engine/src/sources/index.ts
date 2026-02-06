// YouTube source
export { YouTubeSource } from './youtube.js';
export type {
  YouTubeSearchResult,
  YouTubeStreamInfo,
  YouTubeStream,
  YouTubeSourceConfig,
} from './youtube.js';

// Local file source
export {
  LocalSource,
  createFileInput,
  openFilePicker,
  SUPPORTED_AUDIO_FORMATS,
  AUDIO_EXTENSIONS,
} from './local.js';
export type { LocalTrackMetadata, LocalFile } from './local.js';
