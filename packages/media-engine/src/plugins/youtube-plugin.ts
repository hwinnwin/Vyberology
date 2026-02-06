/**
 * YouTube Audio Source Plugin - built-in plugin for YouTube audio
 * Similar to Spotube's default YouTube plugin
 */

import type {
  AudioSource,
  MediaPlugin,
  PluginConfig,
  PluginStatus,
} from '../types/plugin.js';
import type { Track } from '../types/track.js';
import { YouTubeSource, type YouTubeSourceConfig } from '../sources/youtube.js';

const PLUGIN_CONFIG: PluginConfig = {
  id: 'vybe-youtube-audio',
  name: 'YouTube Audio',
  version: '1.0.0',
  description: 'Resolves audio streams from YouTube via Piped API',
  author: 'Vybe',
  abilities: ['audio-source'],
  settings: [
    {
      key: 'pipedInstance',
      label: 'Piped Instance',
      type: 'string',
      default: 'https://pipedapi.kavin.rocks',
    },
    {
      key: 'preferredQuality',
      label: 'Preferred Quality',
      type: 'select',
      default: 'high',
      options: [
        { label: 'Low (96kbps)', value: 'low' },
        { label: 'Medium (160kbps)', value: 'medium' },
        { label: 'High (256kbps+)', value: 'high' },
      ],
    },
  ],
};

export class YouTubeAudioPlugin implements MediaPlugin {
  readonly config = PLUGIN_CONFIG;
  private _status: PluginStatus = 'inactive';
  private source: YouTubeSource;
  private settings: YouTubeSourceConfig;

  constructor(settings: YouTubeSourceConfig = {}) {
    this.settings = settings;
    this.source = new YouTubeSource(settings);
  }

  get status(): PluginStatus {
    return this._status;
  }

  async initialize(): Promise<void> {
    this._status = 'loading';

    try {
      // Test connection to Piped instance
      const testResults = await this.source.search('test', 1);
      if (testResults) {
        this._status = 'active';
      } else {
        this._status = 'error';
      }
    } catch (error) {
      console.error('[YouTubeAudioPlugin] Initialization error:', error);
      this._status = 'error';
    }
  }

  dispose(): void {
    this._status = 'inactive';
  }

  async resolveAudioSource(track: Track): Promise<AudioSource | null> {
    if (this._status !== 'active') {
      console.warn('[YouTubeAudioPlugin] Plugin not active');
      return null;
    }

    return this.source.resolveTrack(track);
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<YouTubeSourceConfig>): void {
    this.settings = { ...this.settings, ...settings };
    this.source = new YouTubeSource(this.settings);
  }

  /**
   * Get available Piped instances
   */
  static getAvailableInstances(): string[] {
    return YouTubeSource.getDefaultInstances();
  }
}

/**
 * Create and register the YouTube audio plugin
 */
export function createYouTubePlugin(
  settings?: YouTubeSourceConfig
): YouTubeAudioPlugin {
  return new YouTubeAudioPlugin(settings);
}
