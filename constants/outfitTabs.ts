/**
 * Outfit Creator Tabs Configuration
 * Defines default tabs and their category layouts
 */

import { OutfitTab, OutfitTabType } from '../types/components/OutfitCreator';
import { ItemCategory } from '../types/models/item';
import { CATEGORIES } from './categories';

/**
 * Default outfit tabs configuration
 * Each tab represents a different outfit building approach
 */
export const DEFAULT_OUTFIT_TABS: OutfitTab[] = [
  {
    id: 'basic',
    label: 'Basic',
    icon: 'shirt',
    categories: ['tops', 'bottoms', 'footwear'],
    description: 'Essential pieces - tops, bottoms, and footwear',
  },
  {
    id: 'dress',
    label: 'Dress',
    icon: 'woman',
    categories: ['fullbody', 'footwear', 'accessories'],
    description: 'Complete looks with dresses and accessories',
  },
  {
    id: 'all',
    label: 'All',
    icon: 'grid',
    categories: [...CATEGORIES], // All 8 categories
    description: 'All categories for maximum flexibility',
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: 'settings',
    categories: [], // Loaded from storage
    isCustomizable: true,
    description: 'Your personalized category layout',
  },
];

/**
 * Get tab configuration by ID
 */
export function getTabById(tabId: OutfitTabType): OutfitTab | undefined {
  return DEFAULT_OUTFIT_TABS.find((tab) => tab.id === tabId);
}

/**
 * Get categories for a specific tab
 */
export function getTabCategories(
  tabId: OutfitTabType,
  customCategories?: ItemCategory[],
): ItemCategory[] {
  if (tabId === 'custom' && customCategories) {
    return customCategories;
  }

  const tab = getTabById(tabId);
  return tab?.categories || [];
}

/**
 * Default custom tab categories (fallback)
 */
export const DEFAULT_CUSTOM_CATEGORIES: ItemCategory[] = ['tops', 'bottoms', 'footwear'];

/**
 * Minimum and maximum categories for custom tab
 */
export const CUSTOM_TAB_LIMITS = {
  MIN_CATEGORIES: 1,
  MAX_CATEGORIES: CATEGORIES.length, // 8
};

/**
 * Tab icons mapping for better type safety
 */
export const TAB_ICONS: Record<
  OutfitTabType,
  keyof typeof import('@expo/vector-icons').Ionicons.glyphMap
> = {
  basic: 'shirt',
  dress: 'woman',
  all: 'grid',
  custom: 'settings',
};

/**
 * Get optimal number of categories to display based on screen height
 */
export function getOptimalCategoriesCount(availableHeight: number): number {
  const MIN_CAROUSEL_HEIGHT = 100;
  const maxPossible = Math.floor(availableHeight / MIN_CAROUSEL_HEIGHT);
  return Math.min(maxPossible, CATEGORIES.length);
}

/**
 * Check if category can be added to custom tab
 */
export function canAddCategory(
  currentCategories: ItemCategory[],
  categoryToAdd: ItemCategory,
): boolean {
  if (currentCategories.includes(categoryToAdd)) {
    return false; // Already exists
  }
  if (currentCategories.length >= CUSTOM_TAB_LIMITS.MAX_CATEGORIES) {
    return false; // Max limit reached
  }
  return true;
}

/**
 * Check if category can be removed from custom tab
 */
export function canRemoveCategory(currentCategories: ItemCategory[]): boolean {
  return currentCategories.length > CUSTOM_TAB_LIMITS.MIN_CATEGORIES;
}
