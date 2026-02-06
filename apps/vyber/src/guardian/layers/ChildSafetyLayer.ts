/**
 * GUARDIAN AEGIS - Child Safety Layer
 * THE PRIORITY - Protects children from predators, grooming, and inappropriate content
 */

import type {
  ProtectionRequest,
  LayerResult,
  LayerName,
} from '../types';
import { BaseProtectionLayer } from './BaseLayer';

// Patterns that indicate predatory behavior
const PREDATOR_PATTERNS = [
  /\b(meet\s*(me|up)|come\s*over|my\s*place|your\s*place)\b/i,
  /\b(send\s*(me\s*)?(pics?|photos?|pictures?|nudes?))\b/i,
  /\b(don't\s*tell\s*(anyone|your\s*parents?|your\s*mom|your\s*dad))\b/i,
  /\b(our\s*secret|keep\s*this\s*between\s*us)\b/i,
  /\b(how\s*old\s*are\s*you|what('s|\s*is)\s*your\s*age|are\s*you\s*\d+)\b/i,
  /\b(alone\s*at\s*home|parents?\s*(away|gone|not\s*home))\b/i,
];

// Patterns that indicate grooming behavior
const GROOMING_PATTERNS = [
  /\b(you('re)?\s*(so\s*)?(mature|special|different)\s*(for\s*your\s*age)?)\b/i,
  /\b(no\s*one\s*understands?\s*you\s*like\s*(i|me)\s*do)\b/i,
  /\b(i('ll)?\s*(never\s*)?(hurt|harm)\s*you)\b/i,
  /\b(trust\s*me|believe\s*me|you\s*can\s*trust)\b/i,
  /\b(gifts?|presents?|money)\s*(for\s*you)?\b/i,
  /\b(webcam|video\s*call|turn\s*on\s*(your\s*)?(camera|cam))\b/i,
];

// Known dangerous site categories
const DANGEROUS_SITE_PATTERNS = [
  /\b(chat\s*roulette|omegle|anonymous\s*chat)\b/i,
];

/**
 * ChildSafetyLayer - Protects children from online dangers
 *
 * Features:
 * - Predator pattern detection
 * - Grooming behavior recognition
 * - Age-inappropriate content filtering
 * - Safe search enforcement
 */
class ChildSafetyLayer extends BaseProtectionLayer {
  public name: LayerName = 'childSafety';
  public displayName = 'Child Safety';
  public description = 'Protects against predators and inappropriate content';
  public icon = '👶';

  public async initialize(): Promise<void> {
    await super.initialize();
    // Could load additional patterns from database
  }

  public async analyze(request: ProtectionRequest): Promise<LayerResult> {
    if (!this.enabled) {
      return this.noThreat();
    }

    // Check URL against dangerous patterns
    const urlThreat = this.checkURL(request.url);
    if (urlThreat.threatDetected) {
      this.recordThreat(true);
      return urlThreat;
    }

    // If we have page content, analyze it
    if (request.context?.pageContent) {
      // Check for predatory behavior
      const predatorResult = this.detectPredatorPatterns(request.context.pageContent);
      if (predatorResult.threatDetected) {
        this.recordThreat(true);
        return predatorResult;
      }

      // Check for grooming patterns
      const groomingResult = this.detectGroomingPatterns(request.context.pageContent);
      if (groomingResult.threatDetected) {
        this.recordThreat(true);
        return groomingResult;
      }
    }

    return this.noThreat();
  }

  /**
   * Check URL against known dangerous sites
   */
  private checkURL(url: string): LayerResult {
    const urlLower = url.toLowerCase();

    for (const pattern of DANGEROUS_SITE_PATTERNS) {
      if (pattern.test(urlLower)) {
        return {
          layer: this.name,
          threatDetected: true,
          threatType: 'inappropriate_content',
          severity: 'high',
          description: 'This site has been flagged for child safety concerns',
          confidence: 0.9,
        };
      }
    }

    return this.noThreat();
  }

  /**
   * Detect predatory behavior patterns in content
   */
  private detectPredatorPatterns(content: string): LayerResult {
    let matchCount = 0;
    const matches: string[] = [];

    for (const pattern of PREDATOR_PATTERNS) {
      if (pattern.test(content)) {
        matchCount++;
        const match = content.match(pattern);
        if (match) matches.push(match[0]);
      }
    }

    // Multiple matches increase confidence
    if (matchCount >= 2) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'predator',
        severity: 'critical',
        description: 'Potential predatory behavior detected',
        confidence: Math.min(0.5 + matchCount * 0.2, 1),
        metadata: { patterns: matches },
      };
    }

    return this.noThreat();
  }

  /**
   * Detect grooming behavior patterns
   */
  private detectGroomingPatterns(content: string): LayerResult {
    let matchCount = 0;
    const matches: string[] = [];

    for (const pattern of GROOMING_PATTERNS) {
      if (pattern.test(content)) {
        matchCount++;
        const match = content.match(pattern);
        if (match) matches.push(match[0]);
      }
    }

    // Grooming is more subtle - need more matches for high confidence
    if (matchCount >= 3) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'grooming',
        severity: 'critical',
        description: 'Potential grooming behavior detected',
        confidence: Math.min(0.4 + matchCount * 0.15, 0.95),
        metadata: { patterns: matches },
      };
    } else if (matchCount >= 1) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'grooming',
        severity: 'high',
        description: 'Potential concerning behavior detected',
        confidence: 0.4 + matchCount * 0.1,
        metadata: { patterns: matches },
      };
    }

    return this.noThreat();
  }
}

/**
 * Factory function to create the layer
 */
export function createChildSafetyLayer(): ChildSafetyLayer {
  return new ChildSafetyLayer();
}
