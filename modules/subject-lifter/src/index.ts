/**
 * TypeScript bindings for Subject Lifter native module
 *
 * Provides Apple Vision (Vision.framework) background removal for iOS 16+
 * with automatic fallback for unsupported platforms
 */

import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

interface SubjectLifterNativeModule {
  /**
   * Check if Apple Vision background removal is available on this device
   * @returns Promise<boolean> - true if iOS 16+ and supported (real device; Simulator may be unsupported)
   */
  isAvailable(): Promise<boolean>;

  /**
   * Remove background from image using Apple Vision (Vision.framework)
   * @param imageUri - File URI or path to source image
   * @returns Promise<string> - File URI to processed image with transparent background
   * @throws Error if processing fails or device unsupported
   */
  liftSubject(imageUri: string): Promise<string>;

  /**
   * Get system information for debugging
   * @returns Object with iOS version and Apple Vision availability
   */
  getSystemInfo(): { iosVersion: string; isVisionAvailable: boolean };
}

// Native module (only available on iOS)
let SubjectLifterNative: SubjectLifterNativeModule | null = null;

if (Platform.OS === 'ios') {
  try {
    console.log('[SubjectLifter] Attempting to load native module...');
    SubjectLifterNative = requireNativeModule('SubjectLifter');
    console.log('[SubjectLifter] Native module loaded successfully!');
  } catch (error) {
    console.error('[SubjectLifter] Native module not available:', error);
    console.error('[SubjectLifter] Error details:', JSON.stringify(error));
  }
} else {
  console.log('[SubjectLifter] Not on iOS, skipping native module load');
}

/**
 * Public API for Subject Lifter
 */
export const SubjectLifter = {
  /**
   * Check if Apple Vision background removal is available
   * Returns false on Android or iOS < 16
   */
  isAvailable: async (): Promise<boolean> => {
    console.log('[SubjectLifter.isAvailable] Checking availability...');
    console.log('[SubjectLifter.isAvailable] Platform:', Platform.OS);

    if (Platform.OS !== 'ios') {
      console.log('[SubjectLifter.isAvailable] Not iOS, returning false');
      return false;
    }

    if (!SubjectLifterNative) {
      console.warn('[SubjectLifter.isAvailable] Native module is null!');
      console.warn('[SubjectLifter.isAvailable] This means the module failed to load');
      return false;
    }

    try {
      console.log('[SubjectLifter.isAvailable] Calling native isAvailable()...');
      const result = await SubjectLifterNative.isAvailable();
      console.log('[SubjectLifter.isAvailable] Native returned:', result);
      return result;
    } catch (error) {
      console.error('[SubjectLifter.isAvailable] Error calling native method:', error);
      return false;
    }
  },

  /**
   * Remove background from image using Apple Vision (Vision.framework)
   *
   * @param imageUri - Local file URI (file:// or absolute path)
   * @returns Promise<string> - URI to processed image with transparent background
   * @throws Error if not available or processing fails
   *
   * @example
   * ```ts
   * try {
   *   const resultUri = await SubjectLifter.liftSubject('file:///path/to/image.jpg');
   *   console.log('Background removed:', resultUri);
   * } catch (error) {
   *   console.error('Failed:', error);
   * }
   * ```
   */
  liftSubject: async (imageUri: string): Promise<string> => {
    if (Platform.OS !== 'ios') {
      throw new Error('Subject Lifter is only available on iOS 16+');
    }

    if (!SubjectLifterNative) {
      throw new Error('Subject Lifter native module not loaded');
    }

    return await SubjectLifterNative.liftSubject(imageUri);
  },

  /**
   * Get system information (for debugging)
   * Returns null on non-iOS platforms
   */
  getSystemInfo: (): { iosVersion: string; isVisionAvailable: boolean } | null => {
    if (Platform.OS !== 'ios' || !SubjectLifterNative) {
      return null;
    }

    return SubjectLifterNative.getSystemInfo();
  },
};

/**
 * Type exports
 */
export type { SubjectLifterNativeModule };

/**
 * Check if running on iOS 16+
 */
export const isIOS16OrLater = (): boolean => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  const version = parseInt(Platform.Version.toString(), 10);
  return version >= 16;
};
