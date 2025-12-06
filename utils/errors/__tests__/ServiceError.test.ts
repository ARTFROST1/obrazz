/**
 * Test Suite for ServiceError utility
 *
 * Run with: npm test (after installing Jest)
 */

import { ServiceError, ServiceErrorCode, parseSupabaseError } from '../ServiceError';

describe('ServiceError', () => {
  describe('constructor', () => {
    test('creates error with required fields', () => {
      const error = new ServiceError(ServiceErrorCode.ITEM_NOT_FOUND, 'Item not found');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ServiceErrorCode.ITEM_NOT_FOUND);
      expect(error.message).toBe('Item not found');
      expect(error.name).toBe('ServiceError');
    });

    test('creates error with optional fields', () => {
      const originalError = new Error('Original error');
      const error = new ServiceError(ServiceErrorCode.DATABASE_ERROR, 'Database failed', {
        statusCode: 500,
        originalError,
        context: { userId: '123' },
      });

      expect(error.statusCode).toBe(500);
      expect(error.originalError).toBe(originalError);
      expect(error.context).toEqual({ userId: '123' });
    });
  });

  describe('getUserMessage', () => {
    test('returns user-friendly message for known error codes', () => {
      const error = new ServiceError(
        ServiceErrorCode.AUTH_INVALID_CREDENTIALS,
        'Technical error message',
      );

      expect(error.getUserMessage()).toBe('Invalid email or password');
    });

    test('returns original message for unknown codes', () => {
      const error = new ServiceError(ServiceErrorCode.UNKNOWN_ERROR, 'Custom error message');

      expect(error.getUserMessage()).toContain('unexpected error');
    });
  });

  describe('isServiceError', () => {
    test('returns true for ServiceError instances', () => {
      const error = new ServiceError(ServiceErrorCode.ITEM_NOT_FOUND, 'Not found');

      expect(ServiceError.isServiceError(error)).toBe(true);
    });

    test('returns false for regular Error', () => {
      const error = new Error('Regular error');

      expect(ServiceError.isServiceError(error)).toBe(false);
    });

    test('returns false for non-error values', () => {
      expect(ServiceError.isServiceError('string')).toBe(false);
      expect(ServiceError.isServiceError(null)).toBe(false);
      expect(ServiceError.isServiceError(undefined)).toBe(false);
    });
  });

  describe('fromError', () => {
    test('returns same error if already ServiceError', () => {
      const original = new ServiceError(ServiceErrorCode.ITEM_NOT_FOUND, 'Not found');

      const result = ServiceError.fromError(original);

      expect(result).toBe(original);
    });

    test('wraps regular Error', () => {
      const original = new Error('Regular error');

      const result = ServiceError.fromError(original);

      expect(result).toBeInstanceOf(ServiceError);
      expect(result.message).toBe('Regular error');
      expect(result.code).toBe(ServiceErrorCode.UNKNOWN_ERROR);
      expect(result.originalError).toBe(original);
    });

    test('converts string to ServiceError', () => {
      const result = ServiceError.fromError('String error');

      expect(result).toBeInstanceOf(ServiceError);
      expect(result.message).toBe('String error');
      expect(result.originalError).toBe('String error');
    });
  });

  describe('parseSupabaseError', () => {
    test('returns ServiceError as-is', () => {
      const original = new ServiceError(ServiceErrorCode.ITEM_NOT_FOUND, 'Not found');

      const result = parseSupabaseError(original);

      expect(result).toBe(original);
    });

    test('parses PGRST116 code as ITEM_NOT_FOUND', () => {
      const supabaseError = { code: 'PGRST116', message: 'Not found' };

      const result = parseSupabaseError(supabaseError);

      expect(result.code).toBe(ServiceErrorCode.ITEM_NOT_FOUND);
    });

    test('parses 23505 code as CONSTRAINT_VIOLATION', () => {
      const supabaseError = { code: '23505', message: 'Duplicate' };

      const result = parseSupabaseError(supabaseError);

      expect(result.code).toBe(ServiceErrorCode.DATABASE_CONSTRAINT_VIOLATION);
    });

    test('parses 42501 code as PERMISSION_DENIED', () => {
      const supabaseError = { code: '42501', message: 'Permission denied' };

      const result = parseSupabaseError(supabaseError);

      expect(result.code).toBe(ServiceErrorCode.DATABASE_PERMISSION_DENIED);
    });

    test('detects network errors by message', () => {
      const error = new Error('Network request failed');

      const result = parseSupabaseError(error);

      expect(result.code).toBe(ServiceErrorCode.NETWORK_ERROR);
    });

    test('defaults to DATABASE_ERROR for unknown Supabase errors', () => {
      const error = new Error('Unknown database error');

      const result = parseSupabaseError(error);

      expect(result.code).toBe(ServiceErrorCode.DATABASE_ERROR);
    });
  });
});
