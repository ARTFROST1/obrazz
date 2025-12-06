/**
 * Tests for password validation utility
 */

import { validateEmail, validatePassword, validatePasswordMatch } from '../authValidation';

describe('validatePassword', () => {
  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Pass1');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('8 characters');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('uppercase');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('PASSWORD123');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('should reject password without number', () => {
    const result = validatePassword('PasswordTest');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('number');
  });

  it('should accept valid password with all requirements', () => {
    const result = validatePassword('Password123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept complex password', () => {
    const result = validatePassword('MyP@ssw0rd!');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateEmail', () => {
  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject invalid email format', () => {
    const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];
    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid email');
    });
  });

  it('should accept valid email addresses', () => {
    const validEmails = ['user@example.com', 'test.user@domain.co.uk', 'name+tag@company.org'];
    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});

describe('validatePasswordMatch', () => {
  it('should reject when confirm password is empty', () => {
    const result = validatePasswordMatch('Password123', '');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('confirm');
  });

  it('should reject when passwords do not match', () => {
    const result = validatePasswordMatch('Password123', 'Password456');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('do not match');
  });

  it('should accept when passwords match', () => {
    const result = validatePasswordMatch('Password123', 'Password123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
