import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

/**
 * Web-compatible storage adapter using localStorage
 * Falls back to null operations if window is not available or localStorage is blocked
 */
const webStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(name);
        console.log(`[webStorage] getItem(${name}):`, item ? 'found' : 'not found');
        return item;
      }
      console.log(`[webStorage] getItem(${name}): window or localStorage not available`);
    } catch (error) {
      console.warn('[webStorage] getItem error:', error);
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
      }
    } catch (error) {
      console.warn('[webStorage] setItem error:', error);
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch (error) {
      console.warn('[webStorage] removeItem error:', error);
    }
  },
};

/**
 * Platform-specific storage for Zustand persist middleware
 * - Web: uses localStorage
 * - iOS/Android: uses AsyncStorage
 */
export const zustandStorage = Platform.OS === 'web' ? webStorage : AsyncStorage;
