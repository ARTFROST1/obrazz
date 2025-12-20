/**
 * Sync Module Exports
 *
 * Provides offline-first synchronization capabilities for the app.
 */

// Types
export * from './types';

// Network monitoring
export {
  initNetworkMonitor,
  isOnline,
  useNetworkStatus,
  useNetworkStore,
  waitForNetwork,
} from './networkMonitor';

// Sync queue
export { syncQueue } from './syncQueue';
export type { AddOperationInput } from './syncQueue';

// Sync service
export { syncService } from './syncService';
