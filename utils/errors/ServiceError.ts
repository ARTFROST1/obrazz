/**
 * Standardized service error handling
 *
 * Provides consistent error codes and messages across all services
 */

export enum ServiceErrorCode {
  // Auth errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',

  // Item/Wardrobe errors
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  ITEM_CREATE_FAILED = 'ITEM_CREATE_FAILED',
  ITEM_UPDATE_FAILED = 'ITEM_UPDATE_FAILED',
  ITEM_DELETE_FAILED = 'ITEM_DELETE_FAILED',

  // Outfit errors
  OUTFIT_NOT_FOUND = 'OUTFIT_NOT_FOUND',
  OUTFIT_CREATE_FAILED = 'OUTFIT_CREATE_FAILED',
  OUTFIT_UPDATE_FAILED = 'OUTFIT_UPDATE_FAILED',
  OUTFIT_DELETE_FAILED = 'OUTFIT_DELETE_FAILED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  DATABASE_PERMISSION_DENIED = 'DATABASE_PERMISSION_DENIED',

  // File/Storage errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_DELETE_FAILED = 'FILE_DELETE_FAILED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Unknown/Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for service layer errors
 */
export class ServiceError extends Error {
  public readonly code: ServiceErrorCode;
  public readonly statusCode?: number;
  public readonly originalError?: unknown;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: ServiceErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      originalError?: unknown;
      context?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.originalError = options?.originalError;
    this.context = options?.context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    const userMessages: Record<ServiceErrorCode, string> = {
      [ServiceErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
      [ServiceErrorCode.AUTH_USER_NOT_FOUND]: 'User not found',
      [ServiceErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please sign in again',
      [ServiceErrorCode.AUTH_UNAUTHORIZED]: 'You are not authorized to perform this action',

      [ServiceErrorCode.ITEM_NOT_FOUND]: 'Item not found',
      [ServiceErrorCode.ITEM_CREATE_FAILED]: 'Failed to create item. Please try again',
      [ServiceErrorCode.ITEM_UPDATE_FAILED]: 'Failed to update item. Please try again',
      [ServiceErrorCode.ITEM_DELETE_FAILED]: 'Failed to delete item. Please try again',

      [ServiceErrorCode.OUTFIT_NOT_FOUND]: 'Outfit not found',
      [ServiceErrorCode.OUTFIT_CREATE_FAILED]: 'Failed to create outfit. Please try again',
      [ServiceErrorCode.OUTFIT_UPDATE_FAILED]: 'Failed to update outfit. Please try again',
      [ServiceErrorCode.OUTFIT_DELETE_FAILED]: 'Failed to delete outfit. Please try again',

      [ServiceErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection',
      [ServiceErrorCode.NETWORK_TIMEOUT]: 'Request timed out. Please try again',

      [ServiceErrorCode.DATABASE_ERROR]: 'Database error. Please try again',
      [ServiceErrorCode.DATABASE_CONSTRAINT_VIOLATION]: 'A duplicate entry already exists',
      [ServiceErrorCode.DATABASE_PERMISSION_DENIED]: 'Access denied. Please check your permissions',

      [ServiceErrorCode.FILE_NOT_FOUND]: 'File not found',
      [ServiceErrorCode.FILE_UPLOAD_FAILED]: 'Failed to upload file. Please try again',
      [ServiceErrorCode.FILE_DELETE_FAILED]: 'Failed to delete file. Please try again',

      [ServiceErrorCode.VALIDATION_ERROR]: 'Validation error. Please check your input',

      [ServiceErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again',
    };

    return userMessages[this.code] || this.message;
  }

  /**
   * Check if error is a ServiceError instance
   */
  static isServiceError(error: unknown): error is ServiceError {
    return error instanceof ServiceError;
  }

  /**
   * Create ServiceError from unknown error
   */
  static fromError(error: unknown, defaultCode = ServiceErrorCode.UNKNOWN_ERROR): ServiceError {
    if (ServiceError.isServiceError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return new ServiceError(defaultCode, error.message, { originalError: error });
    }

    return new ServiceError(defaultCode, String(error), { originalError: error });
  }
}

/**
 * Parse Supabase error to ServiceError
 */
export const parseSupabaseError = (error: unknown): ServiceError => {
  if (ServiceError.isServiceError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  // Check for specific Supabase error codes
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code;

    switch (code) {
      case 'PGRST116':
        return new ServiceError(ServiceErrorCode.ITEM_NOT_FOUND, 'Item not found', {
          originalError: error,
        });
      case '23505':
        return new ServiceError(
          ServiceErrorCode.DATABASE_CONSTRAINT_VIOLATION,
          'A duplicate item already exists',
          { originalError: error },
        );
      case '42501':
        return new ServiceError(ServiceErrorCode.DATABASE_PERMISSION_DENIED, 'Access denied', {
          originalError: error,
        });
    }
  }

  // Check message patterns
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('permission denied')) {
    return new ServiceError(ServiceErrorCode.DATABASE_PERMISSION_DENIED, message, {
      originalError: error,
    });
  }

  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection')
  ) {
    return new ServiceError(ServiceErrorCode.NETWORK_ERROR, message, { originalError: error });
  }

  if (lowerMessage.includes('timeout')) {
    return new ServiceError(ServiceErrorCode.NETWORK_TIMEOUT, message, { originalError: error });
  }

  // Default to database error for Supabase errors
  return new ServiceError(ServiceErrorCode.DATABASE_ERROR, message, { originalError: error });
};
