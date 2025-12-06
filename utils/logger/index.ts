/**
 * Environment-aware logging utility
 *
 * In production builds, only errors are logged to prevent:
 * - Performance overhead
 * - Potential exposure of sensitive information
 * - Bundle size increase
 *
 * Usage:
 * import { logger } from '@utils/logger';
 * logger.log('Debug info');
 * logger.error('Error occurred', error);
 */

import Constants from 'expo-constants';

// Determine if we're in development mode
const isDevelopment = __DEV__ || Constants.expoConfig?.extra?.environment === 'development';

interface LoggerContext {
  [key: string]: unknown;
}

/**
 * Format log messages with context
 */
const formatMessage = (prefix: string, args: unknown[]): unknown[] => {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] ${prefix}`, ...args];
};

/**
 * Logger utility with environment awareness
 */
export const logger = {
  /**
   * Log debug information (development only)
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...formatMessage('LOG', args));
    }
  },

  /**
   * Log debug information (development only)
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...formatMessage('DEBUG', args));
    }
  },

  /**
   * Log informational messages (development only)
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...formatMessage('INFO', args));
    }
  },

  /**
   * Log warnings (always logged)
   */
  warn: (...args: unknown[]): void => {
    console.warn(...formatMessage('WARN', args));
  },

  /**
   * Log errors (always logged)
   */
  error: (...args: unknown[]): void => {
    console.error(...formatMessage('ERROR', args));
  },

  /**
   * Log with context object (development only)
   */
  logWithContext: (message: string, context: LoggerContext): void => {
    if (isDevelopment) {
      console.log(
        ...formatMessage('LOG', [message]),
        '\nContext:',
        JSON.stringify(context, null, 2),
      );
    }
  },

  /**
   * Log error with context (always logged)
   */
  errorWithContext: (message: string, error: unknown, context?: LoggerContext): void => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error(...formatMessage('ERROR', [message]), {
      error: errorMessage,
      stack,
      context,
    });
  },
};

/**
 * Create a namespaced logger for a specific module
 */
export const createLogger = (namespace: string) => {
  return {
    log: (...args: unknown[]) => logger.log(`[${namespace}]`, ...args),
    debug: (...args: unknown[]) => logger.debug(`[${namespace}]`, ...args),
    info: (...args: unknown[]) => logger.info(`[${namespace}]`, ...args),
    warn: (...args: unknown[]) => logger.warn(`[${namespace}]`, ...args),
    error: (...args: unknown[]) => logger.error(`[${namespace}]`, ...args),
    logWithContext: (message: string, context: LoggerContext) =>
      logger.logWithContext(`[${namespace}] ${message}`, context),
    errorWithContext: (message: string, error: unknown, context?: LoggerContext) =>
      logger.errorWithContext(`[${namespace}] ${message}`, error, context),
  };
};
