/**
 * Item Service Offline - Offline-first wardrobe item management
 *
 * Strategy:
 * 1. Always return data from local store first (instant)
 * 2. Sync with server in background when online
 * 3. Queue mutations for later sync when offline
 */

import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { createLogger } from '@utils/logger';
import { WardrobeItem } from '../../types/models/item';
import { isOnline } from '../sync/networkMonitor';
import { syncQueue } from '../sync/syncQueue';
import { syncService } from '../sync/syncService';
import { PendingOperation } from '../sync/types';
import { CreateItemInput, itemService, UpdateItemInput } from './itemService';

const logger = createLogger('ItemServiceOffline');

/**
 * Temporary ID prefix for locally created items
 */
const TEMP_ID_PREFIX = 'temp_';

/**
 * Check if an ID is temporary (created offline)
 */
export const isTempId = (id: string): boolean => id.startsWith(TEMP_ID_PREFIX);

/**
 * Generate a temporary ID for offline items
 */
const generateTempId = (): string => {
  return `${TEMP_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Item Service Offline class
 */
class ItemServiceOfflineManager {
  private isSyncing: boolean = false;

  /**
   * Initialize the offline service
   * Registers handlers for sync queue
   */
  async init(): Promise<void> {
    logger.info('Initializing offline item service');

    // Register handler for item operations
    syncService.registerHandler('item', this.handleSyncOperation.bind(this));
  }

  /**
   * Get user items - offline-first approach
   *
   * 1. Return cached items immediately
   * 2. Trigger background sync if online
   */
  async getUserItems(userId: string): Promise<WardrobeItem[]> {
    logger.info(`Getting items for user: ${userId}`);

    const store = useWardrobeStore.getState();

    // Return cached items immediately
    const cachedItems = store.items;
    logger.info(`Returning ${cachedItems.length} cached items`);

    // Trigger background sync if online
    if (isOnline() && !this.isSyncing) {
      this.syncItemsInBackground(userId).catch((error) => {
        logger.error('Background sync failed', error);
      });
    }

    return cachedItems;
  }

  /**
   * Create a new item - works offline
   *
   * 1. Create item locally with temp ID immediately (optimistic UI)
   * 2. Add to store immediately
   * 3. Sync in background - non-blocking
   */
  async createItem(input: CreateItemInput): Promise<WardrobeItem> {
    logger.info('Creating item', { category: input.category, userId: input.userId });

    const store = useWardrobeStore.getState();

    // Create locally with temp ID immediately (optimistic UI)
    const tempId = generateTempId();
    const localItem = this.inputToLocalItem(input, tempId);

    // Add to store immediately - this makes UI responsive
    store.addItem(localItem);
    logger.info('Item created locally', { tempId });

    if (isOnline()) {
      // Sync in background - don't block UI
      this.syncCreateItemInBackground(tempId, input, store).catch((error) => {
        logger.error('Background sync failed for new item', error);
      });
    } else {
      // Queue for later sync when back online
      await syncQueue.add({
        type: 'CREATE',
        entity: 'item',
        entityId: tempId,
        payload: input,
        userId: input.userId,
      });
    }

    // Return local item immediately
    return localItem;
  }

  /**
   * Background sync for new item - non-blocking
   */
  private async syncCreateItemInBackground(
    tempId: string,
    input: CreateItemInput,
    store: ReturnType<typeof useWardrobeStore.getState>,
  ): Promise<void> {
    try {
      const serverItem = await itemService.createItem(input);
      // Replace temp item with server item
      store.removeItemLocally(tempId);
      store.addItem(serverItem);
      logger.info('Item synced to server', { tempId, serverId: serverItem.id });
    } catch (error) {
      logger.warn('Failed to sync item to server, queuing for later', error);
      // Queue for retry
      await syncQueue.add({
        type: 'CREATE',
        entity: 'item',
        entityId: tempId,
        payload: input,
        userId: input.userId,
      });
    }
  }

  /**
   * Get item by ID - offline-first approach
   *
   * 1. Check local store cache first (instant)
   * 2. If not found and online, try to fetch from server
   */
  async getItemById(itemId: string): Promise<WardrobeItem | null> {
    logger.debug('Getting item by ID', { itemId });

    const store = useWardrobeStore.getState();

    // Check cache first (instant)
    const cachedItem = store.items.find((item) => item.id === itemId);
    if (cachedItem) {
      logger.debug('Item found in cache');
      return cachedItem;
    }

    // Not in cache - try server if online
    if (!isOnline()) {
      logger.warn('Item not in cache and offline');
      return null;
    }

    try {
      const serverItem = await itemService.getItemById(itemId);
      if (serverItem) {
        // Add to cache for future access
        store.addItem(serverItem);
        logger.debug('Item fetched from server and cached');
      }
      return serverItem;
    } catch (error) {
      logger.error('Failed to fetch item from server', error);
      return null;
    }
  }

  /**
   * Update an item - works offline with optimistic UI
   */
  async updateItem(itemId: string, updates: UpdateItemInput): Promise<WardrobeItem> {
    logger.info('Updating item', { itemId });

    const store = useWardrobeStore.getState();
    const existingItem = store.items.find((item) => item.id === itemId);

    if (!existingItem) {
      throw new Error(`Item not found: ${itemId}`);
    }

    // Update locally first - optimistic UI
    const updatedItem: WardrobeItem = {
      ...existingItem,
      ...updates,
      updatedAt: new Date(),
    };
    store.updateItem(itemId, updatedItem);
    logger.info('Item updated locally', { itemId });

    if (isOnline() && !isTempId(itemId)) {
      // Sync in background - don't block UI
      this.syncUpdateItemInBackground(itemId, updates, store).catch((error) => {
        logger.error('Background update sync failed', error);
      });
    } else if (!isTempId(itemId)) {
      // Queue for sync (if temp ID, it will be handled by CREATE operation)
      await syncQueue.add({
        type: 'UPDATE',
        entity: 'item',
        entityId: itemId,
        payload: { itemId, updates },
        userId: existingItem.userId,
      });
    }

    return updatedItem;
  }

  /**
   * Background sync for item update - non-blocking
   */
  private async syncUpdateItemInBackground(
    itemId: string,
    updates: UpdateItemInput,
    store: ReturnType<typeof useWardrobeStore.getState>,
  ): Promise<void> {
    try {
      const serverItem = await itemService.updateItem(itemId, updates);
      store.updateItem(itemId, serverItem);
      logger.info('Item update synced to server', { itemId });
    } catch (error) {
      logger.warn('Failed to sync item update, queuing for later', error);
      const existingItem = store.items.find((item) => item.id === itemId);
      if (existingItem) {
        await syncQueue.add({
          type: 'UPDATE',
          entity: 'item',
          entityId: itemId,
          payload: { itemId, updates },
          userId: existingItem.userId,
        });
      }
    }
  }

  /**
   * Delete an item - works offline with optimistic UI
   */
  async deleteItem(itemId: string, userId: string): Promise<void> {
    logger.info('Deleting item', { itemId });

    const store = useWardrobeStore.getState();

    // Remove locally first (optimistic UI)
    store.removeItemLocally(itemId);
    logger.info('Item deleted locally', { itemId });

    // If temp ID, just remove from queue
    if (isTempId(itemId)) {
      const ops = await syncQueue.getByEntityId(itemId);
      for (const op of ops) {
        await syncQueue.remove(op.id);
      }
      logger.info('Removed temp item and pending operations');
      return;
    }

    if (isOnline()) {
      // Sync delete in background - don't block UI
      this.syncDeleteItemInBackground(itemId, userId).catch((error) => {
        logger.error('Background delete sync failed', error);
      });
    } else {
      // Queue for sync
      await syncQueue.add({
        type: 'DELETE',
        entity: 'item',
        entityId: itemId,
        payload: { itemId },
        userId,
      });
    }
  }

  /**
   * Background sync for item deletion - non-blocking
   */
  private async syncDeleteItemInBackground(itemId: string, userId: string): Promise<void> {
    try {
      await itemService.deleteItem(itemId);
      logger.info('Item delete synced to server', { itemId });
    } catch (error) {
      logger.warn('Failed to sync item delete, queuing for later', error);
      await syncQueue.add({
        type: 'DELETE',
        entity: 'item',
        entityId: itemId,
        payload: { itemId },
        userId,
      });
    }
  }

  /**
   * Toggle favorite status - works offline with optimistic UI
   */
  async toggleFavorite(itemId: string, isFavorite: boolean, userId: string): Promise<void> {
    logger.info('Toggling favorite', { itemId, isFavorite });

    const store = useWardrobeStore.getState();

    // Update locally first - optimistic UI
    store.updateItem(itemId, { isFavorite });
    logger.info('Favorite toggled locally', { itemId, isFavorite });

    if (isOnline() && !isTempId(itemId)) {
      // Sync in background - don't block UI
      this.syncToggleFavoriteInBackground(itemId, isFavorite, userId).catch((error) => {
        logger.error('Background favorite toggle sync failed', error);
      });
    } else if (!isTempId(itemId)) {
      // Queue for sync
      await syncQueue.add({
        type: 'UPDATE',
        entity: 'item',
        entityId: itemId,
        payload: { itemId, isFavorite },
        userId,
      });
    }
  }

  /**
   * Background sync for favorite toggle - non-blocking
   */
  private async syncToggleFavoriteInBackground(
    itemId: string,
    isFavorite: boolean,
    userId: string,
  ): Promise<void> {
    try {
      await itemService.toggleFavorite(itemId, isFavorite);
      logger.info('Favorite toggle synced to server', { itemId, isFavorite });
    } catch (error) {
      logger.warn('Failed to sync favorite toggle, queuing for later', error);
      await syncQueue.add({
        type: 'UPDATE',
        entity: 'item',
        entityId: itemId,
        payload: { itemId, isFavorite },
        userId,
      });
    }
  }

  /**
   * Sync items with server in background
   */
  private async syncItemsInBackground(userId: string): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const store = useWardrobeStore.getState();

    try {
      logger.info('Starting background sync');
      store.setLoading(true);

      // Fetch from server
      const serverItems = await itemService.getUserItems(userId);

      // Merge with local items
      const localItems = store.items;
      const mergedItems = this.mergeItems(localItems, serverItems);

      // Update store
      store.setItems(mergedItems);
      store.setError(null);

      logger.info(`Background sync complete: ${mergedItems.length} items`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      logger.error('Background sync failed', error);
      store.setError(message);
    } finally {
      store.setLoading(false);
      this.isSyncing = false;
    }
  }

  /**
   * Merge local and server items
   *
   * Strategy:
   * - Keep local temp items (pending creation)
   * - Use server version for synced items
   * - Keep local changes for items with pending updates
   */
  private mergeItems(localItems: WardrobeItem[], serverItems: WardrobeItem[]): WardrobeItem[] {
    const merged = new Map<string, WardrobeItem>();

    // Add server items first
    for (const item of serverItems) {
      merged.set(item.id, item);
    }

    // Add or preserve local items
    for (const localItem of localItems) {
      // Always keep temp items
      if (isTempId(localItem.id)) {
        merged.set(localItem.id, localItem);
        continue;
      }

      // For existing items, check if there are pending updates
      // If so, keep local version to preserve pending changes
      // (This will be synced on next queue process)
      const serverItem = merged.get(localItem.id);
      if (serverItem) {
        // Use server version by default (already in map)
        // Could add more sophisticated merge logic here if needed
      } else {
        // Item exists locally but not on server - might be deleted
        // Don't add it unless it has pending operations
        // For now, trust server as source of truth
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Handle sync operation from queue
   */
  private async handleSyncOperation(operation: PendingOperation): Promise<void> {
    logger.info('Handling sync operation', {
      id: operation.id,
      type: operation.type,
      entityId: operation.entityId,
    });

    const store = useWardrobeStore.getState();

    switch (operation.type) {
      case 'CREATE': {
        const input = operation.payload as CreateItemInput;
        const serverItem = await itemService.createItem(input);

        // Replace temp item with server item
        store.removeItemLocally(operation.entityId);
        store.addItem(serverItem);

        logger.info('Synced CREATE operation', {
          tempId: operation.entityId,
          serverId: serverItem.id,
        });
        break;
      }

      case 'UPDATE': {
        const { itemId, updates } = operation.payload as {
          itemId: string;
          updates: UpdateItemInput;
        };
        const serverItem = await itemService.updateItem(itemId, updates);
        store.updateItem(itemId, serverItem);

        logger.info('Synced UPDATE operation', { itemId });
        break;
      }

      case 'DELETE': {
        const { itemId } = operation.payload as { itemId: string };
        await itemService.deleteItem(itemId);

        logger.info('Synced DELETE operation', { itemId });
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Convert CreateItemInput to local WardrobeItem
   */
  private inputToLocalItem(input: CreateItemInput, tempId: string): WardrobeItem {
    return {
      id: tempId,
      userId: input.userId,
      title: input.title || 'Untitled',
      category: input.category,
      subcategory: input.subcategory,
      colors: input.colors,
      primaryColor: input.primaryColor,
      material: input.material,
      styles: input.styles,
      seasons: input.seasons,
      imageLocalPath: input.imageUri,
      imageUrl: input.imageUri,
      isBuiltin: input.isBuiltin || false,
      brand: input.brand,
      size: input.size,
      price: input.price,
      tags: input.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      wearCount: 0,
      isFavorite: false,
      metadata: {
        source: 'gallery',
        backgroundRemoved: false,
        ...input.metadata,
      },
    };
  }
}

/**
 * Singleton instance
 */
export const itemServiceOffline = new ItemServiceOfflineManager();
