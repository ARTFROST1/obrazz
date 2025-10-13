import { supabase } from '@lib/supabase/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { WardrobeItem, ItemCategory } from '../../types/models/item';
import { Season, StyleTag } from '../../types/models/user';

export interface CreateItemInput {
  userId: string;
  title?: string;
  category: ItemCategory;
  subcategory?: string;
  colors: Array<{ hex: string; name?: string }>;
  primaryColor: { hex: string; name?: string };
  material?: string;
  styles: StyleTag[];
  seasons: Season[];
  imageUri: string;
  brand?: string;
  size?: string;
  tags?: string[];
  isBuiltin?: boolean;
}

export interface UpdateItemInput {
  title?: string;
  category?: ItemCategory;
  subcategory?: string;
  colors?: Array<{ hex: string; name?: string }>;
  primaryColor?: { hex: string; name?: string };
  material?: string;
  styles?: StyleTag[];
  seasons?: Season[];
  brand?: string;
  size?: string;
  tags?: string[];
  isFavorite?: boolean;
}

class ItemService {
  /**
   * Create a new wardrobe item
   */
  async createItem(input: CreateItemInput): Promise<WardrobeItem> {
    try {
      // Process and save image locally
      const localImagePath = await this.saveImageLocally(input.imageUri, input.userId);

      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(localImagePath);

      // Prepare item data for Supabase
      const itemData = {
        user_id: input.userId,
        name: input.title || 'Untitled Item',
        category: input.category,
        color: input.primaryColor.hex,
        style: input.styles,
        season: input.seasons,
        tags: input.tags || [],
        favorite: false,
        is_default: input.isBuiltin || false,
        image_url: localImagePath,
        thumbnail_url: thumbnailPath,
        metadata: {
          subcategory: input.subcategory,
          colors: input.colors,
          primaryColor: input.primaryColor,
          material: input.material,
          brand: input.brand,
          size: input.size,
          imageLocalPath: localImagePath,
          backgroundRemoved: false,
          source: 'gallery',
        },
      };

      const { data, error } = await supabase.from('items').insert(itemData).select().single();

      if (error) throw error;

      return this.mapSupabaseItemToWardrobeItem(data);
    } catch (error) {
      console.error('Error creating item:', error);
      throw new Error('Failed to create wardrobe item');
    }
  }

  /**
   * Get all items for a user
   */
  async getUserItems(userId: string): Promise<WardrobeItem[]> {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapSupabaseItemToWardrobeItem);
    } catch (error) {
      console.error('Error fetching items:', error);
      throw new Error('Failed to fetch wardrobe items');
    }
  }

  /**
   * Get a single item by ID
   */
  async getItemById(itemId: string): Promise<WardrobeItem> {
    try {
      const { data, error } = await supabase.from('items').select('*').eq('id', itemId).single();

      if (error) throw error;

      return this.mapSupabaseItemToWardrobeItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
      throw new Error('Failed to fetch item');
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(itemId: string, updates: UpdateItemInput): Promise<WardrobeItem> {
    try {
      const updateData: any = {};

      if (updates.title !== undefined) updateData.name = updates.title;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.primaryColor !== undefined) updateData.color = updates.primaryColor.hex;
      if (updates.styles !== undefined) updateData.style = updates.styles;
      if (updates.seasons !== undefined) updateData.season = updates.seasons;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isFavorite !== undefined) updateData.favorite = updates.isFavorite;

      // Update metadata
      const metadataUpdates: any = {};
      if (updates.subcategory !== undefined) metadataUpdates.subcategory = updates.subcategory;
      if (updates.colors !== undefined) metadataUpdates.colors = updates.colors;
      if (updates.primaryColor !== undefined) metadataUpdates.primaryColor = updates.primaryColor;
      if (updates.material !== undefined) metadataUpdates.material = updates.material;
      if (updates.brand !== undefined) metadataUpdates.brand = updates.brand;
      if (updates.size !== undefined) metadataUpdates.size = updates.size;

      if (Object.keys(metadataUpdates).length > 0) {
        // Fetch current metadata and merge
        const { data: currentData } = await supabase
          .from('items')
          .select('metadata')
          .eq('id', itemId)
          .single();

        updateData.metadata = {
          ...(currentData?.metadata || {}),
          ...metadataUpdates,
        };
      }

      const { data, error } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      return this.mapSupabaseItemToWardrobeItem(data);
    } catch (error) {
      console.error('Error updating item:', error);
      throw new Error('Failed to update item');
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      // Get item to delete local files
      const { data: item } = await supabase
        .from('items')
        .select('image_url, thumbnail_url')
        .eq('id', itemId)
        .single();

      // Delete from Supabase
      const { error } = await supabase.from('items').delete().eq('id', itemId);

      if (error) throw error;

      // Delete local files
      if (item?.image_url) {
        await this.deleteLocalImage(item.image_url);
      }
      if (item?.thumbnail_url) {
        await this.deleteLocalImage(item.thumbnail_url);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      throw new Error('Failed to delete item');
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(itemId: string, isFavorite: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('items')
        .update({ favorite: isFavorite })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error('Failed to toggle favorite');
    }
  }

  /**
   * Save image to local file system
   */
  private async saveImageLocally(imageUri: string, userId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}.jpg`;
      const directory = `${FileSystem.documentDirectory}wardrobe/`;

      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const localPath = `${directory}${fileName}`;

      // Copy or move image to local storage
      await FileSystem.copyAsync({
        from: imageUri,
        to: localPath,
      });

      return localPath;
    } catch (error) {
      console.error('Error saving image locally:', error);
      throw new Error('Failed to save image');
    }
  }

  /**
   * Generate thumbnail for image
   */
  private async generateThumbnail(imagePath: string): Promise<string> {
    try {
      const thumbnailSize = 300;
      const manipResult = await ImageManipulator.manipulateAsync(
        imagePath,
        [{ resize: { width: thumbnailSize } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );

      const thumbnailPath = imagePath.replace('.jpg', '_thumb.jpg');
      await FileSystem.copyAsync({
        from: manipResult.uri,
        to: thumbnailPath,
      });

      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return original path if thumbnail generation fails
      return imagePath;
    }
  }

  /**
   * Delete local image file
   */
  private async deleteLocalImage(imagePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(imagePath);
      }
    } catch (error) {
      console.error('Error deleting local image:', error);
    }
  }

  /**
   * Map Supabase item to WardrobeItem model
   */
  private mapSupabaseItemToWardrobeItem(data: any): WardrobeItem {
    const metadata = data.metadata || {};

    return {
      id: data.id,
      userId: data.user_id,
      title: data.name,
      category: data.category,
      subcategory: metadata.subcategory,
      colors: metadata.colors || [{ hex: data.color }],
      primaryColor: metadata.primaryColor || { hex: data.color },
      material: metadata.material,
      styles: data.style || [],
      seasons: data.season || [],
      imageLocalPath: data.image_url,
      imageUrl: data.image_url,
      isBuiltin: data.is_default,
      brand: metadata.brand,
      size: metadata.size,
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      wearCount: 0,
      isFavorite: data.favorite,
      metadata: {
        originalImagePath: metadata.originalImagePath,
        processedImagePath: metadata.processedImagePath,
        backgroundRemoved: metadata.backgroundRemoved || false,
        imageWidth: metadata.imageWidth,
        imageHeight: metadata.imageHeight,
        dominantColors: metadata.dominantColors,
        aiTags: metadata.aiTags,
        source: metadata.source || 'gallery',
        sourceUrl: metadata.sourceUrl,
      },
    };
  }
}

export const itemService = new ItemService();
