/**
 * Outfit Service Offline - Offline-first wrapper for outfitService
 *
 * Provides instant access to cached outfits while syncing with Supabase in background.
 * All operations work offline and sync when connection is restored.
 */

import { useOutfitStore } from '@store/outfit/outfitStore';
import { createLogger } from '@utils/logger';
import {
  Outfit,
  OutfitCreationParams,
  OutfitFilter,
  OutfitSortOptions,
} from '../../types/models/outfit';
import { useNetworkStore } from '../sync/networkMonitor';
import { syncQueue } from '../sync/syncQueue';
import { syncService } from '../sync/syncService';
import { PendingOperation } from '../sync/types';
import { outfitService } from './outfitService';

const logger = createLogger('OutfitServiceOffline');

class OutfitServiceOffline {
  private isSyncing = false;

  constructor() {
    // Register sync handler for outfit operations
    syncService.registerHandler('outfit', this.handleSyncOperation.bind(this));
  }

  /**
   * Get user's outfits - returns cached immediately, syncs in background
   */
  async getUserOutfits(
    userId: string,
    filter?: OutfitFilter,
    sort?: OutfitSortOptions,
  ): Promise<Outfit[]> {
    const store = useOutfitStore.getState();
    const network = useNetworkStore.getState();

    // Return cached outfits immediately
    const cachedOutfits = store.outfits;
    logger.info('Returning cached outfits', { count: cachedOutfits.length });

    // Sync in background if online
    if (network.isOnline && !this.isSyncing) {
      this.syncOutfitsInBackground(userId, filter, sort).catch((error) => {
        logger.error('Background sync failed', { error });
      });
    }

    // Apply local filtering/sorting to cached data
    return this.filterAndSortOutfits(cachedOutfits, filter, sort);
  }

  /**
   * Get single outfit by ID - checks cache first
   */
  async getOutfitById(outfitId: string): Promise<Outfit | null> {
    const store = useOutfitStore.getState();
    const network = useNetworkStore.getState();

    // Check cache first
    const cachedOutfit = store.outfits.find((o) => o.id === outfitId);

    if (cachedOutfit) {
      logger.debug('Returning cached outfit', { outfitId });

      // Refresh in background if online
      if (network.isOnline) {
        this.refreshOutfitInBackground(outfitId).catch((error) => {
          logger.debug('Background refresh failed', { outfitId, error });
        });
      }

      return cachedOutfit;
    }

    // Not in cache - must fetch from server
    if (!network.isOnline) {
      logger.warn('Outfit not in cache and offline', { outfitId });
      return null;
    }

    try {
      const outfit = await outfitService.getOutfitById(outfitId);
      // Add to cache
      store.addOutfit(outfit);
      return outfit;
    } catch (error) {
      logger.error('Failed to fetch outfit', { outfitId, error });
      return null;
    }
  }

  /**
   * Create new outfit - works offline with optimistic UI
   */
  async createOutfit(userId: string, params: OutfitCreationParams): Promise<Outfit> {
    const network = useNetworkStore.getState();
    const store = useOutfitStore.getState();

    // Create temp ID for offline operation
    const tempId = `temp_outfit_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Create local outfit immediately (optimistic UI)
    const localOutfit: Outfit = {
      id: tempId,
      userId,
      title: params.title,
      description: params.description,
      items: params.items || [],
      background: params.background || { type: 'color', value: '#FFFFFF', opacity: 1 },
      canvasSettings: params.canvasSettings,
      visibility: params.visibility || 'private',
      isAiGenerated: false,
      tags: [],
      styles: params.styles || [],
      seasons: params.seasons || [],
      occasions: params.occasions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      wearCount: 0,
      isFavorite: false,
      likesCount: 0,
      viewsCount: 0,
      sharesCount: 0,
    };

    // Add to local store immediately - makes UI responsive
    store.addOutfit(localOutfit);
    logger.info('Created local outfit', { tempId });

    if (network.isOnline) {
      // Sync in background - don't block UI
      this.syncCreateOutfitInBackground(tempId, userId, params, store).catch((error) => {
        logger.error('Background sync failed for new outfit', error);
      });
    } else {
      // Queue for later sync
      await this.queueCreateOperation(tempId, userId, params);
    }

    // Return local outfit immediately
    return localOutfit;
  }

  /**
   * Background sync for new outfit - non-blocking
   */
  private async syncCreateOutfitInBackground(
    tempId: string,
    userId: string,
    params: OutfitCreationParams,
    store: ReturnType<typeof useOutfitStore.getState>,
  ): Promise<void> {
    try {
      const serverOutfit = await outfitService.createOutfit(userId, params);
      // Replace temp outfit with real one
      store.deleteOutfit(tempId);
      store.addOutfit(serverOutfit);
      logger.info('Synced outfit to server', { tempId, serverId: serverOutfit.id });
    } catch (error) {
      logger.warn('Failed to sync outfit, queuing for later', { error });
      await this.queueCreateOperation(tempId, userId, params);
    }
  }

  /**
   * Update outfit - works offline with optimistic UI
   */
  async updateOutfit(outfitId: string, updates: Partial<Outfit>): Promise<Outfit> {
    const network = useNetworkStore.getState();
    const store = useOutfitStore.getState();

    // Update locally immediately - optimistic UI
    store.updateOutfit(outfitId, updates);
    const updatedOutfit = store.outfits.find((o) => o.id === outfitId);
    logger.info('Updated outfit locally', { outfitId });

    if (network.isOnline) {
      // Sync in background - don't block UI
      this.syncUpdateOutfitInBackground(outfitId, updates, store).catch((error) => {
        logger.error('Background update sync failed', error);
      });
    } else {
      await this.queueUpdateOperation(outfitId, updates);
    }

    return updatedOutfit || ({ ...updates, id: outfitId } as Outfit);
  }

  /**
   * Background sync for outfit update - non-blocking
   */
  private async syncUpdateOutfitInBackground(
    outfitId: string,
    updates: Partial<Outfit>,
    store: ReturnType<typeof useOutfitStore.getState>,
  ): Promise<void> {
    try {
      const serverOutfit = await outfitService.updateOutfit(outfitId, updates);
      store.updateOutfit(outfitId, serverOutfit);
      logger.info('Outfit update synced to server', { outfitId });
    } catch (error) {
      logger.warn('Failed to sync update, queuing for later', { error });
      await this.queueUpdateOperation(outfitId, updates);
    }
  }

  /**
   * Delete outfit - works offline with optimistic UI
   */
  async deleteOutfit(outfitId: string): Promise<void> {
    const network = useNetworkStore.getState();
    const store = useOutfitStore.getState();

    // Delete locally immediately - optimistic UI
    store.deleteOutfit(outfitId);
    logger.info('Deleted outfit locally', { outfitId });

    if (network.isOnline) {
      // Sync delete in background - don't block UI
      this.syncDeleteOutfitInBackground(outfitId).catch((error) => {
        logger.error('Background delete sync failed', error);
      });
    } else {
      await this.queueDeleteOperation(outfitId);
    }
  }

  /**
   * Background sync for outfit deletion - non-blocking
   */
  private async syncDeleteOutfitInBackground(outfitId: string): Promise<void> {
    try {
      await outfitService.deleteOutfit(outfitId);
      logger.info('Outfit delete synced to server', { outfitId });
    } catch (error) {
      logger.warn('Failed to delete on server, queuing for later', { error });
      await this.queueDeleteOperation(outfitId);
    }
  }

  /**
   * Toggle favorite - works offline with optimistic UI
   */
  async toggleFavorite(outfitId: string, isFavorite: boolean): Promise<void> {
    const network = useNetworkStore.getState();
    const store = useOutfitStore.getState();

    // Update locally immediately - optimistic UI
    store.updateOutfit(outfitId, { isFavorite });
    logger.debug('Toggled favorite locally', { outfitId, isFavorite });

    if (network.isOnline) {
      // Sync in background - don't block UI
      this.syncToggleFavoriteInBackground(outfitId, isFavorite).catch((error) => {
        logger.error('Background favorite toggle sync failed', error);
      });
    } else {
      await this.queueUpdateOperation(outfitId, { isFavorite });
    }
  }

  /**
   * Background sync for favorite toggle - non-blocking
   */
  private async syncToggleFavoriteInBackground(
    outfitId: string,
    isFavorite: boolean,
  ): Promise<void> {
    try {
      await outfitService.toggleFavorite(outfitId, isFavorite);
      logger.info('Favorite toggle synced to server', { outfitId, isFavorite });
    } catch (error) {
      logger.warn('Failed to sync favorite toggle', { error });
      await this.queueUpdateOperation(outfitId, { isFavorite });
    }
  }

  /**
   * Duplicate outfit - works offline
   */
  async duplicateOutfit(outfitId: string, userId: string): Promise<Outfit> {
    const store = useOutfitStore.getState();
    const original = store.outfits.find((o) => o.id === outfitId);

    if (!original) {
      throw new Error('Outfit not found');
    }

    const duplicateParams: OutfitCreationParams = {
      title: `${original.title || 'Outfit'} (Copy)`,
      description: original.description,
      items: original.items,
      background: original.background,
      canvasSettings: original.canvasSettings,
      styles: original.styles,
      seasons: original.seasons,
      occasions: original.occasions,
      visibility: 'private',
    };

    return this.createOutfit(userId, duplicateParams);
  }

  // ============ Private Methods ============

  /**
   * Sync outfits from server in background
   */
  private async syncOutfitsInBackground(
    userId: string,
    filter?: OutfitFilter,
    sort?: OutfitSortOptions,
  ): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    logger.debug('Starting background sync');

    try {
      const serverOutfits = await outfitService.getUserOutfits(userId, filter, sort);
      const store = useOutfitStore.getState();

      // Merge server data with local (server wins for non-temp items)
      const localTempOutfits = store.outfits.filter((o) => o.id.startsWith('temp_'));
      const mergedOutfits = [...serverOutfits, ...localTempOutfits];

      store.setOutfits(mergedOutfits);
      logger.info('Background sync complete', { count: serverOutfits.length });
    } catch (error) {
      logger.error('Background sync failed', { error });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Refresh single outfit from server
   */
  private async refreshOutfitInBackground(outfitId: string): Promise<void> {
    try {
      const serverOutfit = await outfitService.getOutfitById(outfitId);
      const store = useOutfitStore.getState();
      store.updateOutfit(outfitId, serverOutfit);
    } catch (error) {
      logger.debug('Failed to refresh outfit in background', { outfitId, error });
    }
  }

  /**
   * Filter and sort outfits locally
   */
  private filterAndSortOutfits(
    outfits: Outfit[],
    filter?: OutfitFilter,
    sort?: OutfitSortOptions,
  ): Outfit[] {
    let result = [...outfits];

    // Apply filters
    if (filter) {
      if (filter.visibility && filter.visibility.length > 0) {
        result = result.filter((o) => filter.visibility!.includes(o.visibility));
      }
      if (filter.isAiGenerated !== undefined) {
        result = result.filter((o) => o.isAiGenerated === filter.isAiGenerated);
      }
      if (filter.isFavorite !== undefined) {
        result = result.filter((o) => o.isFavorite === filter.isFavorite);
      }
      if (filter.styles && filter.styles.length > 0) {
        result = result.filter((o) => o.styles?.some((s) => filter.styles!.includes(s)));
      }
      if (filter.seasons && filter.seasons.length > 0) {
        result = result.filter((o) => o.seasons?.some((s) => filter.seasons!.includes(s)));
      }
      if (filter.occasions && filter.occasions.length > 0) {
        result = result.filter((o) => o.occasions?.some((oc) => filter.occasions!.includes(oc)));
      }
    }

    // Apply sorting
    const sortField = sort?.field || 'createdAt';
    const sortDirection = sort?.direction || 'desc';

    // Helper to safely get timestamp from Date or string
    const getTimestamp = (date: Date | string | null | undefined): number => {
      if (!date) return 0;
      if (date instanceof Date) return date.getTime();
      return new Date(date).getTime();
    };

    result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'createdAt':
          aVal = getTimestamp(a.createdAt);
          bVal = getTimestamp(b.createdAt);
          break;
        case 'updatedAt':
          aVal = getTimestamp(a.updatedAt);
          bVal = getTimestamp(b.updatedAt);
          break;
        case 'wearCount':
          aVal = a.wearCount || 0;
          bVal = b.wearCount || 0;
          break;
        case 'title':
          aVal = a.title || '';
          bVal = b.title || '';
          break;
        case 'lastWornAt':
          aVal = getTimestamp(a.lastWornAt);
          bVal = getTimestamp(b.lastWornAt);
          break;
        case 'likesCount':
          aVal = a.likesCount || 0;
          bVal = b.likesCount || 0;
          break;
        default:
          aVal = getTimestamp(a.createdAt);
          bVal = getTimestamp(b.createdAt);
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });

    return result;
  }

  // ============ Queue Operations ============

  private async queueCreateOperation(
    tempId: string,
    userId: string,
    params: OutfitCreationParams,
  ): Promise<void> {
    await syncQueue.add({
      type: 'CREATE',
      entity: 'outfit',
      entityId: tempId,
      payload: { userId, params },
    });
  }

  private async queueUpdateOperation(outfitId: string, updates: Partial<Outfit>): Promise<void> {
    // Skip queuing temp outfits - they'll be created first
    if (outfitId.startsWith('temp_')) return;

    await syncQueue.add({
      type: 'UPDATE',
      entity: 'outfit',
      entityId: outfitId,
      payload: { updates },
    });
  }

  private async queueDeleteOperation(outfitId: string): Promise<void> {
    // Skip queuing temp outfits - just remove from queue
    if (outfitId.startsWith('temp_')) {
      await syncQueue.removeByEntityId(outfitId);
      return;
    }

    await syncQueue.add({
      type: 'DELETE',
      entity: 'outfit',
      entityId: outfitId,
      payload: {},
    });
  }

  /**
   * Handle sync operation from queue
   */
  private async handleSyncOperation(operation: PendingOperation): Promise<void> {
    const store = useOutfitStore.getState();

    switch (operation.type) {
      case 'CREATE': {
        const { userId, params } = operation.payload as {
          userId: string;
          params: OutfitCreationParams;
        };
        const serverOutfit = await outfitService.createOutfit(userId, params);
        // Replace temp outfit with server outfit
        store.deleteOutfit(operation.entityId);
        store.addOutfit(serverOutfit);
        logger.info('Synced CREATE operation', {
          tempId: operation.entityId,
          newId: serverOutfit.id,
        });
        break;
      }

      case 'UPDATE': {
        const { updates } = operation.payload as { updates: Partial<Outfit> };
        await outfitService.updateOutfit(operation.entityId, updates);
        logger.info('Synced UPDATE operation', { outfitId: operation.entityId });
        break;
      }

      case 'DELETE': {
        await outfitService.deleteOutfit(operation.entityId);
        logger.info('Synced DELETE operation', { outfitId: operation.entityId });
        break;
      }
    }
  }
}

export const outfitServiceOffline = new OutfitServiceOffline();
