/**
 * Advanced Error Tracking & Feedback Loop System
 *
 * Features:
 * - User journey tracking
 * - Error context enrichment
 * - Automatic categorization
 * - Performance impact analysis
 * - User feedback integration
 * - Recovery suggestions
 */

import * as Sentry from '@sentry/react';
import { supabase } from './supabase';

// =============================================================================
// TYPES
// =============================================================================

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export type ErrorCategory =
  | 'network'
  | 'database'
  | 'authentication'
  | 'validation'
  | 'permission'
  | 'performance'
  | 'ui'
  | 'business_logic'
  | 'third_party'
  | 'unknown';

export interface ErrorContext {
  // User Context
  userId?: string;
  userSegment?: string;
  sessionId: string;

  // Error Details
  category: ErrorCategory;
  severity: ErrorSeverity;
  component?: string;
  action?: string;

  // Technical Context
  route: string;
  userAgent: string;
  viewport: { width: number; height: number };
  network: 'online' | 'offline' | 'slow';

  // Performance Context
  memoryUsage?: number;
  pageLoadTime?: number;
  apiLatency?: number;

  // User Journey
  recentActions: UserAction[];
  timeOnPage: number;

  // Additional Data
  metadata?: Record<string, unknown>;
}

export interface UserAction {
  type: 'click' | 'input' | 'navigation' | 'api_call' | 'error';
  target: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorReport {
  id: string;
  timestamp: number;
  error: Error | string;
  context: ErrorContext;
  recoveryAttempted: boolean;
  recovered: boolean;
  userFeedback?: UserFeedback;
}

export interface UserFeedback {
  helpful: boolean;
  message?: string;
  timestamp: number;
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

class ErrorTrackingService {
  private sessionId: string;
  private userId?: string;
  private userActions: UserAction[] = [];
  private sessionStart: number;
  private errorReports: Map<string, ErrorReport> = new Map();

  private readonly MAX_ACTIONS = 50; // Keep last 50 actions
  private readonly SLOW_NETWORK_THRESHOLD = 3000; // 3s

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.initializeTracking();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      this.trackAction({
        type: 'navigation',
        target: document.hidden ? 'page_hidden' : 'page_visible',
        timestamp: Date.now(),
      });
    });

    // Track online/offline
    window.addEventListener('online', () => {
      this.trackAction({
        type: 'navigation',
        target: 'network_online',
        timestamp: Date.now(),
      });
    });

    window.addEventListener('offline', () => {
      this.trackAction({
        type: 'navigation',
        target: 'network_offline',
        timestamp: Date.now(),
      });
    });

    // Track slow network
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener?.('change', () => {
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          this.trackAction({
            type: 'navigation',
            target: 'network_slow',
            timestamp: Date.now(),
            metadata: { effectiveType: connection.effectiveType },
          });
        }
      });
    }
  }

  // ===========================================================================
  // USER IDENTIFICATION
  // ===========================================================================

  setUser(userId: string, segment?: string): void {
    this.userId = userId;

    Sentry.setUser({
      id: userId,
      segment,
    });
  }

  clearUser(): void {
    this.userId = undefined;
    Sentry.setUser(null);
  }

  // ===========================================================================
  // ACTION TRACKING
  // ===========================================================================

  trackAction(action: UserAction): void {
    this.userActions.push(action);

    // Keep only last MAX_ACTIONS
    if (this.userActions.length > this.MAX_ACTIONS) {
      this.userActions.shift();
    }

    // Add to Sentry breadcrumb
    Sentry.addBreadcrumb({
      category: action.type,
      message: action.target,
      level: 'info',
      timestamp: action.timestamp / 1000,
      data: action.metadata,
    });
  }

  trackClick(target: string, metadata?: Record<string, unknown>): void {
    this.trackAction({
      type: 'click',
      target,
      timestamp: Date.now(),
      metadata,
    });
  }

  trackNavigation(path: string, metadata?: Record<string, unknown>): void {
    this.trackAction({
      type: 'navigation',
      target: path,
      timestamp: Date.now(),
      metadata,
    });
  }

  trackApiCall(endpoint: string, metadata?: Record<string, unknown>): void {
    this.trackAction({
      type: 'api_call',
      target: endpoint,
      timestamp: Date.now(),
      metadata,
    });
  }

  // ===========================================================================
  // ERROR CATEGORIZATION
  // ===========================================================================

  private categorizeError(error: Error | string): ErrorCategory {
    const message = typeof error === 'string' ? error : error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('supabase') || message.includes('database') || message.includes('query')) {
      return 'database';
    }
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return 'authentication';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    if (message.includes('permission') || message.includes('forbidden') || message.includes('unauthorized')) {
      return 'permission';
    }
    if (message.includes('slow') || message.includes('performance') || message.includes('memory')) {
      return 'performance';
    }
    if (message.includes('render') || message.includes('component') || message.includes('ui')) {
      return 'ui';
    }

    return 'unknown';
  }

  private determineSeverity(error: Error | string, category: ErrorCategory): ErrorSeverity {
    // Critical errors
    if (category === 'authentication' || category === 'database') {
      return 'critical';
    }

    // Errors that block user flow
    if (category === 'permission' || category === 'business_logic') {
      return 'error';
    }

    // Recoverable errors
    if (category === 'network' || category === 'validation') {
      return 'warning';
    }

    // Everything else
    return 'info';
  }

  // ===========================================================================
  // CONTEXT BUILDING
  // ===========================================================================

  private buildErrorContext(
    category: ErrorCategory,
    severity: ErrorSeverity,
    component?: string,
    action?: string,
    metadata?: Record<string, unknown>
  ): ErrorContext {
    const now = Date.now();

    // Network status
    const isOnline = navigator.onLine;
    const connection = (navigator as any).connection;
    const isSlow = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';

    // Memory usage
    const performance = (window.performance as any);
    const memoryUsage = performance?.memory?.usedJSHeapSize;

    return {
      userId: this.userId,
      sessionId: this.sessionId,
      category,
      severity,
      component,
      action,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      network: !isOnline ? 'offline' : isSlow ? 'slow' : 'online',
      memoryUsage,
      pageLoadTime: performance?.timing?.loadEventEnd - performance?.timing?.navigationStart,
      recentActions: [...this.userActions],
      timeOnPage: now - this.sessionStart,
      metadata,
    };
  }

  // ===========================================================================
  // ERROR REPORTING
  // ===========================================================================

  async reportError(
    error: Error | string,
    options?: {
      component?: string;
      action?: string;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      metadata?: Record<string, unknown>;
      userFacing?: boolean;
    }
  ): Promise<string> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Categorize error
    const category = options?.category || this.categorizeError(error);
    const severity = options?.severity || this.determineSeverity(error, category);

    // Build context
    const context = this.buildErrorContext(
      category,
      severity,
      options?.component,
      options?.action,
      options?.metadata
    );

    // Create report
    const report: ErrorReport = {
      id: errorId,
      timestamp: Date.now(),
      error,
      context,
      recoveryAttempted: false,
      recovered: false,
    };

    this.errorReports.set(errorId, report);

    // Send to Sentry
    Sentry.captureException(error, {
      level: severity,
      tags: {
        category,
        component: options?.component || 'unknown',
        action: options?.action || 'unknown',
        network: context.network,
      },
      contexts: {
        user_journey: {
          recentActions: context.recentActions.slice(-10), // Last 10 actions
          timeOnPage: context.timeOnPage,
        },
        performance: {
          memoryUsage: context.memoryUsage,
          pageLoadTime: context.pageLoadTime,
        },
      },
      extra: options?.metadata,
    });

    // Log to Supabase for analytics
    this.logToDatabase(report);

    // Track error action
    this.trackAction({
      type: 'error',
      target: `${category}:${options?.component || 'unknown'}`,
      timestamp: Date.now(),
      metadata: {
        errorId,
        severity,
        message: typeof error === 'string' ? error : error.message,
      },
    });

    return errorId;
  }

  // ===========================================================================
  // DATABASE LOGGING
  // ===========================================================================

  private async logToDatabase(report: ErrorReport): Promise<void> {
    try {
      await supabase.from('error_logs').insert({
        error_id: report.id,
        session_id: report.context.sessionId,
        user_id: report.context.userId,
        timestamp: new Date(report.timestamp).toISOString(),
        category: report.context.category,
        severity: report.context.severity,
        component: report.context.component,
        action: report.context.action,
        error_message: typeof report.error === 'string' ? report.error : report.error.message,
        error_stack: typeof report.error === 'string' ? null : report.error.stack,
        route: report.context.route,
        user_agent: report.context.userAgent,
        network_status: report.context.network,
        viewport: report.context.viewport,
        memory_usage: report.context.memoryUsage,
        page_load_time: report.context.pageLoadTime,
        time_on_page: report.context.timeOnPage,
        recent_actions: report.context.recentActions.slice(-10),
        metadata: report.context.metadata,
        recovery_attempted: report.recoveryAttempted,
        recovered: report.recovered,
      });
    } catch (err) {
      console.error('[ErrorTracking] Failed to log to database:', err);
    }
  }

  // ===========================================================================
  // RECOVERY TRACKING
  // ===========================================================================

  markRecoveryAttempted(errorId: string, recovered: boolean): void {
    const report = this.errorReports.get(errorId);
    if (!report) return;

    report.recoveryAttempted = true;
    report.recovered = recovered;

    // Update database
    supabase
      .from('error_logs')
      .update({
        recovery_attempted: true,
        recovered,
        updated_at: new Date().toISOString(),
      })
      .eq('error_id', errorId)
      .then();
  }

  // ===========================================================================
  // USER FEEDBACK
  // ===========================================================================

  async submitFeedback(errorId: string, feedback: UserFeedback): Promise<void> {
    const report = this.errorReports.get(errorId);
    if (!report) return;

    report.userFeedback = feedback;

    // Update database
    try {
      await supabase.from('error_logs').update({
        user_feedback_helpful: feedback.helpful,
        user_feedback_message: feedback.message,
        user_feedback_timestamp: new Date(feedback.timestamp).toISOString(),
      }).eq('error_id', errorId);

      // Send to Sentry as feedback
      Sentry.captureFeedback({
        message: feedback.message || (feedback.helpful ? 'Error recovery helpful' : 'Error recovery not helpful'),
        associatedEventId: errorId,
      });
    } catch (err) {
      console.error('[ErrorTracking] Failed to submit feedback:', err);
    }
  }

  // ===========================================================================
  // PERFORMANCE MONITORING
  // ===========================================================================

  trackPerformance(metric: string, value: number, metadata?: Record<string, unknown>): void {
    // Add to Sentry
    Sentry.metrics.distribution(metric, value, {
      tags: metadata as Record<string, string>,
    });

    // Track as action
    this.trackAction({
      type: 'navigation',
      target: `performance:${metric}`,
      timestamp: Date.now(),
      metadata: { value, ...metadata },
    });
  }

  // ===========================================================================
  // ANALYTICS
  // ===========================================================================

  async getErrorAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalErrors: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    topComponents: Array<{ component: string; count: number }>;
    recoveryRate: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_error_analytics', {
        time_range: timeRange,
        session_id: this.sessionId,
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('[ErrorTracking] Failed to get analytics:', err);
      return {
        totalErrors: 0,
        byCategory: {} as Record<ErrorCategory, number>,
        bySeverity: {} as Record<ErrorSeverity, number>,
        topComponents: [],
        recoveryRate: 0,
      };
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const errorTracking = new ErrorTrackingService();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export const trackError = (error: Error | string, options?: Parameters<typeof errorTracking.reportError>[1]) =>
  errorTracking.reportError(error, options);

export const trackAction = (action: UserAction) => errorTracking.trackAction(action);

export const trackClick = (target: string, metadata?: Record<string, unknown>) =>
  errorTracking.trackClick(target, metadata);

export const trackNavigation = (path: string, metadata?: Record<string, unknown>) =>
  errorTracking.trackNavigation(path, metadata);

export const trackApiCall = (endpoint: string, metadata?: Record<string, unknown>) =>
  errorTracking.trackApiCall(endpoint, metadata);

export const submitFeedback = (errorId: string, feedback: UserFeedback) =>
  errorTracking.submitFeedback(errorId, feedback);

export const trackPerformance = (metric: string, value: number, metadata?: Record<string, unknown>) =>
  errorTracking.trackPerformance(metric, value, metadata);

export const setUser = (userId: string, segment?: string) => errorTracking.setUser(userId, segment);

export const clearUser = () => errorTracking.clearUser();
