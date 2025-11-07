/**
 * Unified Category Constants
 *
 * This file defines the single source of truth for clothing categories
 * across the entire application. All components, screens, and services
 * should import categories from here.
 */

import { ItemCategory } from '../types/models/item';

/**
 * Complete list of all item categories
 */
export const CATEGORIES: ItemCategory[] = [
  'headwear',
  'outerwear',
  'tops',
  'bottoms',
  'footwear',
  'accessories',
  'fullbody',
  'other',
];

/**
 * Russian labels for each category
 */
export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  headwear: 'головной убор',
  outerwear: 'верхняя одежда',
  tops: 'верх',
  bottoms: 'низ',
  footwear: 'обувь',
  accessories: 'аксессуары',
  fullbody: 'FullBody',
  other: 'Другое',
};

/**
 * English labels for each category (for API/internal use)
 */
export const CATEGORY_LABELS_EN: Record<ItemCategory, string> = {
  headwear: 'Headwear',
  outerwear: 'Outerwear',
  tops: 'Tops',
  bottoms: 'Bottoms',
  footwear: 'Footwear',
  accessories: 'Accessories',
  fullbody: 'Full Body',
  other: 'Other',
};

/**
 * Emoji icons for each category
 */
export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  headwear: '🎩',
  outerwear: '🧥',
  tops: '👕',
  bottoms: '👖',
  footwear: '👟',
  accessories: '⌚',
  fullbody: '👗',
  other: '📦',
};

/**
 * Category groups for outfit creation
 */
export const CATEGORY_GROUPS = {
  main: ['outerwear', 'tops', 'bottoms', 'footwear'] as const,
  extra: ['headwear', 'accessories', 'fullbody', 'other'] as const,
} as const;

/**
 * Get category label (defaults to Russian)
 */
export function getCategoryLabel(category: ItemCategory, lang: 'ru' | 'en' = 'ru'): string {
  return lang === 'en' ? CATEGORY_LABELS_EN[category] : CATEGORY_LABELS[category];
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: ItemCategory): string {
  return CATEGORY_ICONS[category];
}

/**
 * Get full category info
 */
export function getCategoryInfo(category: ItemCategory, lang: 'ru' | 'en' = 'ru') {
  return {
    value: category,
    label: getCategoryLabel(category, lang),
    icon: getCategoryIcon(category),
  };
}

/**
 * Get all categories with labels and icons
 */
export function getAllCategoriesInfo(lang: 'ru' | 'en' = 'ru') {
  return CATEGORIES.map((category) => getCategoryInfo(category, lang));
}
