/**
 * Sync Types - Types for offline-first synchronization
 */

/**
 * Network connection status
 */
export interface NetworkStatus {
  isConnected: boolean;
  type:
    | 'wifi'
    | 'cellular'
    | 'none'
    | 'unknown'
    | 'bluetooth'
    | 'ethernet'
    | 'wimax'
    | 'vpn'
    | 'other';
  isInternetReachable: boolean | null;
}

/**
 * Type of sync operation
 */
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Entity type for sync operations
 */
export type EntityType = 'item' | 'outfit';

/**
 * Status of a pending operation
 */
export type OperationStatus = 'pending' | 'processing' | 'failed' | 'completed';

/**
 * A pending operation waiting to be synced
 */
export interface PendingOperation<T = unknown> {
  id: string;
  type: OperationType;
  entity: EntityType;
  entityId: string; // The ID of the entity being modified (can be temp ID for CREATE)
  payload: T;
  createdAt: string; // ISO string for serialization
  retryCount: number;
  maxRetries: number;
  status: OperationStatus;
  error?: string;
  metadata?: {
    localOnly?: boolean; // If true, don't sync to server
    priority?: number; // Higher = process first
    userId?: string;
  };
}

/**
 * Overall sync status for a store
 */
export type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Sync status information
 */
export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: string | null; // ISO string
  pendingCount: number;
  failedCount: number;
  error?: string;
  isOnline: boolean;
}

/**
 * Conflict between local and server data
 */
export interface SyncConflict<T = unknown> {
  id: string;
  entityType: EntityType;
  entityId: string;
  localVersion: T;
  serverVersion: T;
  localUpdatedAt: string;
  serverUpdatedAt: string;
  resolution?: 'local' | 'server' | 'merge';
  resolvedAt?: string;
}

/**
 * Resolution strategy for conflicts
 */
export type ConflictResolutionStrategy =
  | 'local-wins'
  | 'server-wins'
  | 'last-write-wins'
  | 'manual';

/**
 * Sync configuration
 */
export interface SyncConfig {
  maxRetries: number;
  retryDelayMs: number;
  maxQueueSize: number;
  conflictStrategy: ConflictResolutionStrategy;
  syncIntervalMs: number;
  enableAutoSync: boolean;
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  maxQueueSize: 100,
  conflictStrategy: 'last-write-wins',
  syncIntervalMs: 30000, // 30 seconds
  enableAutoSync: true,
};

/**
 * Sync event types
 */
export type SyncEventType =
  | 'sync:start'
  | 'sync:complete'
  | 'sync:error'
  | 'sync:conflict'
  | 'network:online'
  | 'network:offline'
  | 'queue:add'
  | 'queue:process'
  | 'queue:clear';

/**
 * Sync event
 */
export interface SyncEvent {
  type: SyncEventType;
  timestamp: string;
  data?: unknown;
}

/**
 * Item with sync metadata
 */
export interface SyncableItem {
  id: string;
  syncStatus?: 'synced' | 'pending' | 'error' | 'local-only';
  syncError?: string;
  localUpdatedAt?: string;
  serverUpdatedAt?: string;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: SyncConflict[];
  errors: Array<{ operationId: string; error: string }>;
}
