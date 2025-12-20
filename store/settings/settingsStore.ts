import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../storage';

/**
 * Settings Store - User Preferences
 * Handles language, theme, and other app-wide settings
 */

export interface SettingsState {
  // Language
  language: 'ru' | 'en';
  setLanguage: (lang: 'ru' | 'en') => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Reset to defaults
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  language: 'ru' as const,
  theme: 'system' as const,
  notificationsEnabled: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setLanguage: (language) => {
        console.log('[SettingsStore] Setting language:', language);
        set({ language });
      },

      setTheme: (theme) => {
        console.log('[SettingsStore] Setting theme:', theme);
        set({ theme });
      },

      setNotificationsEnabled: (notificationsEnabled) => {
        console.log('[SettingsStore] Setting notifications:', notificationsEnabled);
        set({ notificationsEnabled });
      },

      resetSettings: () => {
        console.log('[SettingsStore] Resetting to defaults');
        set(DEFAULT_SETTINGS);
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        notificationsEnabled: state.notificationsEnabled,
      }),
      skipHydration: true, // Skip hydration on server (SSR)
    },
  ),
);
