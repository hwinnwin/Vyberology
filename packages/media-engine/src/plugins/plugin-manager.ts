/**
 * Plugin Manager - manages media plugins
 * Inspired by Spotube's plugin system
 * @see spotube-clone/lib/provider/metadata_plugin/metadata_plugin_provider.dart
 */

import type {
  MediaPlugin,
  PluginAbility,
  PluginManager as IPluginManager,
  AudioSource,
} from '../types/plugin.js';
import type { Track, SearchResults } from '../types/track.js';

/**
 * Plugin manager implementation
 */
export class PluginManager implements IPluginManager {
  private _plugins: Map<string, MediaPlugin> = new Map();
  private _metadataPluginId: string | null = null;
  private _audioSourcePluginId: string | null = null;

  get plugins(): Map<string, MediaPlugin> {
    return this._plugins;
  }

  get activeMetadataPlugin(): MediaPlugin | null {
    if (!this._metadataPluginId) return null;
    return this._plugins.get(this._metadataPluginId) || null;
  }

  get activeAudioSourcePlugin(): MediaPlugin | null {
    if (!this._audioSourcePluginId) return null;
    return this._plugins.get(this._audioSourcePluginId) || null;
  }

  /**
   * Register a plugin
   */
  register(plugin: MediaPlugin): void {
    const { id } = plugin.config;

    if (this._plugins.has(id)) {
      console.warn(`[PluginManager] Plugin ${id} already registered, replacing`);
      this.unregister(id);
    }

    this._plugins.set(id, plugin);
    console.log(`[PluginManager] Registered plugin: ${plugin.config.name}`);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    const plugin = this._plugins.get(pluginId);
    if (plugin) {
      plugin.dispose();
      this._plugins.delete(pluginId);

      // Clear active references if this was the active plugin
      if (this._metadataPluginId === pluginId) {
        this._metadataPluginId = null;
      }
      if (this._audioSourcePluginId === pluginId) {
        this._audioSourcePluginId = null;
      }
    }
  }

  /**
   * Activate a plugin (initialize it)
   */
  async activate(pluginId: string): Promise<void> {
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    await plugin.initialize();
  }

  /**
   * Deactivate a plugin
   */
  deactivate(pluginId: string): void {
    const plugin = this._plugins.get(pluginId);
    if (plugin) {
      plugin.dispose();
    }
  }

  /**
   * Set the active metadata plugin
   */
  setMetadataPlugin(pluginId: string): void {
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!plugin.config.abilities.includes('metadata')) {
      throw new Error(`Plugin ${pluginId} does not have metadata ability`);
    }

    this._metadataPluginId = pluginId;
  }

  /**
   * Set the active audio source plugin
   */
  setAudioSourcePlugin(pluginId: string): void {
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!plugin.config.abilities.includes('audio-source')) {
      throw new Error(`Plugin ${pluginId} does not have audio-source ability`);
    }

    this._audioSourcePluginId = pluginId;
  }

  /**
   * Get plugins by ability
   */
  getPluginsByAbility(ability: PluginAbility): MediaPlugin[] {
    return Array.from(this._plugins.values()).filter((plugin) =>
      plugin.config.abilities.includes(ability)
    );
  }

  /**
   * Search using metadata plugin
   */
  async search(query: string, limit?: number): Promise<SearchResults | null> {
    const plugin = this.activeMetadataPlugin;
    if (!plugin?.search) {
      console.warn('[PluginManager] No search-capable plugin active');
      return null;
    }

    return plugin.search(query, limit);
  }

  /**
   * Resolve audio source for a track
   */
  async resolveAudioSource(track: Track): Promise<AudioSource | null> {
    const plugin = this.activeAudioSourcePlugin;
    if (!plugin?.resolveAudioSource) {
      console.warn('[PluginManager] No audio-source plugin active');
      return null;
    }

    return plugin.resolveAudioSource(track);
  }

  /**
   * Scrobble a track (if scrobbling plugin available)
   */
  async scrobble(track: Track, timestamp: number): Promise<void> {
    const scrobblers = this.getPluginsByAbility('scrobbling');

    await Promise.all(
      scrobblers.map((plugin) => plugin.scrobble?.(track, timestamp))
    );
  }

  /**
   * Update now playing (if scrobbling plugin available)
   */
  async updateNowPlaying(track: Track): Promise<void> {
    const scrobblers = this.getPluginsByAbility('scrobbling');

    await Promise.all(
      scrobblers.map((plugin) => plugin.updateNowPlaying?.(track))
    );
  }

  /**
   * Dispose all plugins
   */
  dispose(): void {
    for (const plugin of this._plugins.values()) {
      plugin.dispose();
    }
    this._plugins.clear();
    this._metadataPluginId = null;
    this._audioSourcePluginId = null;
  }
}

/**
 * Create a plugin manager singleton
 */
let globalPluginManager: PluginManager | null = null;

export function getPluginManager(): PluginManager {
  if (!globalPluginManager) {
    globalPluginManager = new PluginManager();
  }
  return globalPluginManager;
}
