/**
 * GUARDIAN AEGIS - Threat Protection Layer
 * Protects against phishing, malware, scams, and credential theft
 */

import type {
  ProtectionRequest,
  LayerResult,
  LayerName,
} from '../types';
import { BaseProtectionLayer } from './BaseLayer';

// Common phishing URL patterns
const PHISHING_PATTERNS = [
  // Fake login pages
  /\b(secure[-_]?login|account[-_]?verify|signin[-_]?secure)\b/i,
  /\b(update[-_]?your[-_]?account|verify[-_]?identity)\b/i,
  // Typosquatting common brands
  /\b(paypa1|paypai|g00gle|goggle|amaz0n|amazn|faceb00k)\b/i,
  // Suspicious subdomains
  /\b(login|signin|secure|account)\.(?!google|microsoft|apple|amazon|paypal)/i,
  // Crypto scams
  /\b(wallet[-_]?connect|metamask[-_]?verify|airdrop[-_]?claim)\b/i,
  // Gift card scams
  /\b(gift[-_]?card[-_]?generator|free[-_]?gift[-_]?cards?)\b/i,
];

// Known scam/suspicious TLDs
const SUSPICIOUS_TLDS = [
  '.xyz',
  '.top',
  '.work',
  '.click',
  '.link',
  '.gq',
  '.ml',
  '.ga',
  '.cf',
  '.tk',
];

// Form patterns that suggest credential theft
const CREDENTIAL_THEFT_PATTERNS = [
  /type\s*=\s*["']?password["']?/i,
  /name\s*=\s*["']?(password|passwd|pass|pwd)["']?/i,
  /credit[-_]?card|card[-_]?number|cvv|expiry/i,
  /social[-_]?security|ssn/i,
];

// Suspicious file extensions for downloads
const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.msi',
  '.bat',
  '.cmd',
  '.scr',
  '.pif',
  '.com',
  '.vbs',
  '.js',
  '.jar',
  '.ps1',
];

/**
 * ThreatProtectionLayer - Security threat detection
 */
class ThreatProtectionLayer extends BaseProtectionLayer {
  public name: LayerName = 'threatProtection';
  public displayName = 'Threat Protection';
  public description = 'Blocks phishing, malware, and scams';
  public icon = '🦠';

  public async analyze(request: ProtectionRequest): Promise<LayerResult> {
    if (!this.enabled) {
      return this.noThreat();
    }

    // Check for phishing
    const phishingResult = this.checkPhishing(request.url);
    if (phishingResult.threatDetected) {
      this.recordThreat(true);
      return phishingResult;
    }

    // Check for suspicious TLD
    const tldResult = this.checkSuspiciousTLD(request.url);
    if (tldResult.threatDetected) {
      this.recordThreat();
      return tldResult;
    }

    // Check downloads
    if (request.type === 'download') {
      const downloadResult = this.checkDownload(request.url);
      if (downloadResult.threatDetected) {
        this.recordThreat(true);
        return downloadResult;
      }
    }

    // Check forms for credential theft attempts
    if (request.type === 'form' && request.context?.pageContent) {
      const credentialResult = this.checkCredentialTheft(request);
      if (credentialResult.threatDetected) {
        this.recordThreat(true);
        return credentialResult;
      }
    }

    return this.noThreat();
  }

  /**
   * Check URL for phishing patterns
   */
  private checkPhishing(url: string): LayerResult {
    const urlLower = url.toLowerCase();

    for (const pattern of PHISHING_PATTERNS) {
      if (pattern.test(urlLower)) {
        return {
          layer: this.name,
          threatDetected: true,
          threatType: 'phishing',
          severity: 'high',
          description: 'This URL matches known phishing patterns',
          confidence: 0.85,
        };
      }
    }

    // Check for homograph attacks (mixed scripts in URL)
    if (this.hasHomographAttack(url)) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'phishing',
        severity: 'high',
        description: 'This URL may be using deceptive characters',
        confidence: 0.9,
      };
    }

    return this.noThreat();
  }

  /**
   * Check for suspicious TLDs
   */
  private checkSuspiciousTLD(url: string): LayerResult {
    try {
      const hostname = new URL(url).hostname;

      for (const tld of SUSPICIOUS_TLDS) {
        if (hostname.endsWith(tld)) {
          return {
            layer: this.name,
            threatDetected: true,
            threatType: 'phishing',
            severity: 'medium',
            description: 'This site uses a TLD commonly associated with scams',
            confidence: 0.6,
          };
        }
      }
    } catch {
      // Invalid URL
    }

    return this.noThreat();
  }

  /**
   * Check downloads for dangerous file types
   */
  private checkDownload(url: string): LayerResult {
    const urlLower = url.toLowerCase();

    for (const ext of DANGEROUS_EXTENSIONS) {
      if (urlLower.endsWith(ext)) {
        return {
          layer: this.name,
          threatDetected: true,
          threatType: 'suspicious_download',
          severity: 'high',
          description: `This ${ext} file could be dangerous`,
          confidence: 0.8,
        };
      }
    }

    return this.noThreat();
  }

  /**
   * Check for credential theft attempts
   */
  private checkCredentialTheft(request: ProtectionRequest): LayerResult {
    const content = request.context?.pageContent || '';
    const url = request.url;

    // Check if this looks like a login form on a suspicious site
    let hasPasswordField = false;
    for (const pattern of CREDENTIAL_THEFT_PATTERNS) {
      if (pattern.test(content)) {
        hasPasswordField = true;
        break;
      }
    }

    if (hasPasswordField) {
      // Check if the domain looks legitimate
      try {
        const hostname = new URL(url).hostname;
        const isKnownDomain = this.isKnownTrustedDomain(hostname);

        if (!isKnownDomain) {
          // Unknown site with login form - warn user
          return {
            layer: this.name,
            threatDetected: true,
            threatType: 'credential_theft',
            severity: 'medium',
            description: 'Be careful entering credentials on unfamiliar sites',
            confidence: 0.5,
          };
        }
      } catch {
        // Invalid URL
      }
    }

    return this.noThreat();
  }

  /**
   * Check for homograph attacks (IDN spoofing)
   */
  private hasHomographAttack(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      // Check if hostname contains non-ASCII characters that look like ASCII
      // Common substitutions: а (cyrillic a) for a, о (cyrillic o) for o, etc.
      const nonAscii = /[^\x00-\x7F]/;
      if (nonAscii.test(hostname)) {
        // Has non-ASCII characters - potential homograph attack
        return true;
      }
    } catch {
      // Invalid URL
    }

    return false;
  }

  /**
   * Check if domain is a known trusted domain
   */
  private isKnownTrustedDomain(hostname: string): boolean {
    const trustedDomains = [
      'google.com',
      'microsoft.com',
      'apple.com',
      'amazon.com',
      'facebook.com',
      'github.com',
      'paypal.com',
      'stripe.com',
      'supabase.com',
      'netlify.com',
      'vercel.com',
      'thevybe.global',
    ];

    return trustedDomains.some(
      domain => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  }
}

/**
 * Factory function
 */
export function createThreatProtectionLayer(): ThreatProtectionLayer {
  return new ThreatProtectionLayer();
}
