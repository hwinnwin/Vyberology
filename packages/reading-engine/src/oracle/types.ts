/**
 * Five-Number Oracle Type Definitions
 */

import { Element, Chakra, NumberMeaning } from './meaningBank';
import { HarmonicPattern, PatternAnalysis } from './patterns';

/**
 * Oracle reading request
 */
export interface OracleReadingRequest {
  numbers: number[];                  // Exactly 5 numbers (1-99)
  captureTimestamps?: Date[];         // When each number was captured
  captureMethods?: CaptureMethod[];   // How each was captured
  sessionId?: string;                 // Optional session tracking
  sessionType?: SessionType;          // Live, async, story, etc.
  userId?: string;                    // Optional user ID
  tier?: ReadingTier;                 // Free, basic, premium, team
}

/**
 * Capture method types
 */
export type CaptureMethod =
  | 'time'      // Clock capture (11:11)
  | 'manual'    // User typed it in
  | 'image'     // OCR from photo
  | 'pattern'   // From pattern library
  | 'comment'   // From live stream comments
  | 'live'      // Live interactive selection
  | 'random';   // Random generation

/**
 * Session types
 */
export type SessionType =
  | 'async'     // Asynchronous (user captures over time)
  | 'live'      // Live stream with real-time interaction
  | 'story'     // Instagram/TikTok story format
  | 'instant';  // All 5 at once

/**
 * Reading tiers (monetization)
 */
export type ReadingTier =
  | 'free'      // Basic interpretation
  | 'basic'     // Enhanced with action plan
  | 'premium'   // Full analysis + audio/video
  | 'team';     // Group/brand reading with rollout plan

/**
 * Complete Oracle Reading
 */
export interface OracleReading {
  // Core data
  id?: string;
  userId?: string;
  numbers: number[];
  coreFrequencies: number[];          // Reduced to 1-9 (or master)

  // Meanings
  meanings: NumberMeaning[];          // Individual number interpretations

  // Pattern analysis
  pattern: PatternAnalysis;

  // Reading content
  title: string;
  synthesis: string;                  // 2-3 sentences unifying all 5
  essenceSentence: string;            // One powerful closing line
  cta: string;                        // Call to action

  // Metadata
  sessionId?: string;
  sessionType?: SessionType;
  captureTimestamps?: Date[];
  captureMethods?: CaptureMethod[];
  tier: ReadingTier;

  // Timestamps
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Reading response format (for API)
 */
export interface OracleReadingResponse {
  success: boolean;
  reading?: OracleReading;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Oracle history entry (for analytics)
 */
export interface OracleHistoryEntry {
  id: string;
  userId: string;
  numbers: number[];
  pattern: HarmonicPattern;
  patternStrength: number;
  dominantElement: Element;
  dominantChakra: Chakra;
  tier: ReadingTier;
  shared: boolean;
  saved: boolean;
  feedbackRating?: number;           // 1-5 stars
  createdAt: Date;
}

/**
 * Oracle analytics (aggregated)
 */
export interface OracleAnalytics {
  totalReadings: number;
  patternDistribution: Record<HarmonicPattern, number>;
  popularNumbers: Array<{ number: number; count: number }>;
  avgPatternStrength: number;
  elementDistribution: Record<Element, number>;
  chakraDistribution: Record<Chakra, number>;
  tierDistribution: Record<ReadingTier, number>;
  engagementRate: number;            // % shared or rated
}

/**
 * User oracle stats
 */
export interface UserOracleStats {
  userId: string;
  totalReadings: number;
  currentStreak: number;
  longestStreak: number;
  favoritePattern: HarmonicPattern;
  frequentNumbers: number[];
  dominantElement: Element;
  dominantChakra: Chakra;
}
