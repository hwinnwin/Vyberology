/**
 * GUARDIAN AEGIS - Base Protection Layer
 * Common functionality for all protection layers
 */

import type {
  ProtectionLayer,
  ProtectionRequest,
  LayerResult,
  LayerName,
  LayerStats,
} from '../types';

/**
 * BaseProtectionLayer - Abstract base class for all layers
 */
export abstract class BaseProtectionLayer implements ProtectionLayer {
  public abstract name: LayerName;
  public abstract displayName: string;
  public abstract description: string;
  public abstract icon: string;

  protected enabled = true;
  protected stats: LayerStats = {
    threatsDetected: 0,
    threatsBlocked: 0,
    isActive: true,
  };

  /**
   * Initialize the layer (override in subclasses)
   */
  public async initialize(): Promise<void> {
    console.log(`[${this.displayName}] Initialized`);
  }

  /**
   * Analyze a request (must be implemented by subclasses)
   */
  public abstract analyze(request: ProtectionRequest): Promise<LayerResult>;

  /**
   * Enable/disable this layer
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.stats.isActive = enabled;
  }

  /**
   * Check if layer is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get layer statistics
   */
  public getStats(): LayerStats {
    return { ...this.stats };
  }

  /**
   * Helper to create a "no threat" result
   */
  protected noThreat(): LayerResult {
    return {
      layer: this.name,
      threatDetected: false,
      confidence: 1,
    };
  }

  /**
   * Helper to record a detected threat
   */
  protected recordThreat(blocked: boolean = false): void {
    this.stats.threatsDetected++;
    if (blocked) {
      this.stats.threatsBlocked++;
    }
    this.stats.lastThreatTime = Date.now();
  }
}
