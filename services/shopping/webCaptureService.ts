import { File, Paths } from 'expo-file-system';

/**
 * Downloads image from URL to local storage
 */
export async function downloadImageFromUrl(imageUrl: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const extension = getImageExtension(imageUrl);
    const fileName = `web_capture_${timestamp}.${extension}`;

    const file = new File(Paths.cache, fileName);

    console.log('Downloading image from:', imageUrl);
    console.log('Download destination:', file.uri);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await file.write(uint8Array);

    console.log('Image downloaded successfully:', file.uri);
    return file.uri;
  } catch (error) {
    console.error('Error downloading image:', error);
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
