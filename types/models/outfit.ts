import { Season, StyleTag } from './user';
import { WardrobeItem, ItemTransform, ItemCategory } from './item';

export interface Outfit {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  items: OutfitItem[];
  background: OutfitBackground;
  visibility: 'private' | 'shared' | 'public';
  isAiGenerated: boolean;
  aiMetadata?: AiOutfitMetadata;
  tags?: string[];
  styles: StyleTag[];
  seasons: Season[];
  occasions?: OccasionTag[];
  createdAt: Date;
  updatedAt: Date;
  lastWornAt?: Date;
  wearCount: number;
  isFavorite: boolean;
  likesCount: number;
  viewsCount: number;
  sharesCount: number;
  canvasSettings?: CanvasSettings;
}

export interface OutfitItem {
  itemId: string;
  item?: WardrobeItem; // Populated when fetching
  category: ItemCategory;
  slot: number;
  transform: ItemTransform;
  isVisible: boolean;
}

export interface OutfitBackground {
  type: 'color' | 'gradient' | 'image' | 'pattern';
  value: string; // Hex color, gradient CSS, image URL, or pattern ID
  opacity?: number;
}

export interface CanvasSettings {
  width: number;
  height: number;
  aspectRatio: string;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface AiOutfitMetadata {
  generationId: string;
  model: string;
  prompt?: string;
  style: StyleTag;
  season: Season;
  colorHarmony: string;
  confidence: number;
  explanation?: string;
  alternatives?: string[];
}

export type OccasionTag = 
  | 'casual'
  | 'work'
  | 'party'
  | 'date'
  | 'sport'
  | 'beach'
  | 'wedding'
  | 'travel'
  | 'home'
  | 'special';

export interface OutfitFilter {
  visibility?: ('private' | 'shared' | 'public')[];
  isAiGenerated?: boolean;
  isFavorite?: boolean;
  styles?: StyleTag[];
  seasons?: Season[];
  occasions?: OccasionTag[];
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface OutfitSortOptions {
  field: 'createdAt' | 'updatedAt' | 'lastWornAt' | 'wearCount' | 'likesCount' | 'title';
  direction: 'asc' | 'desc';
}

export interface OutfitCreationParams {
  items: OutfitItem[];
  background?: OutfitBackground;
  title?: string;
  description?: string;
  styles?: StyleTag[];
  seasons?: Season[];
  occasions?: OccasionTag[];
  visibility?: 'private' | 'shared' | 'public';
}

export interface AiGenerationParams {
  style: StyleTag;
  seasons: Season[];
  occasions?: OccasionTag[];
  colorConstraints?: {
    include?: string[];
    exclude?: string[];
  };
  mustIncludeItems?: string[];
  excludeCategories?: ItemCategory[];
  numberOfVariants?: number;
}

export interface AiGenerationResult {
  id: string;
  variants: Outfit[];
  metadata: {
    processingTime: number;
    model: string;
    confidence: number;
  };
}
