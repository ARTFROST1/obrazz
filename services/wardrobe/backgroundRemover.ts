import { PIXIAN_API_ID, PIXIAN_API_SECRET, PIXIAN_TEST_MODE } from '@config/env';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { SubjectLifter } from 'subject-lifter';

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
  private isAppleVisionAvailable: boolean | null = null;

  constructor() {
    this.apiId = PIXIAN_API_ID || '';
    this.apiSecret = PIXIAN_API_SECRET || '';
    this.checkAppleVisionAvailability();
  }

  /**
   * Check if Apple Vision is available on this device
   */
  private async checkAppleVisionAvailability(): Promise<void> {
    console.log('[BackgroundRemover] Checking Apple Vision availability...');
    console.log('[BackgroundRemover] Platform:', Platform.OS);

    if (Platform.OS !== 'ios') {
      console.log('[BackgroundRemover] Not iOS, Apple Vision unavailable');
      this.isAppleVisionAvailable = false;
      return;
    }

    try {
      console.log('[BackgroundRemover] Calling SubjectLifter.isAvailable()...');
      this.isAppleVisionAvailable = await SubjectLifter.isAvailable();
      console.log('[BackgroundRemover] Apple Vision availability:', this.isAppleVisionAvailable);

      // Log system info for debugging
      const systemInfo = SubjectLifter.getSystemInfo();
      if (systemInfo) {
        console.log('[BackgroundRemover] System info:', systemInfo);
      } else {
        console.warn('[BackgroundRemover] No system info available');
      }
    } catch (error) {
      console.error('[BackgroundRemover] Failed to check Apple Vision availability:', error);
      console.error('[BackgroundRemover] Error details:', JSON.stringify(error));
      this.isAppleVisionAvailable = false;
    }
  }

  /**
   * Get the current background removal method
   */
  async getRemovalMethod(): Promise<'apple-vision' | 'pixian'> {
    if (this.isAppleVisionAvailable === null) {
      await this.checkAppleVisionAvailability();
    }

    return this.isAppleVisionAvailable ? 'apple-vision' : 'pixian';
  }

  private getBasicAuthHeaderValue(): string {
    const raw = `${this.apiId}:${this.apiSecret}`;
    // btoa is not guaranteed in Hermes / React Native; Buffer is.
    const encoded = Buffer.from(raw, 'utf8').toString('base64');
    return `Basic ${encoded}`;
  }

  private getMimeTypeFromUri(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
    return 'application/octet-stream';
  }

  private getFileNameFromUri(uri: string): string {
    const sanitized = uri.split('?')[0];
    const last = sanitized.split('/').pop();
    if (last && last.includes('.')) return last;
    const ext = this.getMimeTypeFromUri(uri) === 'image/png' ? 'png' : 'jpg';
    return `image.${ext}`;
  }

  private async ensureLocalFileUri(uri: string): Promise<string> {
    if (/^https?:\/\//i.test(uri)) {
      const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!dir) {
        throw new Error('No writable directory available to download remote image');
      }

      const target = `${dir}pixian_input_${Date.now()}`;
      console.log('[BackgroundRemover] Downloading remote image to:', target);
      const downloaded = await FileSystem.downloadAsync(uri, target);
      return downloaded.uri;
    }

    return uri;
  }

  private getOutputUriFromContentType(contentType: string | null): string {
    const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!dir) {
      throw new Error('No writable directory available to save processed image');
    }

    const ct = (contentType ?? '').toLowerCase();
    const ext = ct.includes('jpeg') || ct.includes('jpg') ? 'jpg' : 'png';
    return `${dir}pixian_nobg_${Date.now()}.${ext}`;
  }

  private async fetchWithTimeout(
    input: RequestInfo,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    return await Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
  }

  private async checkPixianReachable(timeoutMs: number = 10000): Promise<void> {
    const authHeaderValue = this.getBasicAuthHeaderValue();
    const startedAt = Date.now();

    try {
      const response = await this.fetchWithTimeout(
        this.accountUrl,
        {
          method: 'GET',
          headers: {
            Authorization: authHeaderValue,
            Accept: 'application/json',
          },
        },
        timeoutMs,
      );

      const elapsed = Date.now() - startedAt;
      console.log('[BackgroundRemover] Pixian /account reachable:', {
        status: response.status,
        elapsedMs: elapsed,
      });

      // 200 = ok, 401 = creds issue; both prove network reachability.
      if (response.status === 401) {
        // Credentials might be wrong, but network is fine.
        return;
      }

      if (!response.ok) {
        console.warn('[BackgroundRemover] Pixian /account unexpected status:', response.status);
      }
    } catch (error) {
      const elapsed = Date.now() - startedAt;
      console.error('[BackgroundRemover] Pixian /account check failed:', {
        elapsedMs: elapsed,
        error: error instanceof Error ? { name: error.name, message: error.message } : error,
      });
      throw new Error(
        'Cannot reach Pixian.ai from this device/network. Check VPN/firewall/DNS and try again.',
      );
    }
  }

  /**
   * Remove background from image using Apple Vision (iOS 16+) or Pixian.ai API
   *
   * @param imageUri - Local file URI of the image
   * @param options - Optional parameters for background removal (Pixian only)
   *
   * Automatically uses:
   * - Apple Vision on iOS 16+ (free, offline, fast)
   * - Pixian.ai API as fallback for Android or older iOS
   */
  async removeBackground(imageUri: string, options: PixianOptions = {}): Promise<string> {
    console.log('[BackgroundRemover] Starting background removal for:', imageUri);

    // IMPORTANT: Always check Apple Vision availability before use
    // This ensures the async check in constructor has completed
    if (this.isAppleVisionAvailable === null) {
      console.log(
        '[BackgroundRemover] Apple Vision availability not yet determined, checking now...',
      );
      await this.checkAppleVisionAvailability();
    }

    console.log('[BackgroundRemover] Current Apple Vision status:', this.isAppleVisionAvailable);

    // Try Apple Vision first on iOS 16+
    if (this.isAppleVisionAvailable) {
      try {
        console.log('[BackgroundRemover] Using Apple Vision (free, on-device)');
        const startTime = Date.now();

        const resultUri = await SubjectLifter.liftSubject(imageUri);

        const elapsed = Date.now() - startTime;
        console.log('[BackgroundRemover] Apple Vision completed in', elapsed, 'ms');
        console.log('[BackgroundRemover] Result saved to:', resultUri);

        return resultUri;
      } catch (error) {
        console.error('[BackgroundRemover] Apple Vision failed, falling back to Pixian:', error);
        console.error('[BackgroundRemover] Apple Vision error details:', JSON.stringify(error));
        // Continue to Pixian fallback
      }
    } else {
      console.log('[BackgroundRemover] Apple Vision not available, reason:');
      console.log('[BackgroundRemover] - Platform:', Platform.OS);
      console.log('[BackgroundRemover] - isAppleVisionAvailable:', this.isAppleVisionAvailable);
    }

    // Fallback to Pixian.ai
    console.log('[BackgroundRemover] Using Pixian.ai API (cloud, paid)');
    return await this.removeBackgroundViaPixian(imageUri, options);
  }

  /**
   * Remove background using Pixian.ai API (fallback method)
   *
   * @private
   */
  private async removeBackgroundViaPixian(
    imageUri: string,
    options: PixianOptions = {},
  ): Promise<string> {
    if (!this.apiId || !this.apiSecret) {
      throw new Error('Pixian.ai API credentials not configured');
    }

    try {
      // Fast connectivity check to distinguish network issues from request formatting problems.
      await this.checkPixianReachable(10000);

      const localInputUri = await this.ensureLocalFileUri(imageUri);

      // Verify source file exists
      const sourceInfo = await FileSystem.getInfoAsync(localInputUri);
      if (!sourceInfo.exists) {
        throw new Error(`Source image does not exist: ${localInputUri}`);
      }
      console.log('[BackgroundRemover] Source file exists, size:', sourceInfo.size);

      // Prepare form data.
      // NOTE: Using `image.base64` is significantly more reliable in Expo/RN than
      // multipart file streaming on some iOS setups (where uploads can hang).
      const formData = new FormData();

      console.log('[BackgroundRemover] Reading image as base64...');
      const base64Image = await FileSystem.readAsStringAsync(localInputUri, {
        encoding: 'base64',
      });
      console.log('[BackgroundRemover] Base64 length:', base64Image.length);

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

      const authHeaderValue = this.getBasicAuthHeaderValue();

      // Make API request with timeout and retry logic
      console.log('[BackgroundRemover] Making API request to Pixian.ai...');
      console.log('[BackgroundRemover] API URL:', this.apiUrl);
      console.log('[BackgroundRemover] Auth configured:', !!this.apiId && !!this.apiSecret);

      let response: Response | undefined;

      const requestInit: RequestInit = {
        method: 'POST',
        headers: {
          Authorization: authHeaderValue,
          // Explicitly set Accept header for better compatibility
          Accept: 'image/png, image/jpeg, image/*, */*',
        },
        body: formData,
      };

      const timeouts = [45000, 90000];
      let lastError: unknown = undefined;

      for (let attempt = 0; attempt < timeouts.length; attempt++) {
        const timeoutMs = timeouts[attempt];
        const startedAt = Date.now();
        try {
          console.log(
            '[BackgroundRemover] Pixian request attempt:',
            attempt + 1,
            'timeoutMs:',
            timeoutMs,
          );
          response = await this.fetchWithTimeout(this.apiUrl, requestInit, timeoutMs);
          console.log(
            '[BackgroundRemover] Pixian request completed in ms:',
            Date.now() - startedAt,
          );
          lastError = undefined;
          break;
        } catch (err) {
          lastError = err;
          console.error('[BackgroundRemover] Pixian request failed attempt:', attempt + 1, {
            name: err instanceof Error ? err.name : undefined,
            message: err instanceof Error ? err.message : String(err),
            elapsedMs: Date.now() - startedAt,
          });
        }
      }

      if (!response) {
        const message = lastError instanceof Error ? lastError.message : 'Unknown network error';
        throw new Error(message);
      }

      console.log('[BackgroundRemover] API response status:', response.status);
      console.log('[BackgroundRemover] API response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });

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

      // Save response (binary image) to file system
      console.log('[BackgroundRemover] Processing response binary...');
      const contentType = response.headers.get('content-type');
      const processedPath = this.getOutputUriFromContentType(contentType);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      console.log('[BackgroundRemover] Saving processed image to:', processedPath);
      await FileSystem.writeAsStringAsync(processedPath, base64, {
        encoding: 'base64',
      });

      const savedInfo = await FileSystem.getInfoAsync(processedPath);
      if (!savedInfo.exists) {
        throw new Error('Failed to save processed image - file does not exist');
      }
      console.log('[BackgroundRemover] Processed image saved successfully, size:', savedInfo.size);

      return processedPath;
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
      const authHeaderValue = this.getBasicAuthHeaderValue();

      const response = await fetch(this.accountUrl, {
        method: 'GET',
        headers: {
          Authorization: authHeaderValue,
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
