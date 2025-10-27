/**
 * User-friendly error messages with recovery suggestions
 */

export interface ErrorMessage {
  title: string;
  description: string;
  action?: string;
}

export function getErrorMessage(error: Error | string): ErrorMessage {
  const errorMsg = typeof error === 'string' ? error : error.message;
  const errorLower = errorMsg.toLowerCase();

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return {
      title: "Connection Issue",
      description: "We're having trouble connecting. Check your internet and try again.",
      action: "retry"
    };
  }

  // Timeout errors
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return {
      title: "Taking Too Long",
      description: "This is taking longer than expected. Try again with a smaller image or check your connection.",
      action: "retry"
    };
  }

  // Permission errors
  if (errorLower.includes('permission') || errorLower.includes('denied')) {
    return {
      title: "Permission Needed",
      description: "We need camera access to scan images. Please allow camera permissions in your settings.",
      action: "settings"
    };
  }

  // Image size errors
  if (errorLower.includes('too large') || errorLower.includes('size')) {
    return {
      title: "Image Too Large",
      description: "This image is too big. Try a smaller photo or take a new picture.",
      action: "retry"
    };
  }

  // OCR/AI errors
  if (errorLower.includes('openai') || errorLower.includes('vision') || errorLower.includes('ocr')) {
    return {
      title: "Vision Service Unavailable",
      description: "Our AI vision service is temporarily unavailable. Please try again in a moment.",
      action: "retry"
    };
  }

  // No numbers found
  if (errorLower.includes('no numbers') || errorLower.includes('not found')) {
    return {
      title: "No Numbers Detected",
      description: "We couldn't find any numbers in this image. Try a clearer photo with visible numbers.",
      action: "retry"
    };
  }

  // Rate limit errors
  if (errorLower.includes('rate limit') || errorLower.includes('quota')) {
    return {
      title: "Too Many Requests",
      description: "You're going too fast! Please wait a moment before trying again.",
      action: "wait"
    };
  }

  // Invalid input
  if (errorLower.includes('invalid') || errorLower.includes('format')) {
    return {
      title: "Invalid Input",
      description: "The input format isn't quite right. Try entering numbers like 11:11, 222, or a question.",
      action: "retry"
    };
  }

  // Generic fallback
  return {
    title: "Something Went Wrong",
    description: errorMsg || "An unexpected error occurred. Please try again.",
    action: "retry"
  };
}

export function getRecoveryAction(action: string | undefined): string {
  switch (action) {
    case 'retry':
      return 'Try Again';
    case 'settings':
      return 'Open Settings';
    case 'wait':
      return 'Wait & Retry';
    default:
      return 'OK';
  }
}
