import { supabase } from "@/integrations/supabase/client";
import { captureError, addBreadcrumb } from "@/lib/sentry";

export type DepthMode = "lite" | "standard" | "deep";

export class ReadingError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ReadingError";
  }
}

export async function generateReading(input: {
  fullName: string;
  dobISO?: string;
  inputs: Array<{ label: string; value: string | number }>;
  numbers?: {
    lifePath?: { value: number; isMaster?: boolean };
    expression?: { value: number; isMaster?: boolean };
    soulUrge?: { value: number; isMaster?: boolean };
    personality?: { value: number; isMaster?: boolean };
  };
  includeChakra?: boolean;
  depth?: DepthMode;
  model?: string;
}) {
  try {
    // Add breadcrumb for debugging
    addBreadcrumb('Reading generation started', {
      hasName: !!input.fullName,
      hasDob: !!input.dobISO,
      depth: input.depth || 'standard',
      includeChakra: input.includeChakra,
    });

    // Validate required inputs
    if (!input.fullName || input.fullName.trim().length === 0) {
      throw new ReadingError("Full name is required", "VALIDATION_ERROR", 400);
    }

    // Call the secure Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-reading', {
      body: input
    });

    if (error) {
      // Log full error details for debugging
      console.error('Edge function error:', {
        error,
        message: error.message,
        context: error.context,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2)
      });

      // Capture error in Sentry with context
      captureError(error, {
        context: 'Reading Generation - Edge Function',
        level: 'error',
        tags: {
          service: 'supabase-edge-function',
          function: 'generate-reading',
          errorCode: error.code || 'unknown',
        },
        extra: {
          hasName: !!input.fullName,
          hasDob: !!input.dobISO,
          depth: input.depth,
          errorMessage: error.message,
          errorDetails: error.details,
          errorContext: error.context,
        },
      });

      // Handle specific error types
      if (error.message?.includes('not found')) {
        throw new ReadingError(
          'Reading service is temporarily unavailable. Please try again later.',
          'SERVICE_UNAVAILABLE',
          503
        );
      }

      if (error.message?.includes('timeout')) {
        throw new ReadingError(
          'Request timed out. Please try again.',
          'TIMEOUT',
          408
        );
      }

      if (error.message?.includes('rate limit')) {
        throw new ReadingError(
          'Too many requests. Please wait a moment and try again.',
          'RATE_LIMIT',
          429
        );
      }

      throw new ReadingError(
        `Failed to generate reading: ${error.message}`,
        'EDGE_FUNCTION_ERROR',
        500
      );
    }

    if (!data) {
      throw new ReadingError(
        'No response from server. Please try again.',
        'NO_DATA',
        500
      );
    }

    if (!data.reading) {
      throw new ReadingError(
        'Invalid response from server. Please try again.',
        'INVALID_RESPONSE',
        500
      );
    }

    return data.reading;
  } catch (error) {
    // Re-throw ReadingError as-is (already logged to Sentry if needed)
    if (error instanceof ReadingError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error('Unexpected error in generateReading:', error);

    // Capture unexpected errors in Sentry
    captureError(error as Error, {
      context: 'Reading Generation - Unexpected Error',
      level: 'error',
      tags: {
        service: 'reading-service',
      },
      extra: {
        hasName: !!input.fullName,
        hasDob: !!input.dobISO,
        depth: input.depth,
      },
    });

    throw new ReadingError(
      'An unexpected error occurred. Please try again.',
      'UNKNOWN_ERROR',
      500
    );
  }
}
