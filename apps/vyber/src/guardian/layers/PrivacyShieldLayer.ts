/**
 * GUARDIAN AEGIS - Privacy Shield Layer
 * Blocks trackers, fingerprinting, and data harvesting
 */

import type {
  ProtectionRequest,
  LayerResult,
  LayerName,
} from '../types';
import { BaseProtectionLayer } from './BaseLayer';

// Known tracking domains (subset - full list would be much larger)
const TRACKER_DOMAINS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'facebook.com/tr',
  'facebook.net',
  'analytics.google.com',
  'google-analytics.com',
  'hotjar.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'amplitude.com',
  'fullstory.com',
  'crazyegg.com',
  'mouseflow.com',
  'quantserve.com',
  'scorecardresearch.com',
  'taboola.com',
  'outbrain.com',
  'criteo.com',
  'adsrvr.org',
  'adnxs.com',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'casalemedia.com',
];

// Fingerprinting detection patterns
const FINGERPRINT_PATTERNS = [
  /canvas.*getImageData|toDataURL/i,
  /AudioContext|webkitAudioContext/i,
  /webgl.*getParameter|getExtension/i,
  /navigator\.(plugins|mimeTypes|languages)/i,
  /screen\.(width|height|colorDepth)/i,
  /window\.devicePixelRatio/i,
];

/**
 * PrivacyShieldLayer - Protects user privacy
 */
class PrivacyShieldLayer extends BaseProtectionLayer {
  public name: LayerName = 'privacyShield';
  public displayName = 'Privacy Shield';
  public description = 'Blocks trackers and fingerprinting';
  public icon = '🔒';

  private blockedTrackers: Set<string> = new Set();

  public async analyze(request: ProtectionRequest): Promise<LayerResult> {
    if (!this.enabled) {
      return this.noThreat();
    }

    // Check if this is a known tracker
    const trackerResult = this.checkTracker(request.url);
    if (trackerResult.threatDetected) {
      this.recordThreat(true);
      return trackerResult;
    }

    // Check for fingerprinting scripts in content
    if (request.context?.pageContent) {
      const fingerprintResult = this.checkFingerprinting(request.context.pageContent);
      if (fingerprintResult.threatDetected) {
        this.recordThreat();
        return fingerprintResult;
      }
    }

    // Check for excessive cookie setting
    if (request.type === 'resource' && this.isTrackingCookie(request)) {
      this.recordThreat(true);
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'tracker',
        severity: 'low',
        description: 'Third-party tracking cookie blocked',
        confidence: 0.9,
      };
    }

    return this.noThreat();
  }

  /**
   * Check if URL belongs to a known tracker
   */
  private checkTracker(url: string): LayerResult {
    try {
      const hostname = new URL(url).hostname;

      for (const tracker of TRACKER_DOMAINS) {
        if (hostname === tracker || hostname.endsWith(`.${tracker}`)) {
          this.blockedTrackers.add(tracker);
          return {
            layer: this.name,
            threatDetected: true,
            threatType: 'tracker',
            severity: 'low',
            description: `Tracker blocked: ${tracker}`,
            confidence: 0.95,
          };
        }
      }

      // Check for tracking pixels (1x1 images, etc.)
      if (this.isTrackingPixel(url)) {
        return {
          layer: this.name,
          threatDetected: true,
          threatType: 'tracker',
          severity: 'low',
          description: 'Tracking pixel blocked',
          confidence: 0.8,
        };
      }
    } catch {
      // Invalid URL
    }

    return this.noThreat();
  }

  /**
   * Check for fingerprinting attempts in content
   */
  private checkFingerprinting(content: string): LayerResult {
    let matchCount = 0;

    for (const pattern of FINGERPRINT_PATTERNS) {
      if (pattern.test(content)) {
        matchCount++;
      }
    }

    // Multiple fingerprinting techniques = higher confidence
    if (matchCount >= 3) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'fingerprinting',
        severity: 'medium',
        description: 'This site may be fingerprinting your browser',
        confidence: 0.7 + matchCount * 0.05,
      };
    }

    return this.noThreat();
  }

  /**
   * Check if request is setting a tracking cookie
   */
  private isTrackingCookie(request: ProtectionRequest): boolean {
    // This would integrate with cookie interception
    // For now, check if it's from a known tracker domain
    try {
      const hostname = new URL(request.url).hostname;
      return TRACKER_DOMAINS.some(
        tracker => hostname === tracker || hostname.endsWith(`.${tracker}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if URL looks like a tracking pixel
   */
  private isTrackingPixel(url: string): boolean {
    const pixelPatterns = [
      /pixel|tracking|beacon/i,
      /\.(gif|png)\?.*[a-z_]+=[a-z0-9-]+/i,
      /1x1|1\.gif/i,
      /\/t\.gif|\/pixel\.gif/i,
    ];

    return pixelPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Get list of blocked trackers this session
   */
  public getBlockedTrackers(): string[] {
    return Array.from(this.blockedTrackers);
  }

  /**
   * Get tracker block count
   */
  public getBlockCount(): number {
    return this.stats.threatsBlocked;
  }
}

/**
 * Factory function
 */
export function createPrivacyShieldLayer(): PrivacyShieldLayer {
  return new PrivacyShieldLayer();
}
