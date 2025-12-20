/**
 * Sync Queue - Manages pending operations for offline-first sync
 *
 * Operations are persisted in AsyncStorage and processed when online.
 * Supports retry logic with exponential backoff.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '@utils/logger';
import {
  DEFAULT_SYNC_CONFIG,
  EntityType,
  OperationType,
  PendingOperation,
  SyncConfig,
} from './types';

const logger = createLogger('SyncQueue');

const QUEUE_STORAGE_KEY = '@obrazz_sync_queue';

/**
 * Input for adding an operation to the queue
 */
export interface AddOperationInput<T = unknown> {
  type: OperationType;
  entity: EntityType;
  entityId: string;
  payload: T;
  userId?: string;
  priority?: number;
}

/**
 * SyncQueue class - manages the queue of pending sync operations
 */
class SyncQueueManager {
  private queue: PendingOperation[] = [];
  private config: SyncConfig = DEFAULT_SYNC_CONFIG;
  private isLoaded: boolean = false;
  private isProcessing: boolean = false;

  /**
   * Initialize the queue by loading from storage
   */
  async init(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and filter corrupted entries
        this.queue = Array.isArray(parsed)
          ? parsed.filter(
              (op: unknown) =>
                op && typeof op === 'object' && 'id' in op && 'type' in op && 'entity' in op,
            )
          : [];
        logger.info(`Loaded ${this.queue.length} pending operations from storage`);
      }
      this.isLoaded = true;
    } catch (error) {
      logger.error('Failed to load sync queue', error);
      this.queue = [];
      this.isLoaded = true;
    }
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add an operation to the queue
   */
  async add<T>(input: AddOperationInput<T>): Promise<PendingOperation<T>> {
    await this.init();

    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      // Remove oldest completed/failed operations first
      const oldOps = this.queue.filter(
        (op) =>
          op.status === 'completed' || (op.status === 'failed' && op.retryCount >= op.maxRetries),
      );
      if (oldOps.length > 0) {
        this.queue = this.queue.filter((op) => !oldOps.includes(op));
      } else {
        logger.warn('Queue is full, removing oldest pending operation');
        this.queue.shift();
      }
    }

    const operation: PendingOperation<T> = {
      id: this.generateId(),
      type: input.type,
      entity: input.entity,
      entityId: input.entityId,
      payload: input.payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      status: 'pending',
      metadata: {
        userId: input.userId,
        priority: input.priority ?? 0,
      },
    };

    this.queue.push(operation);
    await this.persist();

    logger.info(`Added operation to queue`, {
      id: operation.id,
      type: operation.type,
      entity: operation.entity,
      entityId: operation.entityId,
    });

    return operation;
  }

  /**
   * Get all pending operations
   */
  async getPending(): Promise<PendingOperation[]> {
    await this.init();
    return this.queue
      .filter((op) => op.status === 'pending')
      .sort((a, b) => {
        // Sort by priority (higher first), then by creation time
        const priorityDiff = (b.metadata?.priority ?? 0) - (a.metadata?.priority ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  /**
   * Get all operations (for debugging/UI)
   */
  async getAll(): Promise<PendingOperation[]> {
    await this.init();
    return [...this.queue];
  }

  /**
   * Get operation by ID
   */
  async getById(id: string): Promise<PendingOperation | undefined> {
    await this.init();
    return this.queue.find((op) => op.id === id);
  }

  /**
   * Get operations by entity ID
   */
  async getByEntityId(entityId: string): Promise<PendingOperation[]> {
    await this.init();
    return this.queue.filter((op) => op.entityId === entityId);
  }

  /**
   * Update operation status
   */
  async updateStatus(
    id: string,
    status: PendingOperation['status'],
    error?: string,
  ): Promise<void> {
    await this.init();

    const index = this.queue.findIndex((op) => op.id === id);
    if (index === -1) {
      logger.warn(`Operation not found: ${id}`);
      return;
    }

    this.queue[index] = {
      ...this.queue[index],
      status,
      error,
      retryCount:
        status === 'failed' ? this.queue[index].retryCount + 1 : this.queue[index].retryCount,
    };

    await this.persist();
  }

  /**
   * Remove operation from queue
   */
  async remove(id: string): Promise<void> {
    await this.init();
    this.queue = this.queue.filter((op) => op.id !== id);
    await this.persist();
    logger.info(`Removed operation: ${id}`);
  }

  /**
   * Remove all operations for a specific entity
   */
  async removeByEntityId(entityId: string): Promise<number> {
    await this.init();
    const before = this.queue.length;
    this.queue = this.queue.filter((op) => op.entityId !== entityId);
    const removed = before - this.queue.length;
    if (removed > 0) {
      await this.persist();
      logger.info(`Removed ${removed} operations for entity: ${entityId}`);
    }
    return removed;
  }

  /**
   * Remove all completed operations
   */
  async removeCompleted(): Promise<number> {
    await this.init();
    const before = this.queue.length;
    this.queue = this.queue.filter((op) => op.status !== 'completed');
    const removed = before - this.queue.length;
    if (removed > 0) {
      await this.persist();
      logger.info(`Removed ${removed} completed operations`);
    }
    return removed;
  }

  /**
   * Clear all operations
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.persist();
    logger.info('Queue cleared');
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  }> {
    await this.init();
    return {
      total: this.queue.length,
      pending: this.queue.filter((op) => op.status === 'pending').length,
      processing: this.queue.filter((op) => op.status === 'processing').length,
      failed: this.queue.filter((op) => op.status === 'failed').length,
      completed: this.queue.filter((op) => op.status === 'completed').length,
    };
  }

  /**
   * Check if queue has pending operations
   */
  async hasPending(): Promise<boolean> {
    await this.init();
    return this.queue.some((op) => op.status === 'pending');
  }

  /**
   * Check if currently processing
   */
  getIsProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Set processing state
   */
  setProcessing(value: boolean): void {
    this.isProcessing = value;
  }

  /**
   * Generate unique operation ID
   */
  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Persist queue to storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to persist sync queue', error);
    }
  }
}

/**
 * Singleton instance
 */
export const syncQueue = new SyncQueueManager();
