import * as FileSystem from 'expo-file-system/legacy';
import { PIXIAN_API_ID, PIXIAN_API_SECRET, PIXIAN_TEST_MODE } from '@config/env';

interface PixianOptions {
  // Test mode - free but with watermark
  test?: boolean;
  // Maximum input image size (width × height)
  max_pixels?: number;
  // Background color (e.g., '#0055FF')
  'background.color'?: string;
  // Crop result to foreground object
  'result.crop_to_foreground'?: boolean;
  // Margin to add to result (e.g., '10px 20% 5px 15%')
  'result.margin'?: string;
  // Target size in pixels (e.g., '1920 1080')
  'result.target_size'?: string;
  // Vertical alignment: 'top' | 'middle' | 'bottom'
  'result.vertical_alignment'?: 'top' | 'middle' | 'bottom';
  // Output format: 'auto' | 'png' | 'jpeg' | 'delta_png'
  'result.format'?: 'auto' | 'png' | 'jpeg' | 'delta_png';
  // JPEG quality (1-100)
  'result.jpeg_quality'?: number;
}

class BackgroundRemoverService {
  private apiId: string;
  private apiSecret: string;
  private apiUrl = 'https://api.pixian.ai/api/v2/remove-background';
  private accountUrl = 'https://api.pixian.ai/api/v2/account';

  constructor() {
    this.apiId = PIXIAN_API_ID || '';
    this.apiSecret = PIXIAN_API_SECRET || '';
  }

  /**
   * Remove background from image using Pixian.ai API
   *
   * @param imageUri - Local file URI of the image
   * @param options - Optional parameters for background removal
   *
   * Note: By default, uses test mode (free with watermark) based on EXPO_PUBLIC_PIXIAN_TEST_MODE.
   * Set options.test = false to use production mode (requires credits).
   */
  async removeBackground(imageUri: string, options: PixianOptions = {}): Promise<string> {
    if (!this.apiId || !this.apiSecret) {
      throw new Error('Pixian.ai API credentials not configured');
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
      formData.append('image.base64', base64Image);

      // Add test mode parameter (use environment variable if not explicitly set)
      const testMode = options.test !== undefined ? options.test : PIXIAN_TEST_MODE;
      formData.append('test', String(testMode));

      if (testMode) {
        console.log('[BackgroundRemover] Running in TEST MODE - result will have watermark');
      }
      if (options.max_pixels) {
        formData.append('max_pixels', String(options.max_pixels));
      }
      if (options['background.color']) {
        formData.append('background.color', options['background.color']);
      }
      if (options['result.crop_to_foreground'] !== undefined) {
        formData.append('result.crop_to_foreground', String(options['result.crop_to_foreground']));
      }
      if (options['result.margin']) {
        formData.append('result.margin', options['result.margin']);
      }
      if (options['result.target_size']) {
        formData.append('result.target_size', options['result.target_size']);
      }
      if (options['result.vertical_alignment']) {
        formData.append('result.vertical_alignment', options['result.vertical_alignment']);
      }
      if (options['result.format']) {
        formData.append('result.format', options['result.format']);
      }
      if (options['result.jpeg_quality']) {
        formData.append('result.jpeg_quality', String(options['result.jpeg_quality']));
      }

      // Create Basic Auth header
      const credentials = btoa(`${this.apiId}:${this.apiSecret}`);

      // Make API request
      console.log('[BackgroundRemover] Making API request to Pixian.ai...');
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        body: formData,
      });

      console.log('[BackgroundRemover] API response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to remove background';
        try {
          const errorData = await response.json();
          console.error('[BackgroundRemover] API error:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Get response headers for metadata
      const creditsCharged = response.headers.get('X-Credits-Charged');
      const inputSize = response.headers.get('X-Input-Size');
      const resultSize = response.headers.get('X-Result-Size');

      console.log('[BackgroundRemover] Credits charged:', creditsCharged);
      console.log('[BackgroundRemover] Input size:', inputSize);
      console.log('[BackgroundRemover] Result size:', resultSize);

      // Get the result as blob
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
            const processedPath = imageUri.replace(/\.(jpg|jpeg)$/i, '_nobg.png');
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
   * Check if API credentials are configured
   */
  isConfigured(): boolean {
    return !!this.apiId && this.apiId.length > 0 && !!this.apiSecret && this.apiSecret.length > 0;
  }

  /**
   * Get account info (credits remaining)
   */
  async getAccountInfo(): Promise<{
    creditPack: string;
    state: 'active' | 'dormant';
    useBefore: string;
    credits: number;
  }> {
    if (!this.apiId || !this.apiSecret) {
      throw new Error('Pixian.ai API credentials not configured');
    }

    try {
      const credentials = btoa(`${this.apiId}:${this.apiSecret}`);

      const response = await fetch(this.accountUrl, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account info');
      }

      const data = await response.json();
      return {
        creditPack: data.creditPack,
        state: data.state,
        useBefore: data.useBefore,
        credits: data.credits,
      };
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }
}

export const backgroundRemoverService = new BackgroundRemoverService();
