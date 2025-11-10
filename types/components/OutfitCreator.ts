/**
 * Outfit Creator Tab System Types
 * Types for the new 4-tab system with customizable layouts
 */

import { ItemCategory } from '../models/item';

/**
 * Available tab types in outfit creation
 */
export type OutfitTabType = 'basic' | 'dress' | 'all' | 'custom';

/**
 * Configuration for a single outfit tab
 */
export interface OutfitTab {
  id: OutfitTabType;
  label: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  categories: ItemCategory[];
  isCustomizable?: boolean;
  description?: string;
}

/**
 * State management for custom tab
 */
export interface CustomTabState {
  categories: ItemCategory[];
  order: number[]; // Indices for category order
  isDragging: boolean;
  draggedIndex: number | null;
  isEditMode: boolean;
}

/**
 * Props for tab bar component
 */
export interface OutfitTabBarProps {
  activeTab: OutfitTabType;
  onTabChange: (tab: OutfitTabType) => void;
  customItemCount?: number;
  isCustomTabEditing?: boolean;
  tabs?: OutfitTab[];
}

/**
 * Props for custom tab manager
 */
export interface CustomTabManagerProps {
  categories: ItemCategory[];
  onCategoriesChange: (categories: ItemCategory[]) => void;
  onOrderChange: (order: number[]) => void;
  availableCategories: ItemCategory[];
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

/**
 * Carousel dimensions based on tab type
 */
export interface CarouselDimensions {
  itemWidth: number;
  itemHeight: number;
  carouselHeight: number;
  needsVerticalScroll?: boolean;
  totalHeight?: number;
}

/**
 * Tab layout configuration
 */
export interface TabLayoutConfig {
  tabType: OutfitTabType;
  categoriesCount: number;
  availableHeight: number;
  minCarouselHeight?: number;
  maxCarouselHeight?: number;
  optimalItemSize?: number;
}
