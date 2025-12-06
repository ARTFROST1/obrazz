import { Session, User } from '@supabase/supabase-js';
import { createLogger } from '@utils/logger';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../storage';

const logger = createLogger('AuthStore');

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  initialize: (user: User | null, session: Session | null) => void;
  handleAuthError: (error: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      setUser: (user) =>
        set(() => ({
          user,
          isAuthenticated: !!user,
          error: null,
        })),

      setSession: (session) =>
        set(() => ({
          session,
          isAuthenticated: !!session,
          error: null,
        })),

      setLoading: (isLoading) =>
        set(() => ({
          isLoading,
        })),

      setError: (error) =>
        set(() => ({
          error,
        })),

      clearAuth: () =>
        set(() => ({
          user: null,
          session: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        })),

      initialize: (user, session) =>
        set(() => ({
          user,
          session,
          isAuthenticated: !!user && !!session,
          isLoading: false,
          error: null,
        })),

      handleAuthError: (error) => {
        logger.error('Handling auth error:', error);

        // Clear auth state on critical errors
        if (
          error.includes('refresh') ||
          error.includes('Refresh Token') ||
          error.includes('Invalid')
        ) {
          set(() => ({
            user: null,
            session: null,
            isAuthenticated: false,
            error: 'Session expired. Please sign in again.',
            isLoading: false,
          }));
        } else {
          set((state) => ({
            ...state,
            error,
            isLoading: false,
          }));
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true, // Skip hydration on server (SSR)
    },
  ),
);
