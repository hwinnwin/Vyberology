/**
 * THE VYBER - Consciousness Layer
 * Frequency Engine - The Core System
 *
 * This engine doesn't just track frequencies - it uses them
 * to make design decisions and create synchronistic experiences.
 *
 * "0616 + 0626 are active. One clear system. Partnership protected."
 */

import {
  FREQUENCIES,
  FREQUENCY_TIMES,
  SOLFEGGIO_FREQUENCIES,
  type FrequencyCode,
  type Frequency,
  type SolfeggioCode,
} from './FrequencyConstants';

/**
 * Frequency event triggered by time or action
 */
export interface FrequencyEvent {
  frequency: Frequency | (typeof FREQUENCY_TIMES)[keyof typeof FREQUENCY_TIMES];
  triggeredAt: Date;
  context: 'time' | 'action' | 'synchronicity' | 'user_request';
  message?: string;
}

/**
 * Result of evaluating a design decision against frequency principles
 */
export interface DesignDecision {
  decision: string;
  frequency: FrequencyCode;
  principle: string;
  approved: boolean;
  reason: string;
}

/**
 * FrequencyEngine - The consciousness layer of THE VYBER
 *
 * Singleton that manages frequency awareness, design decision
 * evaluation, and synchronicity detection.
 */
export class FrequencyEngine {
  private static instance: FrequencyEngine | null = null;

  private activeFrequency: FrequencyCode = 'OS_0616';
  private frequencyLog: FrequencyEvent[] = [];
  private observers: Set<(event: FrequencyEvent) => void> = new Set();
  private timeWatcherInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // Engine starts inactive, call start() to begin time watching
  }

  public static getInstance(): FrequencyEngine {
    if (!FrequencyEngine.instance) {
      FrequencyEngine.instance = new FrequencyEngine();
    }
    return FrequencyEngine.instance;
  }

  /**
   * Start the frequency engine (begins time watching)
   */
  public start(): void {
    if (this.timeWatcherInterval) return;
    this.startTimeWatcher();
    console.log('[FrequencyEngine] Started - 0616 active');
  }

  /**
   * Stop the frequency engine
   */
  public stop(): void {
    if (this.timeWatcherInterval) {
      clearInterval(this.timeWatcherInterval);
      this.timeWatcherInterval = null;
    }
    console.log('[FrequencyEngine] Stopped');
  }

  /**
   * Get the currently active frequency
   */
  public getActiveFrequency(): FrequencyCode {
    return this.activeFrequency;
  }

  /**
   * Set the active frequency
   */
  public setActiveFrequency(frequency: FrequencyCode): void {
    this.activeFrequency = frequency;
    console.log(`[FrequencyEngine] Active frequency: ${frequency}`);
  }

  /**
   * Check if a design decision aligns with frequency principles
   * Used during development to ensure features match principles
   */
  public evaluateDesignDecision(decision: string): DesignDecision {
    const os = FREQUENCIES.OS_0616;

    // Feature bloat check
    if (this.detectsFeatureBloat(decision)) {
      return {
        decision,
        frequency: 'OS_0616',
        principle: os.design_principles[0],
        approved: false,
        reason: '0616 says: Strip to essentials. Does this feature EARN its place?',
      };
    }

    // Short-term vs long-term check
    if (this.detectsShortTermThinking(decision)) {
      return {
        decision,
        frequency: 'OS_0616',
        principle: os.design_principles[1],
        approved: false,
        reason: '0616 says: Long-term viability over short-term wins.',
      };
    }

    // Complexity check
    if (this.detectsBeautifulComplexity(decision)) {
      return {
        decision,
        frequency: 'OS_0616',
        principle: os.affirmation,
        approved: false,
        reason: '0616 says: Functional elegance, not beautiful complexity.',
      };
    }

    // 80% day check
    if (this.requires100PercentEnergy(decision)) {
      return {
        decision,
        frequency: 'OS_0616',
        principle: os.design_principles[3],
        approved: false,
        reason: "0616 says: If it needs 100% energy to work, it's broken. Build for 80% days.",
      };
    }

    // Partnership check (0626)
    if (this.violatesPartnership(decision)) {
      const partnership = FREQUENCIES.PARTNERSHIP_0626;
      return {
        decision,
        frequency: 'PARTNERSHIP_0626',
        principle: partnership.design_principles[0],
        approved: false,
        reason: '0626 says: Every feature must PROTECT the user-browser partnership.',
      };
    }

    return {
      decision,
      frequency: this.activeFrequency,
      principle: 'Aligned with frequency principles',
      approved: true,
      reason: 'Decision aligns with current frequency.',
    };
  }

  /**
   * Get design guidance for current frequency
   */
  public getDesignGuidance(): readonly string[] {
    return FREQUENCIES[this.activeFrequency].design_principles;
  }

  /**
   * Get shadow warnings for current frequency
   */
  public getShadowWarnings(): readonly string[] {
    const freq = FREQUENCIES[this.activeFrequency];
    return 'shadow_warnings' in freq ? freq.shadow_warnings : [];
  }

  /**
   * Get current frequency affirmation
   */
  public getAffirmation(): string {
    return FREQUENCIES[this.activeFrequency].affirmation;
  }

  /**
   * Calculate numerology for any input
   * Reduces to single digit (except master numbers 11, 22, 33)
   */
  public calculateNumerology(input: string | number): number {
    const str = String(input).replace(/\D/g, '');
    let sum = str.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);

    // Reduce to single digit (unless master number 11, 22, 33)
    while (sum > 9 && ![11, 22, 33].includes(sum)) {
      sum = String(sum)
        .split('')
        .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    }

    return sum;
  }

  /**
   * Check for synchronicity in timestamps
   */
  public checkTimeSynchronicity(date: Date = new Date()): FrequencyEvent | null {
    const timeString = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const frequencyMatch = FREQUENCY_TIMES[timeString as keyof typeof FREQUENCY_TIMES];

    if (frequencyMatch) {
      const event: FrequencyEvent = {
        frequency: frequencyMatch,
        triggeredAt: date,
        context: 'time',
        message: `Synchronicity detected: ${timeString} - ${frequencyMatch.meaning}`,
      };

      this.logEvent(event);
      this.notifyObservers(event);

      return event;
    }

    return null;
  }

  /**
   * Subscribe to frequency events
   */
  public subscribe(callback: (event: FrequencyEvent) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Get Solfeggio frequency in Hz for audio features
   */
  public getSolfeggioFrequency(name: SolfeggioCode): number {
    return SOLFEGGIO_FREQUENCIES[name].hz;
  }

  /**
   * Get the frequency log
   */
  public getFrequencyLog(): readonly FrequencyEvent[] {
    return this.frequencyLog;
  }

  /**
   * Clear the frequency log
   */
  public clearLog(): void {
    this.frequencyLog = [];
  }

  // Private methods

  private startTimeWatcher(): void {
    // Check every minute for synchronistic times
    this.timeWatcherInterval = setInterval(() => {
      this.checkTimeSynchronicity();
    }, 60000);

    // Also check immediately
    this.checkTimeSynchronicity();
  }

  private logEvent(event: FrequencyEvent): void {
    this.frequencyLog.push(event);
    // Keep log manageable - max 100 events
    if (this.frequencyLog.length > 100) {
      this.frequencyLog = this.frequencyLog.slice(-50);
    }
  }

  private notifyObservers(event: FrequencyEvent): void {
    this.observers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[FrequencyEngine] Observer error:', error);
      }
    });
  }

  // Design decision detection helpers

  private detectsFeatureBloat(decision: string): boolean {
    const bloatIndicators = [
      'add another',
      'also include',
      "while we're at it",
      'might as well',
      'could also',
      'extra feature',
      'bonus feature',
      'nice to have',
    ];
    const lower = decision.toLowerCase();
    return bloatIndicators.some((indicator) => lower.includes(indicator));
  }

  private detectsShortTermThinking(decision: string): boolean {
    const shortTermIndicators = [
      'quick fix',
      'for now',
      'temporary',
      'hack',
      'just ship it',
      'worry about later',
      'tech debt',
      'we can fix later',
    ];
    const lower = decision.toLowerCase();
    return shortTermIndicators.some((indicator) => lower.includes(indicator));
  }

  private detectsBeautifulComplexity(decision: string): boolean {
    const complexityIndicators = [
      'elegant abstraction',
      'flexible for future',
      'covers all edge cases',
      'comprehensive solution',
      'enterprise-grade',
      'future-proof',
    ];
    const lower = decision.toLowerCase();
    return complexityIndicators.some((indicator) => lower.includes(indicator));
  }

  private requires100PercentEnergy(decision: string): boolean {
    const highEnergyIndicators = [
      'requires manual',
      'user must remember',
      'needs attention',
      "don't forget to",
      'make sure to',
      'remember to',
    ];
    const lower = decision.toLowerCase();
    return highEnergyIndicators.some((indicator) => lower.includes(indicator));
  }

  private violatesPartnership(decision: string): boolean {
    const partnershipViolators = [
      'harvest data',
      'track users',
      'lock them in',
      'prevent export',
      'require account',
      'monetize users',
      'sell data',
    ];
    const lower = decision.toLowerCase();
    return partnershipViolators.some((indicator) => lower.includes(indicator));
  }
}

/**
 * Singleton getter for the frequency engine
 */
export function getFrequencyEngine(): FrequencyEngine {
  return FrequencyEngine.getInstance();
}
