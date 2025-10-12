import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
