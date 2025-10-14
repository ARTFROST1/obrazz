import * as FileSystem from 'expo-file-system/legacy';
import { REMOVE_BG_API_KEY } from '@config/env';

interface RemoveBgOptions {
  size?: 'auto' | 'preview' | 'full' | 'medium' | 'hd' | '4k';
  type?: 'auto' | 'person' | 'product' | 'car';
  format?: 'auto' | 'png' | 'jpg' | 'zip';
  roi?: string;
  crop?: boolean;
  scale?: string;
  position?: string;
  channels?: 'rgba' | 'alpha';
  shadow?: boolean;
  semitransparency?: boolean;
  bg_color?: string;
  bg_image_url?: string;
}

class BackgroundRemoverService {
  private apiKey: string;
  private apiUrl = 'https://api.remove.bg/v1.0/removebg';

  constructor() {
    this.apiKey = REMOVE_BG_API_KEY || '';
  }

  /**
   * Remove background from image
   */
  async removeBackground(imageUri: string, options: RemoveBgOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Remove.bg API key not configured');
    }

    console.log('[BackgroundRemover] Starting background removal for:', imageUri);

    try {
      // Verify source file exists
      const sourceInfo = await FileSystem.getInfoAsync(imageUri);
      if (!sourceInfo.exists) {
        throw new Error(`Source image does not exist: ${imageUri}`);
      }
      console.log('[BackgroundRemover] Source file exists, size:', sourceInfo.size);

      // Read image as base64
      console.log('[BackgroundRemover] Reading image as base64...');
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      console.log('[BackgroundRemover] Base64 length:', base64Image.length);

      // Prepare form data
      const formData = new FormData();
      formData.append('image_file_b64', base64Image);
      formData.append('size', options.size || 'auto');
      formData.append('type', options.type || 'auto');
      formData.append('format', options.format || 'png');

      if (options.bg_color) {
        formData.append('bg_color', options.bg_color);
      }

      // Make API request
      console.log('[BackgroundRemover] Making API request to Remove.bg...');
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
        },
        body: formData,
      });

      console.log('[BackgroundRemover] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[BackgroundRemover] API error:', errorData);
        throw new Error(errorData.errors?.[0]?.title || 'Failed to remove background');
      }

      // Get the result as base64
      console.log('[BackgroundRemover] Processing response blob...');
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            console.log('[BackgroundRemover] Converting blob to base64...');
            const base64data = reader.result as string;
            const base64 = base64data.split(',')[1]; // Remove data:image/png;base64, prefix

            // Save to file system
            const processedPath = imageUri.replace('.jpg', '_nobg.png');
            console.log('[BackgroundRemover] Saving processed image to:', processedPath);

            await FileSystem.writeAsStringAsync(processedPath, base64, {
              encoding: 'base64',
            });

            // Verify the file was saved
            const savedInfo = await FileSystem.getInfoAsync(processedPath);
            if (!savedInfo.exists) {
              throw new Error('Failed to save processed image - file does not exist');
            }
            console.log(
              '[BackgroundRemover] Processed image saved successfully, size:',
              savedInfo.size,
            );

            resolve(processedPath);
          } catch (error) {
            console.error('[BackgroundRemover] Error saving processed image:', error);
            reject(error);
          }
        };

        reader.onerror = (error) => {
          console.error('[BackgroundRemover] FileReader error:', error);
          reject(error);
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[BackgroundRemover] Error removing background:', error);
      if (error instanceof Error) {
        console.error('[BackgroundRemover] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw new Error(
        `Failed to remove background from image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Get account info (credits remaining)
   */
  async getAccountInfo(): Promise<{ credits: number }> {
    if (!this.apiKey) {
      throw new Error('Remove.bg API key not configured');
    }

    try {
      const response = await fetch('https://api.remove.bg/v1.0/account', {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account info');
      }

      const data = await response.json();
      return {
        credits: data.data.attributes.credits.total,
      };
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }
}

export const backgroundRemoverService = new BackgroundRemoverService();
