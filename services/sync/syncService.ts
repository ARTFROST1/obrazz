/**
 * Sync Service - Coordinates offline-first synchronization
 *
 * Handles:
 * - Processing the sync queue when online
 * - Resolving conflicts between local and server data
 * - Retry logic with exponential backoff
 * - Event emission for UI updates
 */

import { createLogger } from '@utils/logger';
import { isOnline, useNetworkStore } from './networkMonitor';
import { syncQueue } from './syncQueue';
import {
  DEFAULT_SYNC_CONFIG,
  EntityType,
  PendingOperation,
  SyncConfig,
  SyncConflict,
  SyncResult,
  SyncStatus,
} from './types';

const logger = createLogger('SyncService');

/**
 * Handler function type for processing operations
 */
type OperationHandler = (operation: PendingOperation) => Promise<void>;

/**
 * Sync Service class
 */
class SyncServiceManager {
  private config: SyncConfig = DEFAULT_SYNC_CONFIG;
  private handlers: Map<EntityType, OperationHandler> = new Map();
  private syncStatus: SyncStatus = {
    state: 'idle',
    lastSyncedAt: null,
    pendingCount: 0,
    failedCount: 0,
    isOnline: true,
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Initialize the sync service
   */
  async init(): Promise<void> {
    logger.info('Initializing sync service');

    // Load queue
    await syncQueue.init();

    // Update status
    await this.updateStatus();

    // Subscribe to network changes
    useNetworkStore.subscribe((state) => {
      const wasOnline = this.syncStatus.isOnline;
      this.syncStatus.isOnline = state.isOnline;

      if (!wasOnline && state.isOnline) {
        logger.info('Network restored, processing queue');
        this.processQueue();
      }

      this.notifyListeners();
    });

    // Start periodic sync if enabled
    if (this.config.enableAutoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.enableAutoSync !== undefined) {
      if (config.enableAutoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  /**
   * Register a handler for an entity type
   */
  registerHandler(entityType: EntityType, handler: OperationHandler): void {
    this.handlers.set(entityType, handler);
    logger.info(`Registered handler for ${entityType}`);
  }

  /**
   * Process all pending operations in the queue
   */
  async processQueue(): Promise<SyncResult> {
    if (!isOnline()) {
      logger.info('Offline, skipping queue processing');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        errors: [{ operationId: '', error: 'Offline' }],
      };
    }

    if (syncQueue.getIsProcessing()) {
      logger.info('Already processing, skipping');
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        errors: [],
      };
    }

    syncQueue.setProcessing(true);
    this.syncStatus.state = 'syncing';
    this.notifyListeners();

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflicts: [],
      errors: [],
    };

    try {
      const pending = await syncQueue.getPending();
      logger.info(`Processing ${pending.length} pending operations`);

      for (const operation of pending) {
        if (!isOnline()) {
          logger.info('Lost network during sync, stopping');
          break;
        }

        try {
          await this.processOperation(operation);
          await syncQueue.updateStatus(operation.id, 'completed');
          await syncQueue.remove(operation.id);
          result.syncedCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Failed to process operation ${operation.id}`, error);

          await syncQueue.updateStatus(operation.id, 'failed', errorMessage);

          // Check if should retry
          if (operation.retryCount < operation.maxRetries) {
            // Will retry on next sync
            logger.info(
              `Operation ${operation.id} will retry (${operation.retryCount + 1}/${operation.maxRetries})`,
            );
          } else {
            result.failedCount++;
            result.errors.push({ operationId: operation.id, error: errorMessage });
          }
        }

        // Small delay between operations
        await this.delay(100);
      }

      // Clean up completed operations
      await syncQueue.removeCompleted();

      // Update status
      this.syncStatus.state = result.failedCount > 0 ? 'error' : 'idle';
      this.syncStatus.lastSyncedAt = new Date().toISOString();
      await this.updateStatus();

      result.success = result.failedCount === 0;
      logger.info(`Sync complete: ${result.syncedCount} synced, ${result.failedCount} failed`);
    } catch (error) {
      logger.error('Queue processing error', error);
      this.syncStatus.state = 'error';
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
    } finally {
      syncQueue.setProcessing(false);
      this.notifyListeners();
    }

    return result;
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: PendingOperation): Promise<void> {
    const handler = this.handlers.get(operation.entity);
    if (!handler) {
      throw new Error(`No handler registered for entity type: ${operation.entity}`);
    }

    logger.info(`Processing operation`, {
      id: operation.id,
      type: operation.type,
      entity: operation.entity,
      entityId: operation.entityId,
    });

    // Retry with exponential backoff
    let lastError: Error | null = null;
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await handler(operation);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxAttempts - 1) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt);
          logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Operation failed');
  }

  /**
   * Resolve a conflict between local and server data
   */
  resolveConflict<T>(conflict: SyncConflict<T>): T {
    const strategy = this.config.conflictStrategy;

    switch (strategy) {
      case 'local-wins':
        return conflict.localVersion;

      case 'server-wins':
        return conflict.serverVersion;

      case 'last-write-wins':
        const localTime = new Date(conflict.localUpdatedAt).getTime();
        const serverTime = new Date(conflict.serverUpdatedAt).getTime();
        return localTime > serverTime ? conflict.localVersion : conflict.serverVersion;

      case 'manual':
        // For manual resolution, default to server
        logger.warn('Manual conflict resolution not implemented, using server version');
        return conflict.serverVersion;

      default:
        return conflict.serverVersion;
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Subscribe to status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.syncStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Force sync now
   */
  async syncNow(): Promise<SyncResult> {
    logger.info('Force sync requested');
    return this.processQueue();
  }

  /**
   * Update sync status from queue
   */
  private async updateStatus(): Promise<void> {
    const stats = await syncQueue.getStats();
    this.syncStatus.pendingCount = stats.pending;
    this.syncStatus.failedCount = stats.failed;
    this.syncStatus.isOnline = isOnline();
    this.notifyListeners();
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.syncStatus);
      } catch (error) {
        logger.error('Listener error', error);
      }
    }
  }

  /**
   * Start automatic periodic sync
   */
  private startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (isOnline()) {
        this.processQueue();
      }
    }, this.config.syncIntervalMs);

    logger.info(`Auto-sync started (interval: ${this.config.syncIntervalMs}ms)`);
  }

  /**
   * Stop automatic sync
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Auto-sync stopped');
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAutoSync();
    this.listeners.clear();
    logger.info('Sync service destroyed');
  }
}

/**
 * Singleton instance
 */
export const syncService = new SyncServiceManager();
