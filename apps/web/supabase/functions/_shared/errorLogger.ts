/**
 * Centralized Error Logger for Supabase Edge Functions
 *
 * Contract designed by Codex — implemented by Claude
 * Part of Production Readiness Phase 1 (P0-004)
 *
 * Usage in Edge Functions:
 * ```ts
 * import { logError } from '../_shared/errorLogger.ts';
 *
 * await logError(supabaseUrl, serviceRoleKey, {
 *   environment: Deno.env.get('ENV') as 'staging' | 'production',
 *   service: 'edge:function:generate-reading-v4',
 *   level: 'error',
 *   requestId,
 *   userId,
 *   code: 'READING_FAILED',
 *   message: err.message,
 *   details: { stack: err.stack }
 * });
 * ```
 */

export type ErrorLevel = 'error' | 'warn' | 'info';

export type LogPayload = {
  environment: 'staging' | 'production';
  service: string;
  level: ErrorLevel;
  requestId?: string;
  userId?: string;
  code?: string;
  message: string;
  details?: Record<string, unknown>;
  ip?: string;
  ua?: string;
};

/**
 * Log an error to the centralized error_logs table
 *
 * Features:
 * - Exponential backoff retry logic (3 attempts)
 * - Graceful degradation (logs to console if DB insert fails)
 * - Structured error context
 * - Service role authentication
 *
 * @param supabaseUrl - Supabase project URL (from env)
 * @param serviceRoleKey - Service role key (from env)
 * @param payload - Error log payload
 */
export async function logError(
  supabaseUrl: string,
  serviceRoleKey: string,
  payload: LogPayload
): Promise<void> {
  const maxRetries = 3;
  const baseDelay = 100; // ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Insert error log via REST API (bypasses RLS with service role key)
      const response = await fetch(`${supabaseUrl}/rest/v1/error_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'return=minimal', // Don't return the inserted row
        },
        body: JSON.stringify({
          ts: new Date().toISOString(),
          environment: payload.environment,
          service: payload.service,
          level: payload.level,
          request_id: payload.requestId,
          user_id: payload.userId,
          code: payload.code,
          message: payload.message,
          details: payload.details,
          ip: payload.ip,
          ua: payload.ua,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error log insert failed: ${response.status} ${errorText}`);
      }

      // Success - exit retry loop
      return;

    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        // All retries exhausted - log to console as fallback
        console.error('[ErrorLogger] Failed to log error after', maxRetries, 'attempts');
        console.error('[ErrorLogger] Original error:', payload);
        console.error('[ErrorLogger] Logging error:', error);
        return; // Don't throw - logging failures shouldn't break the function
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Create a request-scoped logger with common context
 *
 * Usage:
 * ```ts
 * const logger = createLogger(supabaseUrl, serviceRoleKey, {
 *   environment: 'production',
 *   service: 'edge:function:generate-reading-v4',
 *   requestId: crypto.randomUUID(),
 * });
 *
 * await logger.error('Reading generation failed', {
 *   code: 'READING_FAILED',
 *   userId,
 *   details: { input: name }
 * });
 * ```
 */
export function createLogger(
  supabaseUrl: string,
  serviceRoleKey: string,
  baseContext: Pick<LogPayload, 'environment' | 'service' | 'requestId'>
) {
  return {
    async error(
      message: string,
      context?: {
        code?: string;
        userId?: string;
        details?: Record<string, unknown>;
        ip?: string;
        ua?: string;
      }
    ) {
      await logError(supabaseUrl, serviceRoleKey, {
        ...baseContext,
        level: 'error',
        message,
        ...context,
      });
    },

    async warn(
      message: string,
      context?: {
        code?: string;
        userId?: string;
        details?: Record<string, unknown>;
        ip?: string;
        ua?: string;
      }
    ) {
      await logError(supabaseUrl, serviceRoleKey, {
        ...baseContext,
        level: 'warn',
        message,
        ...context,
      });
    },

    async info(
      message: string,
      context?: {
        code?: string;
        userId?: string;
        details?: Record<string, unknown>;
        ip?: string;
        ua?: string;
      }
    ) {
      await logError(supabaseUrl, serviceRoleKey, {
        ...baseContext,
        level: 'info',
        message,
        ...context,
      });
    },
  };
}

/**
 * Extract common request context from Deno request
 *
 * Usage:
 * ```ts
 * const context = extractRequestContext(req);
 * await logger.error('Failed', { ...context });
 * ```
 */
export function extractRequestContext(req: Request): {
  ip?: string;
  ua?: string;
} {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        undefined,
    ua: req.headers.get('user-agent') || undefined,
  };
}
