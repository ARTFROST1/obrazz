import { clearAuthStorage, supabase } from '@lib/supabase/client';
import { isOnline } from '@services/sync/networkMonitor';
import { useAuthStore } from '@store/auth/authStore';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { createLogger } from '@utils/logger';

const logger = createLogger('AuthService');

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  message?: string;
}

class AuthService {
  private authListenerInitialized = false;
  private authListenerUnsubscribe: (() => void) | null = null;

  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { email, password, fullName } = data;

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: this.formatError(error.message),
        };
      }

      if (authData.user && authData.session) {
        useAuthStore.getState().initialize(authData.user, authData.session);
        return {
          success: true,
          message: 'Account created successfully!',
        };
      }

      // Email confirmation required
      return {
        success: true,
        message: 'Please check your email to confirm your account.',
      };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const { email, password } = data;

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: this.formatError(error.message),
        };
      }

      if (authData.user && authData.session) {
        useAuthStore.getState().initialize(authData.user, authData.session);
        return {
          success: true,
          message: 'Signed in successfully!',
        };
      }

      return {
        success: false,
        error: 'Failed to sign in. Please try again.',
      };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResponse> {
    try {
      logger.info('Signing out user...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Sign out error:', error.message);
        return {
          success: false,
          error: this.formatError(error.message),
        };
      }

      // Clear all user-specific state
      logger.info('Clearing user state...');
      useAuthStore.getState().clearAuth();
      useWardrobeStore.getState().clearAll();
      useOutfitStore.getState().resetCurrentOutfit();

      logger.info('Sign out successful');
      return {
        success: true,
        message: 'Signed out successfully!',
      };
    } catch (error) {
      logger.error('Unexpected sign out error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'obrazz://reset-password',
      });

      if (error) {
        return {
          success: false,
          error: this.formatError(error.message),
        };
      }

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: this.formatError(error.message),
        };
      }

      return {
        success: true,
        message: 'Password updated successfully!',
      };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Get current session with timeout protection
   */
  async getSession() {
    try {
      if (!isOnline()) {
        logger.info('Offline - skipping session fetch');
        return null;
      }

      // Important: supabase.auth.getSession() may still reject later even if a timeout
      // wins Promise.race. Wrap it so it always resolves, preventing unhandled rejections
      // (which show up as "TypeError: Network request failed" redboxes).
      const sessionPromise = supabase.auth
        .getSession()
        .then((result) => result)
        .catch((error) => ({ data: { session: null }, error }));

      const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((resolve) => {
        setTimeout(() => {
          resolve({ data: { session: null }, error: new Error('Session fetch timeout') });
        }, 2500);
      });

      // Race between session fetch and timeout (both promises resolve)
      const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);

      if (error) {
        // Check if it's a refresh token error
        if (
          error.message?.includes('refresh') ||
          error.message?.includes('Refresh Token') ||
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('Not Found')
        ) {
          logger.warn('Invalid/expired refresh token detected, clearing all auth data...');
          await clearAuthStorage();
          await supabase.auth.signOut({ scope: 'local' });
          useAuthStore.getState().clearAuth();
        }
        throw error;
      }

      return data.session;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Offline-first: timeouts and network failures are expected.
      // Avoid console.error here to prevent RN redbox noise.
      const isTimeoutOrNetworkError =
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('network') ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('TypeError: Network request failed') ||
        errorMessage.includes('ECONN') ||
        errorMessage.includes('ENOTFOUND');

      if (isTimeoutOrNetworkError) {
        logger.warn('Session fetch timeout/network error - returning null');
        logger.warn('Session error details:', errorMessage);
        return null;
      }

      logger.error('Error getting session:', errorMessage);

      // If it's a refresh token error, ensure storage is cleared
      if (
        errorMessage.includes('refresh') ||
        errorMessage.includes('Refresh Token') ||
        errorMessage.includes('Not Found')
      ) {
        logger.warn('Clearing corrupted auth state...');
        await clearAuthStorage();
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        useAuthStore.getState().clearAuth();
      }

      return null;
    }
  }

  /**
   * Initialize auth state listener
   */
  initializeAuthListener() {
    if (this.authListenerInitialized) return;

    const enableListenerInDev =
      process.env.EXPO_PUBLIC_ENABLE_SUPABASE_AUTH_LISTENER_DEV === 'true';

    // In dev (especially on emulators/offline), the INITIAL_SESSION flow can
    // trigger retryable fetch errors that show as redboxes. Keep listener enabled
    // for production; allow explicit opt-in for dev when needed.
    if (__DEV__ && !enableListenerInDev) {
      logger.info('Auth state listener disabled in dev');
      return;
    }

    this.authListenerInitialized = true;

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        logger.info('Auth state changed:', event);

        // Handle specific auth events
        if (event === 'TOKEN_REFRESHED') {
          logger.info('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          logger.info('User signed out');
          useAuthStore.getState().clearAuth();
          return;
        }

        if (session?.user) {
          useAuthStore.getState().initialize(session.user, session);
        } else {
          useAuthStore.getState().clearAuth();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error in auth state change handler:', errorMessage);

        // On any error, clear auth state to be safe
        if (
          errorMessage.includes('refresh') ||
          errorMessage.includes('Refresh Token') ||
          errorMessage.includes('Invalid')
        ) {
          logger.warn('Clearing auth due to error in state change');
          await clearAuthStorage();
          useAuthStore.getState().clearAuth();
        }
      }
    });

    // Store unsubscribe so RootLayout can clean up on unmount
    this.authListenerUnsubscribe = () => {
      try {
        data?.subscription?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }

  /**
   * Cleanup auth state listener
   */
  cleanupAuthListener() {
    this.authListenerUnsubscribe?.();
    this.authListenerUnsubscribe = null;
    this.authListenerInitialized = false;
  }

  /**
   * Format error messages to be user-friendly
   */
  private formatError(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password. Please try again.',
      'Email not confirmed': 'Please confirm your email address before signing in.',
      'User already registered': 'An account with this email already exists.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'Unable to validate email address': 'Please enter a valid email address.',
      'Signup requires a valid password': 'Please enter a valid password.',
    };

    return errorMap[error] || error;
  }
}

export const authService = new AuthService();
