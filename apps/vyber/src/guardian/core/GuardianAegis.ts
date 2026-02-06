/**
 * GUARDIAN AEGIS - Main Shield Singleton
 * The Shield That Protects All
 *
 * ON by default - Protection from moment one
 * User sovereignty - Can be disabled (their choice, their freedom)
 * Protocol 69 - We GIVE protection, never weaponize it
 */

import type {
  GuardianConfig,
  ThreatReport,
  ProtectionRequest,
  ProtectionResult,
  LayerName,
  GuardianEvent,
  GuardianEventHandler,
  WhitelistEntry,
} from '../types';
import { ShieldManager } from './ShieldManager';
import { ResponseEngine } from './ResponseEngine';

// Generate unique IDs
function generateId(): string {
  return `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * GuardianAegis - The Main Protection Shield
 *
 * Singleton that manages all protection layers and provides
 * a unified interface for threat detection and response.
 */
export class GuardianAegis {
  private static instance: GuardianAegis | null = null;
  private shieldManager: ShieldManager;
  private responseEngine: ResponseEngine;
  private config: GuardianConfig;
  private threatLog: ThreatReport[] = [];
  private eventHandlers: Set<GuardianEventHandler> = new Set();
  private initialized = false;
  private maxLogSize = 500;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.responseEngine = new ResponseEngine();
    this.shieldManager = new ShieldManager(this.config);
  }

  /**
   * Get the singleton instance
   * One guardian for all
   */
  public static getInstance(): GuardianAegis {
    if (!GuardianAegis.instance) {
      GuardianAegis.instance = new GuardianAegis();
    }
    return GuardianAegis.instance;
  }

  /**
   * Reset the singleton (for testing)
   */
  public static reset(): void {
    if (GuardianAegis.instance) {
      GuardianAegis.instance.shutdown();
      GuardianAegis.instance = null;
    }
  }

  /**
   * Default config - PROTECTION ON BY DEFAULT
   * This is the VYBE way - care for users from the start
   */
  private getDefaultConfig(): GuardianConfig {
    return {
      enabled: true, // ON BY DEFAULT
      layers: {
        childSafety: true,        // ON BY DEFAULT - Priority #1
        threatProtection: true,   // ON BY DEFAULT
        privacyShield: true,      // ON BY DEFAULT
        consciousnessGuard: true, // ON BY DEFAULT
        networkFortress: true,    // ON BY DEFAULT
      },
      strictMode: false,
      notificationsEnabled: true,
    };
  }

  /**
   * Initialize Guardian Aegis
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[GuardianAegis] Initializing shield system...');

    // Load saved config (respects user choices)
    const savedConfig = this.loadSavedConfig();
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }

    // Initialize shield manager with all layers
    await this.shieldManager.initialize();

    // Start real-time protection
    this.shieldManager.startRealTimeProtection();

    this.initialized = true;
    console.log('[GuardianAegis] All shields active - Protection engaged');
  }

  /**
   * Main protection method - called on every request
   */
  public async protect(request: ProtectionRequest): Promise<ProtectionResult> {
    // If guardian is disabled, allow everything (user sovereignty)
    if (!this.config.enabled) {
      return { allowed: true, threats: [] };
    }

    const threats: ThreatReport[] = [];

    try {
      // Run analysis through all active layers
      const results = await this.shieldManager.analyzeRequest(request);

      for (const result of results) {
        if (result.threatDetected && result.threatType && result.severity) {
          const threat: ThreatReport = {
            id: generateId(),
            timestamp: Date.now(),
            type: result.threatType,
            severity: result.severity,
            layer: result.layer,
            url: request.url,
            description: result.description || 'Threat detected',
            action: 'logged',
            metadata: result.metadata,
          };

          // Determine response based on threat
          const response = this.responseEngine.determineResponse(threat, this.config.strictMode);
          threat.action = response.action;

          threats.push(threat);
          this.logThreat(threat);

          // Emit event
          this.emit({ type: 'threat:detected', threat });

          // If blocked, return immediately
          if (response.action === 'blocked') {
            this.emit({ type: 'threat:blocked', threat });
            return {
              allowed: false,
              threats,
              blockReason: response.message,
              canOverride: response.canOverride,
            };
          }

          // If warned, add warning message
          if (response.action === 'warned') {
            return {
              allowed: true,
              threats,
              warningMessage: response.message,
              canOverride: true,
            };
          }
        }
      }
    } catch (error) {
      console.error('[GuardianAegis] Error during protection analysis:', error);
      // Fail open - don't block on errors (user experience first)
    }

    return { allowed: true, threats };
  }

  /**
   * Quick URL check (synchronous-ish, uses cached blocklists)
   */
  public async quickCheck(url: string): Promise<{ safe: boolean; reason?: string }> {
    if (!this.config.enabled) {
      return { safe: true };
    }

    return this.shieldManager.quickCheck(url);
  }

  // ============ User Control Methods (SOVEREIGNTY) ============

  /**
   * Enable/disable Guardian Aegis entirely
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();

    if (enabled) {
      console.log('[GuardianAegis] Protection ENABLED');
      this.emit({ type: 'guardian:enabled' });
    } else {
      console.log('[GuardianAegis] Protection DISABLED by user choice');
      this.emit({ type: 'guardian:disabled' });
    }
  }

  /**
   * Enable/disable a specific layer
   */
  public setLayerEnabled(layer: LayerName, enabled: boolean): void {
    this.config.layers[layer] = enabled;
    this.shieldManager.updateLayer(layer, enabled);
    this.saveConfig();

    if (enabled) {
      this.emit({ type: 'layer:enabled', layer });
    } else {
      this.emit({ type: 'layer:disabled', layer });
    }
  }

  /**
   * Get current config
   */
  public getConfig(): GuardianConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  public updateConfig(updates: Partial<GuardianConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Set strict mode
   */
  public setStrictMode(strict: boolean): void {
    this.config.strictMode = strict;
    this.saveConfig();
  }

  // ============ Threat Log Methods ============

  /**
   * Get threat log
   */
  public getThreatLog(): ThreatReport[] {
    return [...this.threatLog];
  }

  /**
   * Get recent threats (last N)
   */
  public getRecentThreats(count: number = 10): ThreatReport[] {
    return this.threatLog.slice(0, count);
  }

  /**
   * Clear threat log
   */
  public clearThreatLog(): void {
    this.threatLog = [];
  }

  /**
   * Get threat statistics
   */
  public getThreatStats(): {
    total: number;
    blocked: number;
    warned: number;
    bySeverity: Record<string, number>;
    byLayer: Record<string, number>;
  } {
    const stats = {
      total: this.threatLog.length,
      blocked: 0,
      warned: 0,
      bySeverity: {} as Record<string, number>,
      byLayer: {} as Record<string, number>,
    };

    for (const threat of this.threatLog) {
      if (threat.action === 'blocked') stats.blocked++;
      if (threat.action === 'warned') stats.warned++;

      stats.bySeverity[threat.severity] = (stats.bySeverity[threat.severity] || 0) + 1;
      stats.byLayer[threat.layer] = (stats.byLayer[threat.layer] || 0) + 1;
    }

    return stats;
  }

  // ============ Whitelist Methods ============

  /**
   * Add URL/domain to whitelist
   */
  public addToWhitelist(domain: string, reason?: string): void {
    const entry: WhitelistEntry = {
      domain: this.extractDomain(domain),
      addedAt: Date.now(),
      reason,
    };
    this.shieldManager.addWhitelist(entry);
    this.emit({ type: 'whitelist:added', entry });
  }

  /**
   * Remove from whitelist
   */
  public removeFromWhitelist(domain: string): void {
    const normalizedDomain = this.extractDomain(domain);
    this.shieldManager.removeWhitelist(normalizedDomain);
    this.emit({ type: 'whitelist:removed', domain: normalizedDomain });
  }

  /**
   * Get whitelist
   */
  public getWhitelist(): WhitelistEntry[] {
    return this.shieldManager.getWhitelist();
  }

  /**
   * Check if domain is whitelisted
   */
  public isWhitelisted(url: string): boolean {
    const domain = this.extractDomain(url);
    return this.shieldManager.isWhitelisted(domain);
  }

  // ============ Event System ============

  /**
   * Subscribe to guardian events
   */
  public on(handler: GuardianEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Emit event to all handlers
   */
  private emit(event: GuardianEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('[GuardianAegis] Event handler error:', error);
      }
    });
  }

  // ============ User Override ============

  /**
   * Allow user to override a block (sovereignty)
   */
  public override(threatId: string): boolean {
    const threat = this.threatLog.find(t => t.id === threatId);
    if (threat && this.responseEngine.canOverride(threat)) {
      threat.userOverride = true;
      threat.action = 'allowed';
      this.emit({ type: 'threat:overridden', threat });
      return true;
    }
    return false;
  }

  // ============ Private Helpers ============

  private logThreat(threat: ThreatReport): void {
    this.threatLog.unshift(threat);

    // Keep log size manageable
    if (this.threatLog.length > this.maxLogSize) {
      this.threatLog = this.threatLog.slice(0, this.maxLogSize);
    }
  }

  private loadSavedConfig(): Partial<GuardianConfig> | null {
    try {
      const saved = localStorage.getItem('guardian-aegis-config');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('guardian-aegis-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('[GuardianAegis] Failed to save config:', error);
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Shutdown guardian
   */
  public shutdown(): void {
    this.shieldManager.shutdown();
    this.eventHandlers.clear();
    this.initialized = false;
    console.log('[GuardianAegis] Shield system shutdown');
  }
}

// Export convenience function
export function getGuardian(): GuardianAegis {
  return GuardianAegis.getInstance();
}
