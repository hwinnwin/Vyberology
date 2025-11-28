import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { init as initCapacitorSentry } from '@sentry/capacitor';

type UnknownRecord = Record<string, unknown>; // added by Lumen (Stage 4A)

/**
 * Initialize Sentry for error tracking and performance monitoring
 *
 * Features:
 * - Error tracking (JavaScript exceptions, promise rejections)
 * - Performance monitoring (page loads, API calls)
 * - Session replay (see what user saw when error occurred)
 * - Release tracking (associate errors with code versions)
 * - PII scrubbing (remove sensitive user data)
 */
export function initSentry() {
  // Only initialize if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not found. Error tracking disabled. Set VITE_SENTRY_DSN to enable.');
    return;
  }

  const environment = import.meta.env.MODE; // 'development', 'production', 'staging'
  const isProduction = environment === 'production';

  // Initialize Capacitor Sentry for mobile
  if (Capacitor.isNativePlatform()) {
    initCapacitorSentry({
      dsn,
      environment,
      // Lower sample rates for mobile to save bandwidth
      tracesSampleRate: isProduction ? 0.05 : 1.0,
      beforeSend: scrubPII,
    });
  }

  // Initialize React Sentry
  Sentry.init({
    dsn,
    environment,

    // Enable performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Capture 10% of sessions for replay
        maskAllText: true, // Hide all text for privacy
        blockAllMedia: true, // Don't capture images/video
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev

    // Session Replay
    replaysSessionSampleRate: 0.1, // Record 10% of normal sessions
    replaysOnErrorSampleRate: 1.0, // Record 100% of sessions with errors

    // PII Scrubbing
    beforeSend: scrubPII,

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      // Network errors (handled by app)
      'Failed to fetch',
      'NetworkError',
      // Development noise
      'Non-Error promise rejection captured',
    ],

    // Attach release version (if available)
    release: import.meta.env.VITE_APP_VERSION || undefined,
  });
}

/**
 * Scrub Personally Identifiable Information (PII) from error reports
 *
 * Removes:
 * - Full names
 * - Dates of birth
 * - Email addresses
 * - Phone numbers
 */
function scrubPII(event: Sentry.Event): Sentry.Event | null {
  // Scrub breadcrumbs (user actions leading to error)
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
      if (breadcrumb.data && typeof breadcrumb.data === 'object') {
        const breadcrumbData = breadcrumb.data as UnknownRecord;
        // Remove form input data
        if (typeof breadcrumbData.fullName === 'string') breadcrumbData.fullName = '[REDACTED]';
        if (typeof breadcrumbData.dob === 'string') breadcrumbData.dob = '[REDACTED]';
        if (typeof breadcrumbData.name === 'string') breadcrumbData.name = '[REDACTED]';
        if (typeof breadcrumbData.dateOfBirth === 'string') breadcrumbData.dateOfBirth = '[REDACTED]';
        if (typeof breadcrumbData.aName === 'string') breadcrumbData.aName = '[REDACTED]';
        if (typeof breadcrumbData.bName === 'string') breadcrumbData.bName = '[REDACTED]';
        if (typeof breadcrumbData.aDob === 'string') breadcrumbData.aDob = '[REDACTED]';
        if (typeof breadcrumbData.bDob === 'string') breadcrumbData.bDob = '[REDACTED]';
      }

      // Scrub message text
      if (breadcrumb.message) {
        breadcrumb.message = scrubText(breadcrumb.message);
      }

      return breadcrumb;
    });
  }

  // Scrub request data
  if (event.request?.data) {
    const data = event.request.data as UnknownRecord;
    if (typeof data === 'object' && data !== null) {
      if (typeof data.fullName === 'string') data.fullName = '[REDACTED]';
      if (typeof data.dob === 'string') data.dob = '[REDACTED]';
      if (typeof data.name === 'string') data.name = '[REDACTED]';
      if (typeof data.dateOfBirth === 'string') data.dateOfBirth = '[REDACTED]';
    }
  }

  // Scrub extra context
  if (event.extra) {
    Object.entries(event.extra).forEach(([key, value]) => {
      if (typeof value === 'string') {
        event.extra[key] = scrubText(value);
      } else if (typeof value === 'object' && value !== null) {
        event.extra[key] = scrubObject(value);
      }
    });
  }

  // Scrub error message
  if (event.message) {
    event.message = scrubText(event.message);
  }

  return event;
}

/**
 * Scrub text content for PII patterns
 */
function scrubText(text: string): string {
  return text
    // Remove dates in various formats
    .replace(/\d{4}-\d{2}-\d{2}/g, '[DATE_REDACTED]')
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '[DATE_REDACTED]')
    .replace(/\d{1,2}-\d{1,2}-\d{4}/g, '[DATE_REDACTED]')
    // Remove email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL_REDACTED]')
    // Remove phone numbers
    .replace(/\d{3}-\d{3}-\d{4}/g, '[PHONE_REDACTED]')
    .replace(/\(\d{3}\)\s*\d{3}-\d{4}/g, '[PHONE_REDACTED]');
}

/**
 * Recursively scrub object properties
 */
function scrubObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => scrubObject(item));
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const record = value as UnknownRecord;
  const scrubbed: UnknownRecord = {};

  Object.entries(record).forEach(([key, entryValue]) => {
    if (['fullName', 'name', 'dob', 'dateOfBirth', 'email', 'phone'].includes(key)) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof entryValue === 'string') {
      scrubbed[key] = scrubText(entryValue);
    } else {
      scrubbed[key] = scrubObject(entryValue);
    }
  });

  return scrubbed;
}

/**
 * Manually capture an error with additional context
 *
 * Usage:
 * ```typescript
 * try {
 *   generateReading(name, dob);
 * } catch (error) {
 *   captureError(error, {
 *     context: 'Reading Generation',
 *     extra: { hasName: !!name, hasDob: !!dob }
 *   });
 * }
 * ```
 */
export function captureError(
  error: Error | unknown,
  context?: {
    context?: string;
    level?: Sentry.SeverityLevel;
    extra?: UnknownRecord;
    tags?: Record<string, string>;
  }
) {
  // Build the event data
  const eventData: Partial<Sentry.Event> & { level: Sentry.SeverityLevel } = {
    level: context?.level || 'error',
  };

  // Add extra data directly to the event
  if (context?.extra) {
    eventData.extra = context.extra;
  }

  // Add tags directly to the event
  if (context?.tags) {
    eventData.tags = context.tags;
  }

  // Add custom context
  if (context?.context) {
    eventData.contexts = {
      custom: { context: context.context }
    };
  }

  Sentry.captureException(error, eventData);
}

/**
 * Set user context (use sparingly, avoid PII)
 *
 * Usage:
 * ```typescript
 * setUserContext({
 *   id: 'user123',
 *   segment: 'premium',
 * });
 * ```
 */
export function setUserContext(user: {
  id?: string;
  segment?: string;
  [key: string]: unknown;
}) {
  // Only set non-PII user info
  Sentry.setUser({
    id: user.id,
    segment: user.segment,
  });
}

/**
 * Add breadcrumb for debugging
 *
 * Usage:
 * ```typescript
 * addBreadcrumb('User clicked Generate Reading button');
 * ```
 */
export function addBreadcrumb(
  message: string,
  data?: UnknownRecord,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    level,
    data: data ? scrubObject(data) : undefined,
    timestamp: Date.now() / 1000,
  });
}
