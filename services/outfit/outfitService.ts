import { supabase } from '../../lib/supabase/client';
import {
  Outfit,
  OutfitCreationParams,
  OutfitFilter,
  OutfitSortOptions,
} from '../../types/models/outfit';
import { WardrobeItem } from '../../types/models/item';

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

    const { data, error } = await supabase.from(this.tableName).insert(newOutfit).select().single();

    if (error) {
      console.error('Error creating outfit:', error);
      throw new Error(`Failed to create outfit: ${error.message}`);
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
      throw new Error(`Failed to fetch outfits: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToOutfit);
  }

  /**
   * Get a single outfit by ID
   */
  async getOutfitById(outfitId: string): Promise<Outfit> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', outfitId)
      .single();

    if (error) {
      console.error('Error fetching outfit:', error);
      throw new Error(`Failed to fetch outfit: ${error.message}`);
    }

    return this.mapDatabaseToOutfit(data);
  }

  /**
   * Update an existing outfit
   */
  async updateOutfit(outfitId: string, updates: Partial<Outfit>): Promise<Outfit> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', outfitId)
      .select()
      .single();

    if (error) {
      console.error('Error updating outfit:', error);
      throw new Error(`Failed to update outfit: ${error.message}`);
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
      throw new Error(`Failed to delete outfit: ${error.message}`);
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
      throw new Error(`Failed to toggle favorite: ${error.message}`);
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
  private mapDatabaseToOutfit(data: any): Outfit {
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
      throw new Error(`Failed to search outfits: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToOutfit);
  }
}

export const outfitService = new OutfitService();
