import { supabase } from '@lib/supabase/client';
import { useAuthStore } from '@store/auth/authStore';
import { createLogger } from '@utils/logger';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

const logger = createLogger('OAuthService');

// Enable web browser redirect result handling
WebBrowser.maybeCompleteAuthSession();

export interface OAuthResponse {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Supabase URL for OAuth
 */
const getSupabaseUrl = (): string => {
  return Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
};

/**
 * Get redirect URL for OAuth callback
 * Uses Expo's AuthSession redirect URL for native apps
 */
const getRedirectUrl = (): string => {
  // For Expo Go / development builds
  const redirectUrl = AuthSession.makeRedirectUri({
    scheme: 'obrazz',
    path: 'auth/callback',
  });
  logger.info('OAuth redirect URL:', redirectUrl);
  return redirectUrl;
};

class OAuthService {
  /**
   * Sign in with Google
   * Uses Supabase OAuth flow with expo-web-browser
   */
  async signInWithGoogle(): Promise<OAuthResponse> {
    try {
      logger.info('Starting Google OAuth flow...');

      const supabaseUrl = getSupabaseUrl();
      const redirectUrl = getRedirectUrl();

      // Construct Supabase OAuth URL
      const authUrl =
        `${supabaseUrl}/auth/v1/authorize?` +
        new URLSearchParams({
          provider: 'google',
          redirect_to: redirectUrl,
        }).toString();

      logger.info('Opening Google OAuth URL...');

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        logger.info('Google OAuth redirect received');
        return await this.handleOAuthCallback(result.url);
      } else if (result.type === 'cancel') {
        logger.info('Google OAuth cancelled by user');
        return {
          success: false,
          error: 'Вход отменён',
        };
      } else {
        logger.warn('Google OAuth failed:', result.type);
        return {
          success: false,
          error: 'Ошибка входа через Google',
        };
      }
    } catch (error) {
      logger.error('Google OAuth error:', error);
      return {
        success: false,
        error: 'Произошла ошибка. Попробуйте снова.',
      };
    }
  }

  /**
   * Sign in with Apple
   * Uses native Apple Authentication on iOS, Supabase OAuth on other platforms
   */
  async signInWithApple(): Promise<OAuthResponse> {
    try {
      logger.info('Starting Apple OAuth flow...');

      // On iOS, use native Apple Authentication for better UX
      if (Platform.OS === 'ios') {
        return await this.signInWithAppleNative();
      }

      // On other platforms, use Supabase OAuth flow
      return await this.signInWithAppleWeb();
    } catch (error) {
      logger.error('Apple OAuth error:', error);
      return {
        success: false,
        error: 'Произошла ошибка. Попробуйте снова.',
      };
    }
  }

  /**
   * Native Apple Sign In (iOS only)
   * Provides best UX on iOS with Face ID/Touch ID
   */
  private async signInWithAppleNative(): Promise<OAuthResponse> {
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        logger.warn('Apple Authentication not available, falling back to web');
        return await this.signInWithAppleWeb();
      }

      logger.info('Using native Apple Authentication...');

      // Request Apple credentials
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      logger.info('Apple credential received, exchanging with Supabase...');

      // Extract full name for updating user metadata later
      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : undefined;

      // Exchange Apple credential with Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });

      if (error) {
        logger.error('Supabase Apple auth error:', error.message);
        return {
          success: false,
          error: this.formatError(error.message),
        };
      }

      // Update user metadata with name if available (Apple only provides it on first sign in)
      if (fullName && data.user) {
        await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
      }

      if (data.user && data.session) {
        logger.info('Apple sign in successful');
        useAuthStore.getState().initialize(data.user, data.session);
        return {
          success: true,
          message: 'Вход выполнен успешно!',
        };
      }

      return {
        success: false,
        error: 'Не удалось войти. Попробуйте снова.',
      };
    } catch (error: unknown) {
      // Handle user cancellation
      if (error instanceof Error && 'code' in error) {
        const appleError = error as { code: string };
        if (appleError.code === 'ERR_REQUEST_CANCELED') {
          logger.info('Apple sign in cancelled by user');
          return {
            success: false,
            error: 'Вход отменён',
          };
        }
      }

      logger.error('Native Apple auth error:', error);
      throw error;
    }
  }

  /**
   * Web-based Apple Sign In (fallback for non-iOS platforms)
   */
  private async signInWithAppleWeb(): Promise<OAuthResponse> {
    try {
      const supabaseUrl = getSupabaseUrl();
      const redirectUrl = getRedirectUrl();

      const authUrl =
        `${supabaseUrl}/auth/v1/authorize?` +
        new URLSearchParams({
          provider: 'apple',
          redirect_to: redirectUrl,
        }).toString();

      logger.info('Opening Apple OAuth URL...');

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        logger.info('Apple OAuth redirect received');
        return await this.handleOAuthCallback(result.url);
      } else if (result.type === 'cancel') {
        logger.info('Apple OAuth cancelled by user');
        return {
          success: false,
          error: 'Вход отменён',
        };
      } else {
        logger.warn('Apple OAuth failed:', result.type);
        return {
          success: false,
          error: 'Ошибка входа через Apple',
        };
      }
    } catch (error) {
      logger.error('Apple web OAuth error:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback URL
   * Extracts tokens from URL fragment and sets session
   */
  private async handleOAuthCallback(url: string): Promise<OAuthResponse> {
    try {
      logger.info('Processing OAuth callback...');

      // Parse URL to extract tokens from fragment
      const urlObj = new URL(url);

      // Tokens can be in hash fragment (#access_token=...) or query params
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Check hash fragment first (Supabase default)
      if (urlObj.hash) {
        const hashParams = new URLSearchParams(urlObj.hash.substring(1));
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token');
      }

      // Fallback to query params
      if (!accessToken) {
        accessToken = urlObj.searchParams.get('access_token');
        refreshToken = urlObj.searchParams.get('refresh_token');
      }

      // Check for error
      const error =
        urlObj.searchParams.get('error') ||
        (urlObj.hash ? new URLSearchParams(urlObj.hash.substring(1)).get('error') : null);

      if (error) {
        const errorDescription =
          urlObj.searchParams.get('error_description') ||
          (urlObj.hash
            ? new URLSearchParams(urlObj.hash.substring(1)).get('error_description')
            : null);
        logger.error('OAuth error:', error, errorDescription);
        return {
          success: false,
          error: errorDescription || error,
        };
      }

      if (!accessToken) {
        logger.error('No access token in callback URL');
        return {
          success: false,
          error: 'Не удалось получить токен авторизации',
        };
      }

      // Set session in Supabase client
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) {
        logger.error('Session set error:', sessionError.message);
        return {
          success: false,
          error: this.formatError(sessionError.message),
        };
      }

      if (data.user && data.session) {
        logger.info('OAuth session established successfully');
        useAuthStore.getState().initialize(data.user, data.session);
        return {
          success: true,
          message: 'Вход выполнен успешно!',
        };
      }

      return {
        success: false,
        error: 'Не удалось создать сессию',
      };
    } catch (error) {
      logger.error('OAuth callback processing error:', error);
      return {
        success: false,
        error: 'Ошибка обработки авторизации',
      };
    }
  }

  /**
   * Check if Apple Authentication is available on current device
   */
  async isAppleAuthAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return true; // Web OAuth always available
    }
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }

  /**
   * Format error messages to be user-friendly
   */
  private formatError(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Неверные данные для входа',
      'Email not confirmed': 'Подтвердите email для входа',
      'User already registered': 'Аккаунт уже существует',
      'Unable to validate email address': 'Некорректный email',
      'Invalid provider': 'Провайдер не поддерживается',
      'Provider not enabled': 'Провайдер не активирован',
    };

    return errorMap[error] || error;
  }
}

export const oauthService = new OAuthService();
