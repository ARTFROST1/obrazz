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

    try {
      // Read image as base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

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
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.title || 'Failed to remove background');
      }

      // Get the result as base64
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = reader.result as string;
            const base64 = base64data.split(',')[1]; // Remove data:image/png;base64, prefix

            // Save to file system
            const processedPath = imageUri.replace('.jpg', '_nobg.png');
            await FileSystem.writeAsStringAsync(processedPath, base64, {
              encoding: 'base64',
            });

            resolve(processedPath);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error removing background:', error);
      throw new Error('Failed to remove background from image');
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
