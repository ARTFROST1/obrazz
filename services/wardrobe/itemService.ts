import { supabase } from '@lib/supabase/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { ItemCategory, ItemMetadata, WardrobeItem } from '../../types/models/item';
import { Season, StyleTag } from '../../types/models/user';

// Database record interface (snake_case)
interface ItemDbRecord {
  id: string;
  user_id: string;
  name?: string;
  category: ItemCategory;
  subcategory?: string;
  color?: string;
  colors?: Array<{ hex: string; name?: string }>;
  primary_color?: { hex: string };
  material?: string;
  style?: StyleTag[];
  season?: Season[];
  image_url?: string;
  is_default?: boolean;
  brand?: string;
  size?: string;
  price?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  favorite?: boolean;
  metadata?: ItemMetadata;
}

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
  price?: number;
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
  price?: number;
  tags?: string[];
  isFavorite?: boolean;
}

class ItemService {
  /**
   * Create a new wardrobe item
   */
  async createItem(input: CreateItemInput): Promise<WardrobeItem> {
    console.log('[ItemService] Starting createItem for user:', input.userId);

    try {
      // Process and save image locally
      console.log('[ItemService] Saving image locally from URI:', input.imageUri);
      const localImagePath = await this.saveImageLocally(input.imageUri, input.userId);
      console.log('[ItemService] Image saved to:', localImagePath);

      // Generate thumbnail
      console.log('[ItemService] Generating thumbnail...');
      const thumbnailPath = await this.generateThumbnail(localImagePath);
      console.log('[ItemService] Thumbnail created at:', thumbnailPath);

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
          price: input.price,
          imageLocalPath: localImagePath,
          backgroundRemoved: false,
          source: 'gallery',
        },
      };

      console.log('[ItemService] Inserting item to Supabase...');
      const { data, error } = await supabase.from('items').insert(itemData).select().single();

      if (error) {
        console.error('[ItemService] Supabase insert error:', error);
        throw error;
      }

      console.log('[ItemService] Item created successfully:', data.id);
      return this.mapSupabaseItemToWardrobeItem(data);
    } catch (error) {
      console.error('[ItemService] Error creating item:', error);
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('[ItemService] Error name:', error.name);
        console.error('[ItemService] Error message:', error.message);
        console.error('[ItemService] Error stack:', error.stack);
      }
      throw new Error(
        `Failed to create wardrobe item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get all items for a user (including default items, excluding hidden ones)
   */
  async getUserItems(userId: string): Promise<WardrobeItem[]> {
    try {
      // Get hidden default item IDs for this user
      const hiddenIds = await this.getHiddenDefaultItemIds(userId);

      // Get user's own items
      const { data: userItems, error: userError } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', false)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Get default items (not hidden by this user)
      let defaultItemsQuery = supabase
        .from('items')
        .select('*')
        .eq('is_default', true)
        .order('created_at', { ascending: false });

      // Exclude hidden items
      if (hiddenIds.length > 0) {
        defaultItemsQuery = defaultItemsQuery.not('id', 'in', `(${hiddenIds.join(',')})`);
      }

      const { data: defaultItems, error: defaultError } = await defaultItemsQuery;

      if (defaultError) throw defaultError;

      // Combine and return
      const allItems = [...(userItems || []), ...(defaultItems || [])];
      return allItems.map(this.mapSupabaseItemToWardrobeItem);
    } catch (error) {
      console.error('Error fetching items:', error);
      throw new Error('Failed to fetch wardrobe items');
    }
  }

  /**
   * Get only default/builtin items
   */
  async getDefaultItems(): Promise<WardrobeItem[]> {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_default', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapSupabaseItemToWardrobeItem);
    } catch (error) {
      console.error('Error fetching default items:', error);
      throw new Error('Failed to fetch default items');
    }
  }

  /**
   * Get IDs of default items hidden by this user
   */
  async getHiddenDefaultItemIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('hidden_default_items')
        .select('item_id')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map((row) => row.item_id);
    } catch (error) {
      console.error('Error fetching hidden default items:', error);
      return []; // Return empty array on error to not block the main flow
    }
  }

  /**
   * Hide a default item for a user
   */
  async hideDefaultItem(userId: string, itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('hidden_default_items')
        .insert({ user_id: userId, item_id: itemId });

      if (error) throw error;
    } catch (error) {
      console.error('Error hiding default item:', error);
      throw new Error('Failed to hide default item');
    }
  }

  /**
   * Unhide a default item for a user
   */
  async unhideDefaultItem(userId: string, itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('hidden_default_items')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unhiding default item:', error);
      throw new Error('Failed to unhide default item');
    }
  }

  /**
   * Restore all hidden default items for a user
   */
  async unhideAllDefaultItems(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('hidden_default_items').delete().eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unhiding all default items:', error);
      throw new Error('Failed to unhide all default items');
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
      const updateData: Record<string, unknown> = {};

      if (updates.title !== undefined) updateData.name = updates.title;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.primaryColor !== undefined) updateData.color = updates.primaryColor.hex;
      if (updates.styles !== undefined) updateData.style = updates.styles;
      if (updates.seasons !== undefined) updateData.season = updates.seasons;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isFavorite !== undefined) updateData.favorite = updates.isFavorite;

      // Update metadata
      const metadataUpdates: Record<string, unknown> = {};
      if (updates.subcategory !== undefined) metadataUpdates.subcategory = updates.subcategory;
      if (updates.colors !== undefined) metadataUpdates.colors = updates.colors;
      if (updates.primaryColor !== undefined) metadataUpdates.primaryColor = updates.primaryColor;
      if (updates.material !== undefined) metadataUpdates.material = updates.material;
      if (updates.brand !== undefined) metadataUpdates.brand = updates.brand;
      if (updates.size !== undefined) metadataUpdates.size = updates.size;
      if (updates.price !== undefined) metadataUpdates.price = updates.price;

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
      console.log('[ItemService.saveImageLocally] Input URI:', imageUri);
      console.log('[ItemService.saveImageLocally] User ID:', userId);

      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}.jpg`;
      const directory = `${FileSystem.documentDirectory}wardrobe/`;

      console.log('[ItemService.saveImageLocally] Target directory:', directory);

      // Check if source file exists
      const sourceInfo = await FileSystem.getInfoAsync(imageUri);
      if (!sourceInfo.exists) {
        throw new Error(`Source image does not exist: ${imageUri}`);
      }
      console.log('[ItemService.saveImageLocally] Source file exists, size:', sourceInfo.size);

      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        console.log('[ItemService.saveImageLocally] Creating directory:', directory);
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        console.log('[ItemService.saveImageLocally] Directory created successfully');
      } else {
        console.log('[ItemService.saveImageLocally] Directory already exists');
      }

      const localPath = `${directory}${fileName}`;
      console.log('[ItemService.saveImageLocally] Copying to:', localPath);

      // Copy or move image to local storage
      await FileSystem.copyAsync({
        from: imageUri,
        to: localPath,
      });

      // Verify the file was copied
      const copiedInfo = await FileSystem.getInfoAsync(localPath);
      if (!copiedInfo.exists) {
        throw new Error('File copy verification failed - destination file does not exist');
      }
      console.log(
        '[ItemService.saveImageLocally] File copied successfully, size:',
        copiedInfo.size,
      );

      return localPath;
    } catch (error) {
      console.error('[ItemService.saveImageLocally] Error:', error);
      if (error instanceof Error) {
        console.error('[ItemService.saveImageLocally] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw new Error(
        `Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate thumbnail for image
   */
  private async generateThumbnail(imagePath: string): Promise<string> {
    try {
      console.log('[ItemService.generateThumbnail] Input path:', imagePath);

      // Verify source exists
      const sourceInfo = await FileSystem.getInfoAsync(imagePath);
      if (!sourceInfo.exists) {
        console.warn(
          '[ItemService.generateThumbnail] Source image not found, returning original path',
        );
        return imagePath;
      }

      const thumbnailSize = 300;
      console.log('[ItemService.generateThumbnail] Resizing to width:', thumbnailSize);

      const manipResult = await ImageManipulator.manipulateAsync(
        imagePath,
        [{ resize: { width: thumbnailSize } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );

      console.log('[ItemService.generateThumbnail] Manipulation result URI:', manipResult.uri);

      const thumbnailPath = imagePath.replace('.jpg', '_thumb.jpg');
      console.log('[ItemService.generateThumbnail] Copying to:', thumbnailPath);

      await FileSystem.copyAsync({
        from: manipResult.uri,
        to: thumbnailPath,
      });

      // Verify thumbnail was created
      const thumbInfo = await FileSystem.getInfoAsync(thumbnailPath);
      if (!thumbInfo.exists) {
        console.warn(
          '[ItemService.generateThumbnail] Thumbnail verification failed, using original',
        );
        return imagePath;
      }

      console.log(
        '[ItemService.generateThumbnail] Thumbnail created successfully, size:',
        thumbInfo.size,
      );
      return thumbnailPath;
    } catch (error) {
      console.error('[ItemService.generateThumbnail] Error:', error);
      if (error instanceof Error) {
        console.error('[ItemService.generateThumbnail] Error details:', {
          name: error.name,
          message: error.message,
        });
      }
      // Return original path if thumbnail generation fails
      console.log('[ItemService.generateThumbnail] Falling back to original path');
      return imagePath;
    }
  }

  /**
   * Delete local image file
   */
  private async deleteLocalImage(imagePath: string): Promise<void> {
    try {
      // Validate path
      if (!imagePath || typeof imagePath !== 'string') {
        console.log('[ItemService.deleteLocalImage] Skipping - invalid path:', imagePath);
        return;
      }

      // Skip if path is not a local file system path
      if (!imagePath.includes(FileSystem.documentDirectory || '')) {
        console.log('[ItemService.deleteLocalImage] Skipping - not a local file path:', imagePath);
        return;
      }

      console.log('[ItemService.deleteLocalImage] Attempting to delete:', imagePath);

      // Check if file exists before trying to delete
      const fileInfo = await FileSystem.getInfoAsync(imagePath);

      if (fileInfo.exists) {
        try {
          await FileSystem.deleteAsync(imagePath, { idempotent: true });
          console.log('[ItemService.deleteLocalImage] ✅ File deleted successfully');
        } catch (deleteError) {
          // Sometimes file is locked or permission issue
          console.log(
            '[ItemService.deleteLocalImage] ⚠️ Could not delete file (might be in use):',
            deleteError instanceof Error ? deleteError.message : 'Unknown error',
          );
        }
      } else {
        console.log('[ItemService.deleteLocalImage] ℹ️ File already deleted or does not exist');
      }
    } catch (error) {
      // This catch is for getInfoAsync errors (path issues, permission issues, etc.)
      // These are non-critical - file might be already deleted, moved, or path format changed
      console.log(
        '[ItemService.deleteLocalImage] ℹ️ Could not access file (likely already deleted):',
        error instanceof Error ? error.message : 'Unknown error',
      );
      // Don't throw or log as error - this is expected behavior
    }
  }

  /**
   * Map Supabase item to WardrobeItem model
   */
  private mapSupabaseItemToWardrobeItem(data: ItemDbRecord): WardrobeItem {
    const metadata = data.metadata || ({} as ItemMetadata);

    return {
      id: data.id,
      userId: data.user_id,
      title: data.name,
      category: data.category,
      subcategory: data.subcategory,
      colors: data.colors || (data.color ? [{ hex: data.color }] : []),
      primaryColor: data.primary_color || (data.color ? { hex: data.color } : { hex: '#CCCCCC' }),
      material: data.material,
      styles: data.style || [],
      seasons: data.season || [],
      imageLocalPath: data.image_url,
      imageUrl: data.image_url,
      isBuiltin: data.is_default || false,
      brand: data.brand,
      size: data.size,
      price: data.price,
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      wearCount: 0,
      isFavorite: data.favorite || false,
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
        price: metadata.price,
      },
    };
  }
}

export const itemService = new ItemService();
