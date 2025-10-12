import { Season, StyleTag } from './user';

export interface WardrobeItem {
  id: string;
  userId: string;
  title?: string;
  category: ItemCategory;
  subcategory?: string;
  colors: Color[];
  primaryColor: Color;
  material?: string;
  styles: StyleTag[];
  seasons: Season[];
  imageLocalPath?: string;
  imageHash?: string;
  imageUrl?: string; // For built-in items
  isBuiltin: boolean;
  brand?: string;
  size?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastWornAt?: Date;
  wearCount: number;
  isFavorite: boolean;
  metadata?: ItemMetadata;
}

export interface ItemMetadata {
  originalImagePath?: string;
  processedImagePath?: string;
  backgroundRemoved: boolean;
  imageWidth?: number;
  imageHeight?: number;
  dominantColors?: string[];
  aiTags?: string[];
  source?: 'camera' | 'gallery' | 'web' | 'builtin';
  sourceUrl?: string;
}

export type ItemCategory = 
  | 'headwear'      // Головные уборы
  | 'outerwear'     // Верхняя одежда
  | 'tops'          // Верх
  | 'bottoms'       // Низ
  | 'footwear'      // Обувь
  | 'accessories'   // Аксессуары
  | 'dresses'       // Платья
  | 'suits'         // Костюмы
  | 'bags';         // Сумки

export interface Color {
  hex: string;
  name?: string;
  rgb?: {
    r: number;
    g: number;
    b: number;
  };
  hsl?: {
    h: number;
    s: number;
    l: number;
  };
}

export interface ItemFilter {
  categories?: ItemCategory[];
  colors?: string[];
  styles?: StyleTag[];
  seasons?: Season[];
  materials?: string[];
  isFavorite?: boolean;
  isBuiltin?: boolean;
  searchQuery?: string;
}

export interface ItemSortOptions {
  field: 'createdAt' | 'updatedAt' | 'lastWornAt' | 'wearCount' | 'title';
  direction: 'asc' | 'desc';
}

export interface CategorySlot {
  category: ItemCategory;
  item?: WardrobeItem;
  isLocked?: boolean;
  transform?: ItemTransform;
}

export interface ItemTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}
