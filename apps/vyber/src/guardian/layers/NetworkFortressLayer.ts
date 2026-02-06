/**
 * GUARDIAN AEGIS - Network Fortress Layer
 * Layer 5 - Network Security
 *
 * Protects network connections, DNS security, and MITM detection
 */

import type {
  ProtectionRequest,
  LayerResult,
  LayerName,
} from '../types';
import { BaseProtectionLayer } from './BaseLayer';

// Insecure protocol indicators
const INSECURE_PROTOCOLS = ['http:', 'ftp:', 'telnet:'];

// SSL/TLS error indicators
const SSL_ERROR_PATTERNS = [
  /certificate.*expired/i,
  /certificate.*invalid/i,
  /certificate.*self-signed/i,
  /ssl.*error/i,
  /tls.*error/i,
  /certificate.*mismatch/i,
  /certificate.*revoked/i,
];

// MITM indicators
const MITM_INDICATORS = [
  /proxy.*detected/i,
  /certificate.*changed/i,
  /unexpected.*redirect/i,
  /dns.*spoofing/i,
];

// Known safe domains (allow HTTP for these legacy sites)
const HTTP_ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '*.local',
];

// Suspicious redirect chains
const MAX_REDIRECT_DEPTH = 5;

// DNS-over-HTTPS providers
const DOH_PROVIDERS = [
  'cloudflare-dns.com',
  'dns.google',
  'dns.quad9.net',
];

/**
 * NetworkFortressLayer - Protects network security
 */
class NetworkFortressLayer extends BaseProtectionLayer {
  public name: LayerName = 'networkFortress';
  public displayName = 'Network Fortress';
  public description = 'Protects your network connections';
  public icon = '🏰';

  private redirectHistory: Map<string, number> = new Map();
  private certificateCache: Map<string, CertificateInfo> = new Map();
  private lastDnsCheck: number = 0;

  public async analyze(request: ProtectionRequest): Promise<LayerResult> {
    if (!this.enabled) {
      return this.noThreat();
    }

    // Check for insecure protocol
    const protocolResult = this.checkProtocol(request.url);
    if (protocolResult.threatDetected) {
      this.recordThreat();
      return protocolResult;
    }

    // Check for suspicious redirects
    const redirectResult = this.checkRedirects(request);
    if (redirectResult.threatDetected) {
      this.recordThreat();
      return redirectResult;
    }

    // Check SSL/TLS status (if available in context)
    if (request.context?.pageContent) {
      const sslResult = this.checkSSLStatus(request.context.pageContent);
      if (sslResult.threatDetected) {
        this.recordThreat(true);
        return sslResult;
      }

      // Check for MITM indicators
      const mitmResult = this.checkMITM(request.context.pageContent);
      if (mitmResult.threatDetected) {
        this.recordThreat(true);
        return mitmResult;
      }
    }

    // Check for websocket security
    if (request.type === 'websocket') {
      const wsResult = this.checkWebSocketSecurity(request.url);
      if (wsResult.threatDetected) {
        this.recordThreat();
        return wsResult;
      }
    }

    return this.noThreat();
  }

  /**
   * Check for insecure protocols
   */
  private checkProtocol(url: string): LayerResult {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol;
      const hostname = urlObj.hostname;

      // Allow HTTP for local development
      if (this.isAllowedHttpDomain(hostname)) {
        return this.noThreat();
      }

      // Check for insecure protocols
      if (INSECURE_PROTOCOLS.includes(protocol)) {
        return {
          layer: this.name,
          threatDetected: true,
          threatType: 'unsafe_network',
          severity: 'medium',
          description: `Insecure connection detected (${protocol.replace(':', '')}). Your data could be intercepted.`,
          confidence: 0.9,
          metadata: { protocol, url },
        };
      }

      return this.noThreat();
    } catch {
      return this.noThreat();
    }
  }

  /**
   * Check if HTTP is allowed for this domain
   */
  private isAllowedHttpDomain(hostname: string): boolean {
    for (const pattern of HTTP_ALLOWED_DOMAINS) {
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1);
        if (hostname.endsWith(suffix)) return true;
      } else if (hostname === pattern) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for suspicious redirect chains
   */
  private checkRedirects(request: ProtectionRequest): LayerResult {
    const referrer = request.context?.referrer;
    if (!referrer) return this.noThreat();

    // Track redirect depth
    const key = `${referrer}->${request.url}`;
    const currentDepth = this.redirectHistory.get(referrer) || 0;

    if (currentDepth > MAX_REDIRECT_DEPTH) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'unsafe_network',
        severity: 'medium',
        description: 'Suspicious redirect chain detected. This might be an attempt to obscure the final destination.',
        confidence: 0.7,
        metadata: { redirectDepth: currentDepth, key },
      };
    }

    // Update redirect history
    this.redirectHistory.set(request.url, currentDepth + 1);

    // Clean old entries (keep last 100)
    if (this.redirectHistory.size > 100) {
      const entries = Array.from(this.redirectHistory.entries());
      this.redirectHistory = new Map(entries.slice(-50));
    }

    return this.noThreat();
  }

  /**
   * Check SSL/TLS certificate status
   */
  private checkSSLStatus(content: string): LayerResult {
    for (const pattern of SSL_ERROR_PATTERNS) {
      if (pattern.test(content)) {
        return {
          layer: this.name,
          threatDetected: true,
          threatType: 'mitm_attack',
          severity: 'high',
          description: 'SSL/TLS certificate issue detected. This connection may not be secure.',
          confidence: 0.85,
          metadata: { indicator: 'ssl_error' },
        };
      }
    }

    return this.noThreat();
  }

  /**
   * Check for Man-in-the-Middle attack indicators
   */
  private checkMITM(content: string): LayerResult {
    let matchCount = 0;
    const indicators: string[] = [];

    for (const pattern of MITM_INDICATORS) {
      if (pattern.test(content)) {
        matchCount++;
        const match = content.match(pattern);
        if (match) indicators.push(match[0]);
      }
    }

    if (matchCount >= 2) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'mitm_attack',
        severity: 'critical',
        description: 'Possible man-in-the-middle attack detected. Your connection may be compromised.',
        confidence: 0.8,
        metadata: { indicators },
      };
    }

    return this.noThreat();
  }

  /**
   * Check WebSocket security
   */
  private checkWebSocketSecurity(url: string): LayerResult {
    try {
      const urlObj = new URL(url);

      // WebSocket should use wss:// (secure) not ws://
      if (urlObj.protocol === 'ws:' && !this.isAllowedHttpDomain(urlObj.hostname)) {
        return {
          layer: this.name,
          threatDetected: true,
          threatType: 'unsafe_network',
          severity: 'medium',
          description: 'Insecure WebSocket connection. Data transmitted could be intercepted.',
          confidence: 0.85,
          metadata: { protocol: 'ws' },
        };
      }

      return this.noThreat();
    } catch {
      return this.noThreat();
    }
  }

  /**
   * Check if DNS-over-HTTPS is being used (informational)
   */
  public isDohEnabled(): boolean {
    // This would check actual DNS configuration in a real implementation
    // For now, return false as we can't check this from browser context
    return false;
  }

  /**
   * Get recommended DoH provider
   */
  public getRecommendedDohProvider(): string {
    return DOH_PROVIDERS[0];
  }

  /**
   * Clear redirect history
   */
  public clearRedirectHistory(): void {
    this.redirectHistory.clear();
  }

  /**
   * Get network security status summary
   */
  public getSecurityStatus(): NetworkSecurityStatus {
    return {
      httpsEnforced: true,
      dohEnabled: this.isDohEnabled(),
      certificatesValid: this.certificateCache.size === 0, // No invalid certs cached
      redirectChainsSafe: this.redirectHistory.size < MAX_REDIRECT_DEPTH * 10,
      lastCheck: this.lastDnsCheck,
    };
  }
}

// Helper interfaces
interface CertificateInfo {
  domain: string;
  valid: boolean;
  issuer: string;
  expiresAt: number;
  lastChecked: number;
}

interface NetworkSecurityStatus {
  httpsEnforced: boolean;
  dohEnabled: boolean;
  certificatesValid: boolean;
  redirectChainsSafe: boolean;
  lastCheck: number;
}

/**
 * Factory function
 */
export function createNetworkFortressLayer(): NetworkFortressLayer {
  return new NetworkFortressLayer();
}
