import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Configuration Error:\n' +
      '  - Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY\n' +
      '  - Please check your .env file\n' +
      '  - Run: npx expo start --clear to reload environment variables',
  );
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  console.warn('[Supabase] Warning: URL does not appear to be a valid Supabase URL:', supabaseUrl);
}

console.log(
  '[Supabase] Initializing with URL:',
  supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
);

// Storage adapter with error handling for corrupted sessions
const createSafeStorage = (baseStorage: typeof AsyncStorage) => {
  const SUPABASE_AUTH_KEY = 'supabase.auth.token';

  return {
    getItem: async (key: string) => {
      try {
        const item = await baseStorage.getItem(key);

        // If we're getting the auth token, validate it's not corrupted
        if (key === SUPABASE_AUTH_KEY && item) {
          try {
            const parsed = JSON.parse(item);
            // Basic validation - check for required fields
            if (!parsed || typeof parsed !== 'object') {
              console.warn('[SafeStorage] Corrupted auth data detected, clearing...');
              await baseStorage.removeItem(key);
              return null;
            }
          } catch (parseError) {
            console.warn('[SafeStorage] Failed to parse auth data, clearing...', parseError);
            await baseStorage.removeItem(key);
            return null;
          }
        }

        return item;
      } catch (error) {
        console.error('[SafeStorage] Error getting item:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await baseStorage.setItem(key, value);
      } catch (error) {
        console.error('[SafeStorage] Error setting item:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await baseStorage.removeItem(key);
      } catch (error) {
        console.error('[SafeStorage] Error removing item:', error);
      }
    },
  };
};

// Web-compatible storage adapter using localStorage
const WebStorage = {
  getItem: async (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

// Use platform-specific storage with safety wrapper
const baseStorage = Platform.OS === 'web' ? WebStorage : AsyncStorage;
const storage = Platform.OS === 'web' ? WebStorage : createSafeStorage(AsyncStorage);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Helper function to clear corrupted auth data
export const clearAuthStorage = async () => {
  try {
    console.log('[Supabase] Clearing auth storage...');
    const keys = [
      'supabase.auth.token',
      '@supabase.auth.token', // Old format
    ];

    for (const key of keys) {
      await baseStorage.removeItem(key);
    }

    console.log('[Supabase] Auth storage cleared successfully');
  } catch (error) {
    console.error('[Supabase] Error clearing auth storage:', error);
  }
};
