/**
 * GUARDIAN AEGIS - Shield Manager
 * Orchestrates all protection layers
 */

import type {
  GuardianConfig,
  ProtectionRequest,
  LayerResult,
  LayerName,
  ProtectionLayer,
  WhitelistEntry,
  BlocklistEntry,
  ThreatSeverity,
} from '../types';

// Placeholder layers (will be replaced with real implementations)
import { createChildSafetyLayer } from '../layers/ChildSafetyLayer';
import { createThreatProtectionLayer } from '../layers/ThreatProtectionLayer';
import { createPrivacyShieldLayer } from '../layers/PrivacyShieldLayer';
import { createConsciousnessGuardLayer } from '../layers/ConsciousnessGuardLayer';
import { createNetworkFortressLayer } from '../layers/NetworkFortressLayer';

/**
 * ShieldManager - Coordinates all protection layers
 */
export class ShieldManager {
  private layers: Map<LayerName, ProtectionLayer> = new Map();
  private whitelist: Map<string, WhitelistEntry> = new Map();
  private blocklist: BlocklistEntry[] = [];
  private config: GuardianConfig;
  private initialized = false;

  constructor(config: GuardianConfig) {
    this.config = config;
  }

  /**
   * Initialize all protection layers
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[ShieldManager] Initializing protection layers...');

    // Create all layers
    this.layers.set('childSafety', createChildSafetyLayer());
    this.layers.set('threatProtection', createThreatProtectionLayer());
    this.layers.set('privacyShield', createPrivacyShieldLayer());
    this.layers.set('consciousnessGuard', createConsciousnessGuardLayer());
    this.layers.set('networkFortress', createNetworkFortressLayer());

    // Initialize each layer
    const initPromises: Promise<void>[] = [];
    for (const [name, layer] of this.layers) {
      const enabled = this.config.layers[name];
      layer.setEnabled(enabled);
      initPromises.push(
        layer.initialize().catch(error => {
          console.error(`[ShieldManager] Failed to initialize ${name}:`, error);
        })
      );
    }

    await Promise.all(initPromises);

    // Load whitelist from storage
    this.loadWhitelist();

    // Load blocklist
    await this.loadBlocklist();

    this.initialized = true;
    console.log('[ShieldManager] All layers initialized');
  }

  /**
   * Analyze a request through all active layers
   */
  public async analyzeRequest(request: ProtectionRequest): Promise<LayerResult[]> {
    // Check whitelist first
    const domain = this.extractDomain(request.url);
    if (this.whitelist.has(domain)) {
      return []; // Whitelisted, skip analysis
    }

    // Quick blocklist check
    const blocklistMatch = this.checkBlocklist(request.url);
    if (blocklistMatch) {
      return [{
        layer: 'threatProtection',
        threatDetected: true,
        threatType: blocklistMatch.category,
        severity: blocklistMatch.severity,
        description: `Blocked by ${blocklistMatch.source} blocklist`,
        confidence: 1,
      }];
    }

    const results: LayerResult[] = [];
    const analyzePromises: Promise<LayerResult>[] = [];

    // Run all enabled layers in parallel
    for (const [name, layer] of this.layers) {
      if (layer.isEnabled()) {
        analyzePromises.push(
          layer.analyze(request).catch(error => {
            console.error(`[ShieldManager] Layer ${name} error:`, error);
            return {
              layer: name,
              threatDetected: false,
              confidence: 0,
            } as LayerResult;
          })
        );
      }
    }

    const layerResults = await Promise.all(analyzePromises);

    // Collect threats
    for (const result of layerResults) {
      if (result.threatDetected) {
        results.push(result);
      }
    }

    // Sort by severity (critical first)
    const severityOrder: Record<ThreatSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return results.sort((a, b) => {
      const aSev = severityOrder[a.severity || 'low'];
      const bSev = severityOrder[b.severity || 'low'];
      return aSev - bSev;
    });
  }

  /**
   * Quick URL check (cached, fast)
   */
  public async quickCheck(url: string): Promise<{ safe: boolean; reason?: string }> {
    const domain = this.extractDomain(url);

    // Check whitelist
    if (this.whitelist.has(domain)) {
      return { safe: true };
    }

    // Check blocklist
    const blocklistMatch = this.checkBlocklist(url);
    if (blocklistMatch) {
      return {
        safe: false,
        reason: `Blocked: ${blocklistMatch.category}`,
      };
    }

    return { safe: true };
  }

  /**
   * Update a layer's enabled state
   */
  public updateLayer(layer: LayerName, enabled: boolean): void {
    const protectionLayer = this.layers.get(layer);
    if (protectionLayer) {
      protectionLayer.setEnabled(enabled);
      console.log(`[ShieldManager] Layer ${layer} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get layer stats
   */
  public getLayerStats(layer: LayerName) {
    return this.layers.get(layer)?.getStats();
  }

  /**
   * Start real-time protection hooks
   */
  public startRealTimeProtection(): void {
    // This will be called to set up navigation interception
    // Integration with THE VYBER's tab/navigation system
    console.log('[ShieldManager] Real-time protection started');
  }

  // ============ Whitelist Management ============

  public addWhitelist(entry: WhitelistEntry): void {
    this.whitelist.set(entry.domain, entry);
    this.saveWhitelist();
  }

  public removeWhitelist(domain: string): void {
    this.whitelist.delete(domain);
    this.saveWhitelist();
  }

  public getWhitelist(): WhitelistEntry[] {
    return Array.from(this.whitelist.values());
  }

  public isWhitelisted(domain: string): boolean {
    return this.whitelist.has(domain);
  }

  private loadWhitelist(): void {
    try {
      const saved = localStorage.getItem('guardian-aegis-whitelist');
      if (saved) {
        const entries: WhitelistEntry[] = JSON.parse(saved);
        for (const entry of entries) {
          // Check expiration
          if (!entry.expiresAt || entry.expiresAt > Date.now()) {
            this.whitelist.set(entry.domain, entry);
          }
        }
      }
    } catch (error) {
      console.error('[ShieldManager] Failed to load whitelist:', error);
    }
  }

  private saveWhitelist(): void {
    try {
      const entries = Array.from(this.whitelist.values());
      localStorage.setItem('guardian-aegis-whitelist', JSON.stringify(entries));
    } catch (error) {
      console.error('[ShieldManager] Failed to save whitelist:', error);
    }
  }

  // ============ Blocklist Management ============

  private async loadBlocklist(): Promise<void> {
    // Load built-in blocklists
    // In production, these would be fetched/updated from a server
    this.blocklist = [
      // Known phishing patterns
      { pattern: 'secure-login-', type: 'url', category: 'phishing', severity: 'high', source: 'builtin', addedAt: Date.now() },
      { pattern: 'account-verify-', type: 'url', category: 'phishing', severity: 'high', source: 'builtin', addedAt: Date.now() },
      { pattern: 'wallet-connect-', type: 'url', category: 'phishing', severity: 'critical', source: 'builtin', addedAt: Date.now() },
      // Known malware domains (examples)
      { pattern: 'malware-test.com', type: 'domain', category: 'malware', severity: 'critical', source: 'builtin', addedAt: Date.now() },
    ];

    console.log(`[ShieldManager] Loaded ${this.blocklist.length} blocklist entries`);
  }

  private checkBlocklist(url: string): BlocklistEntry | null {
    const domain = this.extractDomain(url);
    const urlLower = url.toLowerCase();

    for (const entry of this.blocklist) {
      switch (entry.type) {
        case 'domain':
          if (domain === entry.pattern || domain.endsWith(`.${entry.pattern}`)) {
            return entry;
          }
          break;
        case 'url':
          if (urlLower.includes(entry.pattern.toLowerCase())) {
            return entry;
          }
          break;
        case 'regex':
          try {
            if (new RegExp(entry.pattern, 'i').test(url)) {
              return entry;
            }
          } catch {
            // Invalid regex, skip
          }
          break;
      }
    }

    return null;
  }

  // ============ Helpers ============

  private extractDomain(url: string): string {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Shutdown all layers
   */
  public shutdown(): void {
    this.layers.clear();
    this.initialized = false;
    console.log('[ShieldManager] Shutdown complete');
  }
}
