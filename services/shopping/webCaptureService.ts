import { resizeToMegapixels } from '@/utils/image/imageCompression';
import { File, Paths } from 'expo-file-system';

/**
 * Downloads image from URL to local storage and compresses to 1MP
 */
export async function downloadImageFromUrl(imageUrl: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const extension = getImageExtension(imageUrl);
    const fileName = `web_capture_${timestamp}.${extension}`;

    const file = new File(Paths.cache, fileName);

    console.log('[WebCapture] Downloading image from:', imageUrl);
    console.log('[WebCapture] Download destination:', file.uri);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await file.write(uint8Array);

    console.log('[WebCapture] Image downloaded successfully, resizing to 1MP...');

    // Resize to 1MP to optimize for background removal and reduce API costs
    const resizeResult = await resizeToMegapixels(file.uri, {
      targetMegapixels: 1.0,
      quality: 0.85,
    });

    console.log('[WebCapture] Resize to 1MP complete:', {
      dimensions: `${resizeResult.resizedWidth}x${resizeResult.resizedHeight}`,
      megapixels: resizeResult.resizedMegapixels.toFixed(2) + 'MP',
      fileSize: (resizeResult.compressedSize / 1024).toFixed(2) + 'KB',
      compressionRatio: resizeResult.compressionRatio.toFixed(2) + 'x',
    });

    return resizeResult.uri;
  } catch (error) {
    console.error('[WebCapture] Error downloading image:', error);
    throw error;
  }
}

/**
 * Get image extension from URL or default to jpg
 */
function getImageExtension(url: string): string {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
  if (match) {
    return match[1].toLowerCase();
  }
  return 'jpg'; // Default
}

/**
 * Save base64 image to local storage
 */
export async function saveBase64Image(
  base64Data: string,
  prefix: string = 'image',
): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileName = `${prefix}_${timestamp}.jpg`;

    const file = new File(Paths.cache, fileName);

    // Remove data:image prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Convert base64 to Uint8Array
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const uint8Array = new Uint8Array(byteNumbers);

    await file.write(uint8Array);
    console.log('Base64 image saved:', file.uri);

    return file.uri;
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw error;
  }
}

/**
 * Delete temporary file
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const file = new File(filePath);
    if (file.exists) {
      await file.delete();
      console.log('File deleted:', filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}
