/**
 * Centralized error handling utilities
 */

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Unknown error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  );
}

/**
 * Check if error is an auth error
 */
export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('auth') ||
    message.includes('token') ||
    message.includes('session') ||
    message.includes('unauthorized') ||
    message.includes('403') ||
    message.includes('401')
  );
}

/**
 * Log error safely with context
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>,
): void {
  console.error(`[${context}] Error:`, getErrorMessage(error));

  if (error instanceof Error && error.stack) {
    console.error(`[${context}] Stack:`, error.stack);
  }

  if (additionalInfo) {
    console.error(`[${context}] Additional info:`, additionalInfo);
  }
}

/**
 * Create a user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network error. Please check your internet connection and try again.';
  }

  if (isAuthError(error)) {
    return 'Authentication error. Please sign in again.';
  }

  const message = getErrorMessage(error);

  // Don't expose technical details to users
  if (message.includes('<!DOCTYPE') || message.includes('<html')) {
    return 'Service temporarily unavailable. Please try again later.';
  }

  return message;
}
