import { supabase } from '../../lib/supabase/client';
import { WardrobeItem } from '../../types/models/item';
import {
  AiOutfitMetadata,
  CanvasSettings,
  OccasionTag,
  Outfit,
  OutfitBackground,
  OutfitCreationParams,
  OutfitFilter,
  OutfitItem,
  OutfitSortOptions,
} from '../../types/models/outfit';
import { Season, StyleTag } from '../../types/models/user';
import { getErrorMessage, isNetworkError, logError } from '../../utils/errors/errorHandler';

// Database record interface (snake_case)
interface OutfitDbRecord {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  items?: OutfitItem[];
  background?: OutfitBackground;
  visibility?: 'private' | 'shared' | 'public';
  is_ai_generated?: boolean;
  ai_metadata?: AiOutfitMetadata;
  tags?: string[];
  styles?: StyleTag[];
  seasons?: Season[];
  occasions?: OccasionTag[];
  created_at: string;
  updated_at: string;
  last_worn_at?: string;
  wear_count?: number;
  is_favorite?: boolean;
  likes_count?: number;
  views_count?: number;
  shares_count?: number;
  canvas_settings?: CanvasSettings;
}

/**
 * Parse Supabase error to get a user-friendly message
 */
const parseSupabaseError = (error: unknown): string => {
  if (!error) return 'Unknown error';

  const message = getErrorMessage(error);

  // Network / timeout errors (common on mobile)
  if (isNetworkError(error)) {
    return 'Network error (timeout). Please check your connection and try again.';
  }

  // Check if the error message is HTML (Cloudflare error page, etc.)
  if (message.includes('<!DOCTYPE') || message.includes('<html')) {
    logError('OutfitService', 'Received HTML error response', {
      hint: 'Check Supabase URL configuration',
    });
    return 'Unable to connect to database. Please check your internet connection and try again.';
  }

  // Handle specific error codes
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code;

    if (code === 'PGRST116') {
      return 'Item not found';
    }

    if (code === '23505') {
      return 'A duplicate item already exists';
    }

    if (code === '42501' || message.includes('permission denied')) {
      return 'Access denied. Please log in again.';
    }
  }

  return message;
};

class OutfitService {
  private tableName = 'outfits';

  /**
   * Create a new outfit
   */
  async createOutfit(userId: string, params: OutfitCreationParams): Promise<Outfit> {
    // Map to database column names (snake_case)
    const newOutfit = {
      user_id: userId,
      title: params.title,
      description: params.description,
      items: params.items,
      background: params.background || { type: 'color', value: '#FFFFFF', opacity: 1 },
      canvas_settings: params.canvasSettings, // ✅ Save canvas settings with custom tab config
      visibility: params.visibility || 'private',
      is_ai_generated: false,
      styles: params.styles || [],
      seasons: params.seasons || [],
      occasions: params.occasions || [],
      tags: [],
      is_favorite: false,
      wear_count: 0,
      likes_count: 0,
      views_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 [outfitService] Creating outfit with canvasSettings:', params.canvasSettings);

    const { data, error } = await supabase.from(this.tableName).insert(newOutfit).select().single();

    if (error) {
      console.error('Error creating outfit:', error);
      throw new Error(`Failed to create outfit: ${parseSupabaseError(error)}`);
    }

    return this.mapDatabaseToOutfit(data);
  }

  /**
   * Get user's outfits with optional filtering
   */
  async getUserOutfits(
    userId: string,
    filter?: OutfitFilter,
    sort?: OutfitSortOptions,
  ): Promise<Outfit[]> {
    let query = supabase.from(this.tableName).select('*').eq('user_id', userId);

    // Apply filters
    if (filter) {
      if (filter.visibility && filter.visibility.length > 0) {
        query = query.in('visibility', filter.visibility);
      }

      if (filter.isAiGenerated !== undefined) {
        query = query.eq('is_ai_generated', filter.isAiGenerated);
      }

      if (filter.isFavorite !== undefined) {
        query = query.eq('is_favorite', filter.isFavorite);
      }

      if (filter.styles && filter.styles.length > 0) {
        query = query.contains('styles', filter.styles);
      }

      if (filter.seasons && filter.seasons.length > 0) {
        query = query.contains('seasons', filter.seasons);
      }

      if (filter.occasions && filter.occasions.length > 0) {
        query = query.contains('occasions', filter.occasions);
      }

      if (filter.dateRange) {
        query = query
          .gte('created_at', filter.dateRange.start.toISOString())
          .lte('created_at', filter.dateRange.end.toISOString());
      }
    }

    // Apply sorting
    const sortField = sort?.field || 'created_at';
    const sortDirection = sort?.direction || 'desc';
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching outfits:', error);
      throw new Error(`Failed to fetch outfits: ${parseSupabaseError(error)}`);
    }

    // Map outfits and populate items with full data
    const outfits = (data || []).map(this.mapDatabaseToOutfit);
    return this.populateOutfitItems(outfits);
  }

  /**
   * Populate outfit items with full wardrobe item data
   */
  private async populateOutfitItems(outfits: Outfit[]): Promise<Outfit[]> {
    if (outfits.length === 0) return outfits;

    // Collect all unique item IDs
    const allItemIds = new Set<string>();
    outfits.forEach((outfit) => {
      outfit.items.forEach((item) => {
        if (item.itemId) {
          allItemIds.add(item.itemId);
        }
      });
    });

    if (allItemIds.size === 0) return outfits;

    // Fetch all items in one batch query
    const { data: itemsData, error } = await supabase
      .from('items')
      .select('*')
      .in('id', Array.from(allItemIds));

    if (error) {
      console.error('Error fetching outfit items:', error);
      return outfits; // Return outfits without populated items
    }

    // Create a map for quick lookup
    const itemsMap = new Map(
      (itemsData || []).map((item) => [
        item.id,
        {
          id: item.id,
          userId: item.user_id,
          title: item.title,
          category: item.category,
          primaryColor: item.primary_color || item.colors?.[0] || '#CCCCCC',
          colors: item.colors,
          styles: item.styles,
          seasons: item.seasons,
          imageLocalPath: item.image_local_path,
          imageUrl: item.image_url,
          imageHash: item.image_hash,
          brand: item.brand,
          size: item.size,
          notes: item.notes,
          isFavorite: item.is_favorite,
          wearCount: item.wear_count,
          lastWornAt: item.last_worn_at ? new Date(item.last_worn_at) : undefined,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          isBuiltin: item.is_builtin || false,
        },
      ]),
    );

    // Populate items in each outfit
    return outfits.map((outfit) => ({
      ...outfit,
      items: outfit.items.map((outfitItem) => ({
        ...outfitItem,
        item: itemsMap.get(outfitItem.itemId) || outfitItem.item, // ✅ Preserve existing item if not in map
      })),
    }));
  }

  /**
   * Get a single outfit by ID
   */
  async getOutfitById(outfitId: string): Promise<Outfit> {
    console.log('📥 [outfitService] Getting outfit by ID:', outfitId);

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', outfitId)
      .single();

    if (error) {
      console.error('Error fetching outfit:', error);
      throw new Error(`Failed to fetch outfit: ${parseSupabaseError(error)}`);
    }

    const outfit = this.mapDatabaseToOutfit(data);

    // ✅ Populate items with full data
    const [populatedOutfit] = await this.populateOutfitItems([outfit]);

    console.log('✅ [outfitService] Outfit populated with items:', {
      outfitId: populatedOutfit.id,
      itemsCount: populatedOutfit.items.length,
    });

    return populatedOutfit;
  }

  /**
   * Update an existing outfit
   */
  async updateOutfit(outfitId: string, updates: Partial<Outfit>): Promise<Outfit> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // ✅ Map camelCase to snake_case for DB
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.items !== undefined) updateData.items = updates.items;
    if (updates.background !== undefined) updateData.background = updates.background;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
    if (updates.styles !== undefined) updateData.styles = updates.styles;
    if (updates.seasons !== undefined) updateData.seasons = updates.seasons;
    if (updates.occasions !== undefined) updateData.occasions = updates.occasions;
    if (updates.canvasSettings !== undefined) {
      updateData.canvas_settings = updates.canvasSettings; // ✅ Save canvas settings
      console.log('💾 [outfitService] Updating canvasSettings:', updates.canvasSettings);
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', outfitId)
      .select()
      .single();

    if (error) {
      console.error('Error updating outfit:', error);
      throw new Error(`Failed to update outfit: ${parseSupabaseError(error)}`);
    }

    return this.mapDatabaseToOutfit(data);
  }

  /**
   * Delete an outfit
   */
  async deleteOutfit(outfitId: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq('id', outfitId);

    if (error) {
      console.error('Error deleting outfit:', error);
      throw new Error(`Failed to delete outfit: ${parseSupabaseError(error)}`);
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(outfitId: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
      .eq('id', outfitId);

    if (error) {
      console.error('Error toggling favorite:', error);
      throw new Error(`Failed to toggle favorite: ${parseSupabaseError(error)}`);
    }
  }

  /**
   * Increment wear count
   */
  async incrementWearCount(outfitId: string): Promise<void> {
    const { data: outfit } = await supabase
      .from(this.tableName)
      .select('wear_count')
      .eq('id', outfitId)
      .single();

    if (outfit) {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          wear_count: (outfit.wear_count || 0) + 1,
          last_worn_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', outfitId);

      if (error) {
        console.error('Error incrementing wear count:', error);
      }
    }
  }

  /**
   * Get items for an outfit with full item data
   */
  async getOutfitWithItems(outfitId: string): Promise<Outfit & { itemsData: WardrobeItem[] }> {
    const outfit = await this.getOutfitById(outfitId);

    // Fetch all items referenced in the outfit
    const itemIds = outfit.items.map((item) => item.itemId);

    if (itemIds.length === 0) {
      return { ...outfit, itemsData: [] };
    }

    const { data: items, error } = await supabase.from('items').select('*').in('id', itemIds);

    if (error) {
      console.error('Error fetching outfit items:', error);
      return { ...outfit, itemsData: [] };
    }

    return { ...outfit, itemsData: items || [] };
  }

  /**
   * Duplicate an outfit
   */
  async duplicateOutfit(outfitId: string, userId: string): Promise<Outfit> {
    const original = await this.getOutfitById(outfitId);

    const duplicateParams: OutfitCreationParams = {
      title: `${original.title || 'Outfit'} (Copy)`,
      description: original.description,
      items: original.items,
      background: original.background,
      styles: original.styles,
      seasons: original.seasons,
      occasions: original.occasions,
      visibility: 'private', // Always private on duplicate
    };

    return this.createOutfit(userId, duplicateParams);
  }

  /**
   * Map database record to Outfit type
   */
  private mapDatabaseToOutfit(data: OutfitDbRecord): Outfit {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      items: data.items || [],
      background: data.background || { type: 'color', value: '#FFFFFF', opacity: 1 },
      visibility: data.visibility || 'private',
      isAiGenerated: data.is_ai_generated || false,
      aiMetadata: data.ai_metadata,
      tags: data.tags || [],
      styles: data.styles || [],
      seasons: data.seasons || [],
      occasions: data.occasions || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastWornAt: data.last_worn_at ? new Date(data.last_worn_at) : undefined,
      wearCount: data.wear_count || 0,
      isFavorite: data.is_favorite || false,
      likesCount: data.likes_count || 0,
      viewsCount: data.views_count || 0,
      sharesCount: data.shares_count || 0,
      canvasSettings: data.canvas_settings,
    };
  }

  /**
   * Search outfits by query
   */
  async searchOutfits(userId: string, query: string): Promise<Outfit[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching outfits:', error);
      throw new Error(`Failed to search outfits: ${parseSupabaseError(error)}`);
    }

    return (data || []).map(this.mapDatabaseToOutfit);
  }
}

export const outfitService = new OutfitService();
