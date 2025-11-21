import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const TARGET_MEGAPIXELS = 1.0; // 1MP - optimal balance between quality and size
const COMPRESSION_QUALITY = 0.85; // High quality JPEG compression
const MIN_DIMENSION = 400; // Minimum width/height to maintain usability

export interface ResizeToMegapixelsOptions {
  targetMegapixels?: number;
  quality?: number;
  minDimension?: number;
}

export interface ResizeResult {
  uri: string;
  originalWidth: number;
  originalHeight: number;
  originalMegapixels: number;
  resizedWidth: number;
  resizedHeight: number;
  resizedMegapixels: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Resize image to target megapixels while preserving aspect ratio
 *
 * This approach is more predictable than file size limits:
 * - 1MP = consistent visual quality regardless of complexity
 * - Direct control over Pixian.ai API costs (charged per megapixel)
 * - Works with any aspect ratio
 *
 * @param imageUri - Local file URI of the image to resize
 * @param options - Resize options
 * @returns Resized image URI and stats
 *
 * @example
 * // 4000x3000 (12MP) → 1155x866 (1MP) at any aspect ratio
 * // 2048x1536 (3.1MP) → 1155x866 (1MP)
 * // 800x600 (0.48MP) → kept as-is (already under target)
 */
export async function resizeToMegapixels(
  imageUri: string,
  options: ResizeToMegapixelsOptions = {},
): Promise<ResizeResult> {
  const {
    targetMegapixels = TARGET_MEGAPIXELS,
    quality = COMPRESSION_QUALITY,
    minDimension = MIN_DIMENSION,
  } = options;

  console.log('[ImageResize] Starting resize to', targetMegapixels, 'MP for:', imageUri);

  try {
    // Get original file info
    const originalFileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!originalFileInfo.exists) {
      throw new Error(`Image file does not exist: ${imageUri}`);
    }
    const originalFileSize = originalFileInfo.size || 0;

    // Get image dimensions
    console.log('[ImageResize] Reading image dimensions...');
    const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
      compress: 1.0,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const originalWidth = imageInfo.width;
    const originalHeight = imageInfo.height;
    const originalMegapixels = (originalWidth * originalHeight) / 1_000_000;

    console.log('[ImageResize] Original dimensions:', originalWidth, 'x', originalHeight);
    console.log('[ImageResize] Original megapixels:', originalMegapixels.toFixed(2), 'MP');
    console.log('[ImageResize] Original file size:', (originalFileSize / 1024).toFixed(2), 'KB');

    // If already at or below target megapixels, just compress with quality
    if (originalMegapixels <= targetMegapixels) {
      console.log('[ImageResize] Already at target MP, applying quality compression only');

      const compressed = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const compressedFileInfo = await FileSystem.getInfoAsync(compressed.uri);
      const compressedFileSize = compressedFileInfo.exists ? compressedFileInfo.size || 0 : 0;

      console.log('[ImageResize] ✅ Compression applied');
      console.log('[ImageResize] File size:', (compressedFileSize / 1024).toFixed(2), 'KB');

      return {
        uri: compressed.uri,
        originalWidth,
        originalHeight,
        originalMegapixels,
        resizedWidth: originalWidth,
        resizedHeight: originalHeight,
        resizedMegapixels: originalMegapixels,
        originalSize: originalFileSize,
        compressedSize: compressedFileSize,
        compressionRatio: originalFileSize / (compressedFileSize || 1),
      };
    }

    // Calculate new dimensions to achieve target megapixels
    // Formula: newWidth * newHeight = targetMegapixels * 1,000,000
    // While maintaining aspect ratio: newWidth / newHeight = originalWidth / originalHeight

    const aspectRatio = originalWidth / originalHeight;
    const targetPixels = targetMegapixels * 1_000_000;

    // Solve for dimensions:
    // newWidth = sqrt(targetPixels * aspectRatio)
    // newHeight = newWidth / aspectRatio
    let newWidth = Math.round(Math.sqrt(targetPixels * aspectRatio));
    let newHeight = Math.round(newWidth / aspectRatio);

    // Ensure minimum dimensions for usability
    if (newWidth < minDimension) {
      newWidth = minDimension;
      newHeight = Math.round(newWidth / aspectRatio);
    }
    if (newHeight < minDimension) {
      newHeight = minDimension;
      newWidth = Math.round(newHeight * aspectRatio);
    }

    const actualMegapixels = (newWidth * newHeight) / 1_000_000;

    console.log('[ImageResize] Calculated new dimensions:', newWidth, 'x', newHeight);
    console.log(
      '[ImageResize] Target MP:',
      targetMegapixels,
      '→ Actual MP:',
      actualMegapixels.toFixed(3),
    );
    console.log('[ImageResize] Aspect ratio preserved:', aspectRatio.toFixed(3));

    // Resize and compress
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: newWidth, height: newHeight } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    const resizedFileInfo = await FileSystem.getInfoAsync(resized.uri);
    const resizedFileSize = resizedFileInfo.exists ? resizedFileInfo.size || 0 : 0;

    const compressionRatio = originalFileSize / (resizedFileSize || 1);
    const megapixelReduction = ((originalMegapixels - actualMegapixels) / originalMegapixels) * 100;

    console.log('[ImageResize] ✅ Resize complete!');
    console.log('[ImageResize] Megapixels reduced by:', megapixelReduction.toFixed(1), '%');
    console.log('[ImageResize] File size:', (resizedFileSize / 1024).toFixed(2), 'KB');
    console.log('[ImageResize] Compression ratio:', compressionRatio.toFixed(2), 'x');

    return {
      uri: resized.uri,
      originalWidth,
      originalHeight,
      originalMegapixels,
      resizedWidth: newWidth,
      resizedHeight: newHeight,
      resizedMegapixels: actualMegapixels,
      originalSize: originalFileSize,
      compressedSize: resizedFileSize,
      compressionRatio,
    };
  } catch (error) {
    console.error('[ImageResize] Error resizing image:', error);
    throw new Error(
      `Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Legacy function - redirects to resizeToMegapixels
 * Kept for backward compatibility
 *
 * @deprecated Use resizeToMegapixels instead
 */
export async function compressImageToSize(imageUri: string, options: any = {}): Promise<any> {
  console.log(
    '[ImageCompression] DEPRECATED: compressImageToSize called, using resizeToMegapixels instead',
  );

  const result = await resizeToMegapixels(imageUri, {
    targetMegapixels: TARGET_MEGAPIXELS,
    quality: options.initialQuality || COMPRESSION_QUALITY,
  });

  // Map new format to old format for compatibility
  return {
    uri: result.uri,
    originalSize: result.originalSize,
    compressedSize: result.compressedSize,
    compressionRatio: result.compressionRatio,
    width: result.resizedWidth,
    height: result.resizedHeight,
  };
}
