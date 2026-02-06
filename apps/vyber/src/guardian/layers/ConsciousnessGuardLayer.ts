/**
 * GUARDIAN AEGIS - Consciousness Guard Layer
 * THE VYBE SPECIAL - Protects attention and mental wellbeing
 *
 * "We protect your mind, not just your data"
 */

import type {
  ProtectionRequest,
  LayerResult,
  LayerName,
  EngagementPattern,
  ScreenTimeData,
} from '../types';
import { BaseProtectionLayer } from './BaseLayer';

// Rage bait indicators
const RAGE_BAIT_PATTERNS = [
  /you won't believe/i,
  /shocking/i,
  /outrage/i,
  /destroyed/i,
  /slammed/i,
  /exposed/i,
  /the truth about/i,
  /what they don't want you to know/i,
  /!!!+/,
  /\?\?\?+/,
  /BREAKING/i,
  /MUST SEE/i,
  /goes viral/i,
  /everyone is talking about/i,
  /you need to see this/i,
];

// Attention hijacking patterns
const ATTENTION_HIJACK_PATTERNS = [
  /autoplay/i,
  /notification.*permission/i,
  /subscribe.*bell/i,
  /turn on notifications/i,
  /don't miss/i,
  /limited time/i,
  /act now/i,
  /last chance/i,
  /countdown/i,
];

// Infinite scroll indicators
const INFINITE_SCROLL_INDICATORS = [
  'infinite-scroll',
  'endless-scroll',
  'load-more',
  'lazy-load',
  'virtualized',
];

// Wellness messages (gentle, kind, caring)
const WELLNESS_MESSAGES = {
  shortBreak: [
    "You've been browsing for a while. How about a quick stretch? 🌸",
    "Time for a breath? Your wellbeing matters to us. 💫",
    "A short break can help you feel refreshed. 🌿",
  ],
  longSession: [
    "You've been here for over an hour. Remember to hydrate! 💧",
    "Long session! Your eyes and mind might appreciate a break. 🌙",
    "Take a moment to check in with yourself. How are you feeling? 🦋",
  ],
  doomScroll: [
    "Looks like you're in a scroll loop. Is this serving you? 🤔",
    "Infinite scroll can be sneaky. Want to take a break? 🌊",
    "You've been scrolling a lot. Time to come up for air? 🌬️",
  ],
  rageBait: [
    "This content might be designed to provoke strong emotions. Take a breath. 🧘",
    "Headlines can be misleading. Consider pausing before reacting. 💭",
    "Your peace is valuable. Is this worth your energy? ✨",
  ],
};

/**
 * ConsciousnessGuardLayer - Protects mental wellbeing
 */
class ConsciousnessGuardLayer extends BaseProtectionLayer {
  public name: LayerName = 'consciousnessGuard';
  public displayName = 'Consciousness Guard';
  public description = 'Protects your attention and wellbeing';
  public icon = '🧘';

  private screenTimeData: ScreenTimeData;
  private engagementPatterns: EngagementPattern[] = [];
  private lastBreakReminder: number = 0;
  private breakReminderInterval = 30 * 60 * 1000; // 30 minutes

  constructor() {
    super();
    this.screenTimeData = this.initScreenTimeData();
  }

  private initScreenTimeData(): ScreenTimeData {
    return {
      sessionStart: Date.now(),
      totalDuration: 0,
      activeTime: 0,
      scrollEvents: 0,
      pageViews: 0,
      breaks: 0,
    };
  }

  public async initialize(): Promise<void> {
    await super.initialize();
    this.startEngagementTracking();
  }

  public async analyze(request: ProtectionRequest): Promise<LayerResult> {
    if (!this.enabled) {
      return this.noThreat();
    }

    // Update screen time
    this.updateScreenTime();
    this.screenTimeData.pageViews++;

    // Check session duration
    const durationResult = this.checkSessionDuration();
    if (durationResult.threatDetected) {
      return durationResult;
    }

    // Check for doom scrolling
    const doomScrollResult = this.checkDoomScrolling();
    if (doomScrollResult.threatDetected) {
      this.recordThreat();
      return doomScrollResult;
    }

    // Check content for rage bait
    if (request.context?.pageContent) {
      const rageBaitResult = this.checkRageBait(request.context.pageContent);
      if (rageBaitResult.threatDetected) {
        this.recordThreat();
        return rageBaitResult;
      }

      // Check for attention hijacking
      const attentionResult = this.checkAttentionHijack(request.context.pageContent);
      if (attentionResult.threatDetected) {
        this.recordThreat();
        return attentionResult;
      }
    }

    return this.noThreat();
  }

  /**
   * Check session duration and suggest breaks
   */
  private checkSessionDuration(): LayerResult {
    const now = Date.now();
    const sessionMinutes = (now - this.screenTimeData.sessionStart) / 60000;

    // Check if we should remind about a break
    if (now - this.lastBreakReminder < this.breakReminderInterval) {
      return this.noThreat();
    }

    if (sessionMinutes > 120) {
      // Over 2 hours
      this.lastBreakReminder = now;
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'doom_scroll',
        severity: 'low',
        description: this.getRandomMessage('longSession'),
        confidence: 1,
        metadata: { sessionMinutes: Math.round(sessionMinutes) },
      };
    }

    if (sessionMinutes > 60) {
      // Over 1 hour
      this.lastBreakReminder = now;
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'doom_scroll',
        severity: 'low',
        description: this.getRandomMessage('shortBreak'),
        confidence: 0.8,
        metadata: { sessionMinutes: Math.round(sessionMinutes) },
      };
    }

    return this.noThreat();
  }

  /**
   * Detect doom scrolling patterns
   */
  private checkDoomScrolling(): LayerResult {
    const recentPatterns = this.engagementPatterns.filter(
      p => Date.now() - p.timestamp < 60000 // Last minute
    );

    const scrollEvents = recentPatterns.filter(p => p.type === 'scroll');
    const highIntensityScrolls = scrollEvents.filter(p => p.intensity > 5);

    // Doom scrolling = many rapid scrolls with few pauses
    if (scrollEvents.length > 30 && highIntensityScrolls.length > 10) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'doom_scroll',
        severity: 'low',
        description: this.getRandomMessage('doomScroll'),
        confidence: 0.7,
        metadata: {
          scrollsPerMinute: scrollEvents.length,
          highIntensityRatio: highIntensityScrolls.length / scrollEvents.length,
        },
      };
    }

    return this.noThreat();
  }

  /**
   * Check content for rage bait
   */
  private checkRageBait(content: string): LayerResult {
    let matchCount = 0;
    const matches: string[] = [];

    for (const pattern of RAGE_BAIT_PATTERNS) {
      if (pattern.test(content)) {
        matchCount++;
        const match = content.match(pattern);
        if (match) matches.push(match[0]);
      }
    }

    // Multiple indicators = higher confidence
    if (matchCount >= 3) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'rage_bait',
        severity: 'low',
        description: this.getRandomMessage('rageBait'),
        confidence: Math.min(0.4 + matchCount * 0.1, 0.9),
        metadata: { indicators: matches },
      };
    }

    return this.noThreat();
  }

  /**
   * Check for attention hijacking techniques
   */
  private checkAttentionHijack(content: string): LayerResult {
    let matchCount = 0;

    for (const pattern of ATTENTION_HIJACK_PATTERNS) {
      if (pattern.test(content)) {
        matchCount++;
      }
    }

    // Check for infinite scroll
    const hasInfiniteScroll = INFINITE_SCROLL_INDICATORS.some(
      indicator => content.toLowerCase().includes(indicator)
    );

    if (matchCount >= 2 || (hasInfiniteScroll && matchCount >= 1)) {
      return {
        layer: this.name,
        threatDetected: true,
        threatType: 'attention_hijack',
        severity: 'low',
        description: 'This site uses techniques to capture your attention',
        confidence: 0.6,
        metadata: { hasInfiniteScroll },
      };
    }

    return this.noThreat();
  }

  /**
   * Start tracking engagement patterns
   */
  private startEngagementTracking(): void {
    if (typeof window === 'undefined') return;

    // Track scroll events
    window.addEventListener('scroll', () => {
      this.recordEngagement('scroll');
    });

    // Track visibility changes (tab switches)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched away - potential break
        this.screenTimeData.breaks++;
      }
    });
  }

  /**
   * Record an engagement event
   */
  private recordEngagement(type: EngagementPattern['type']): void {
    const now = Date.now();

    // Calculate intensity based on frequency
    const recentSameType = this.engagementPatterns.filter(
      p => p.type === type && now - p.timestamp < 1000
    );

    this.engagementPatterns.push({
      type,
      timestamp: now,
      intensity: recentSameType.length + 1,
    });

    // Update screen time
    this.screenTimeData.scrollEvents++;

    // Keep only last 5 minutes of patterns
    const fiveMinutesAgo = now - 300000;
    this.engagementPatterns = this.engagementPatterns.filter(
      p => p.timestamp > fiveMinutesAgo
    );
  }

  /**
   * Update screen time tracking
   */
  private updateScreenTime(): void {
    this.screenTimeData.totalDuration = Date.now() - this.screenTimeData.sessionStart;
    this.screenTimeData.activeTime = this.screenTimeData.totalDuration; // Simplified
  }

  /**
   * Get a random wellness message
   */
  private getRandomMessage(type: keyof typeof WELLNESS_MESSAGES): string {
    const messages = WELLNESS_MESSAGES[type];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get screen time data
   */
  public getScreenTimeData(): ScreenTimeData {
    this.updateScreenTime();
    return { ...this.screenTimeData };
  }

  /**
   * Reset session (user took a break)
   */
  public resetSession(): void {
    this.screenTimeData = this.initScreenTimeData();
    this.engagementPatterns = [];
    this.lastBreakReminder = 0;
  }

  /**
   * Acknowledge a break was taken
   */
  public acknowledgeBreak(): void {
    this.screenTimeData.breaks++;
    this.lastBreakReminder = Date.now();
  }
}

/**
 * Factory function
 */
export function createConsciousnessGuardLayer(): ConsciousnessGuardLayer {
  return new ConsciousnessGuardLayer();
}
