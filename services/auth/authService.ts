import { supabase, clearAuthStorage } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth/authStore';

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
    } catch (error) {
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
    } catch (error) {
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
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: this.formatError(error.message),
        };
      }

      useAuthStore.getState().clearAuth();
      return {
        success: true,
        message: 'Signed out successfully!',
      };
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        // Check if it's a refresh token error
        if (
          error.message?.includes('refresh') ||
          error.message?.includes('Refresh Token') ||
          error.message?.includes('Invalid Refresh Token')
        ) {
          console.warn('[AuthService] Invalid refresh token detected, clearing storage...');
          await clearAuthStorage();
          await supabase.auth.signOut({ scope: 'local' });
        }
        throw error;
      }

      return data.session;
    } catch (error: any) {
      console.error('[AuthService] Error getting session:', error?.message || error);

      // If it's a refresh token error, ensure storage is cleared
      if (error?.message?.includes('refresh') || error?.message?.includes('Refresh Token')) {
        await clearAuthStorage();
      }

      return null;
    }
  }

  /**
   * Initialize auth state listener
   */
  initializeAuthListener() {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        useAuthStore.getState().initialize(session.user, session);
      } else {
        useAuthStore.getState().clearAuth();
      }
    });
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
