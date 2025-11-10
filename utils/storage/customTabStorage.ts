/**
 * Custom Tab Storage Utility
 * Handles persistence of custom tab configuration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemCategory } from '../../types/models/item';
import { DEFAULT_CUSTOM_CATEGORIES } from '@constants/outfitTabs';

const CUSTOM_TAB_KEY = '@obrazz_custom_tab_config';
const LAST_ACTIVE_TAB_KEY = '@obrazz_last_active_tab';

/**
 * Custom tab configuration structure
 */
export interface CustomTabConfig {
  categories: ItemCategory[];
  order: number[];
  lastModified: number;
}

/**
 * Save custom tab configuration to storage
 */
export const saveCustomTabConfig = async (
  categories: ItemCategory[],
  order: number[],
): Promise<void> => {
  try {
    const config: CustomTabConfig = {
      categories,
      order,
      lastModified: Date.now(),
    };
    await AsyncStorage.setItem(CUSTOM_TAB_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('[CustomTabStorage] Failed to save config:', error);
    throw error;
  }
};

/**
 * Load custom tab configuration from storage
 */
export const loadCustomTabConfig = async (): Promise<CustomTabConfig> => {
  try {
    const stored = await AsyncStorage.getItem(CUSTOM_TAB_KEY);

    if (stored) {
      const config = JSON.parse(stored) as CustomTabConfig;

      // Validate loaded config
      if (Array.isArray(config.categories) && config.categories.length > 0) {
        return config;
      }
    }

    // Return default if no valid config found
    return {
      categories: DEFAULT_CUSTOM_CATEGORIES,
      order: DEFAULT_CUSTOM_CATEGORIES.map((_, index) => index),
      lastModified: Date.now(),
    };
  } catch (error) {
    console.error('[CustomTabStorage] Failed to load config:', error);

    // Return default on error
    return {
      categories: DEFAULT_CUSTOM_CATEGORIES,
      order: DEFAULT_CUSTOM_CATEGORIES.map((_, index) => index),
      lastModified: Date.now(),
    };
  }
};

/**
 * Clear custom tab configuration
 */
export const clearCustomTabConfig = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CUSTOM_TAB_KEY);
  } catch (error) {
    console.error('[CustomTabStorage] Failed to clear config:', error);
    throw error;
  }
};

/**
 * Save last active tab
 */
export const saveLastActiveTab = async (tabId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_TAB_KEY, tabId);
  } catch (error) {
    console.error('[CustomTabStorage] Failed to save last active tab:', error);
  }
};

/**
 * Load last active tab
 */
export const loadLastActiveTab = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_ACTIVE_TAB_KEY);
  } catch (error) {
    console.error('[CustomTabStorage] Failed to load last active tab:', error);
    return null;
  }
};

/**
 * Migrate old activeCategories to custom tab
 * This helps with backwards compatibility
 */
export const migrateActiveCategories = async (activeCategories: ItemCategory[]): Promise<void> => {
  try {
    // Only migrate if custom tab doesn't exist
    const existing = await AsyncStorage.getItem(CUSTOM_TAB_KEY);

    if (!existing && activeCategories.length > 0) {
      await saveCustomTabConfig(
        activeCategories,
        activeCategories.map((_, index) => index),
      );
      console.log('[CustomTabStorage] Migrated active categories to custom tab');
    }
  } catch (error) {
    console.error('[CustomTabStorage] Failed to migrate:', error);
  }
};
