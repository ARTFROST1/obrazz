/**
 * useSyncStatus - Hook for accessing sync status in components
 */

import { useNetworkStatus } from '@services/sync/networkMonitor';
import { syncService } from '@services/sync/syncService';
import { SyncStatus } from '@services/sync/types';
import { useEffect, useState } from 'react';

interface UseSyncStatusReturn {
  // Current sync state
  status: SyncStatus | null;

  // Network state
  isOnline: boolean;

  // Derived states
  isSyncing: boolean;
  hasPendingChanges: boolean;
  hasError: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: Date | null;

  // Actions
  syncNow: () => Promise<void>;
}

export const useSyncStatus = (): UseSyncStatusReturn => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  const syncNow = async () => {
    await syncService.syncNow();
  };

  return {
    status,
    isOnline,
    isSyncing: status?.state === 'syncing',
    hasPendingChanges: (status?.pendingCount ?? 0) > 0,
    hasError: status?.state === 'error',
    pendingCount: status?.pendingCount ?? 0,
    failedCount: status?.failedCount ?? 0,
    lastSyncedAt: status?.lastSyncedAt ? new Date(status.lastSyncedAt) : null,
    syncNow,
  };
};
