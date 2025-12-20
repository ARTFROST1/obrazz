/**
 * Network Monitor - Tracks network connectivity status
 *
 * Provides reactive network state management using Zustand.
 * Triggers sync operations when network is restored.
 */

import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { createLogger } from '@utils/logger';
import { create } from 'zustand';
import { NetworkStatus } from './types';

const logger = createLogger('NetworkMonitor');

/**
 * Network store state
 */
interface NetworkStore {
  // State
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetworkStatus['type'];
  details: NetInfoState | null;

  // Derived
  isOnline: boolean; // True only when connected AND internet reachable

  // Actions
  setNetworkState: (state: NetInfoState) => void;
  reset: () => void;
}

/**
 * Map NetInfo type to our type
 */
const mapNetworkType = (type: NetInfoStateType): NetworkStatus['type'] => {
  switch (type) {
    case 'wifi':
      return 'wifi';
    case 'cellular':
      return 'cellular';
    case 'none':
      return 'none';
    case 'bluetooth':
      return 'bluetooth';
    case 'ethernet':
      return 'ethernet';
    case 'wimax':
      return 'wimax';
    case 'vpn':
      return 'vpn';
    case 'other':
      return 'other';
    default:
      return 'unknown';
  }
};

/**
 * Network state store
 */
export const useNetworkStore = create<NetworkStore>((set, get) => ({
  // Initial state - assume online until we know otherwise
  isConnected: true,
  isInternetReachable: null,
  type: 'unknown',
  details: null,
  isOnline: true,

  setNetworkState: (state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable;
    const type = mapNetworkType(state.type);

    // Calculate isOnline - must be connected AND have internet
    // If isInternetReachable is null (unknown), assume connected = online
    const isOnline = isConnected && (isInternetReachable === null || isInternetReachable === true);

    const prevState = get();
    const wasOffline = !prevState.isOnline;
    const nowOnline = isOnline;

    // Log state changes
    if (wasOffline !== !nowOnline) {
      if (nowOnline) {
        logger.info('Network restored', { type, isInternetReachable });
      } else {
        logger.warn('Network lost', { type, isInternetReachable });
      }
    }

    set({
      isConnected,
      isInternetReachable,
      type,
      details: state,
      isOnline,
    });

    // Trigger sync when coming back online
    if (wasOffline && nowOnline) {
      logger.info('Back online - triggering sync');
      // Import dynamically to avoid circular dependency
      import('./syncService').then(({ syncService }) => {
        syncService.processQueue().catch((error) => {
          logger.error('Failed to process queue after network restore', { error });
        });
      });
    }
  },

  reset: () =>
    set({
      isConnected: true,
      isInternetReachable: null,
      type: 'unknown',
      details: null,
      isOnline: true,
    }),
}));

/**
 * Unsubscribe function type
 */
type UnsubscribeFunction = () => void;

/**
 * Global unsubscribe reference
 */
let unsubscribe: UnsubscribeFunction | null = null;

/**
 * Initialize network monitoring
 * Should be called once at app startup
 */
export const initNetworkMonitor = (): UnsubscribeFunction => {
  logger.info('Initializing network monitor');

  // Clean up existing subscription if any
  if (unsubscribe) {
    unsubscribe();
  }

  // Get initial state
  NetInfo.fetch()
    .then((state) => {
      logger.info('Initial network state', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
      useNetworkStore.getState().setNetworkState(state);
    })
    .catch((error) => {
      logger.error('Failed to fetch initial network state', { error });
    });

  // Subscribe to network changes
  unsubscribe = NetInfo.addEventListener((state) => {
    useNetworkStore.getState().setNetworkState(state);
  });

  return () => {
    logger.info('Cleaning up network monitor');
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
};

/**
 * Hook to get current network status
 */
export const useNetworkStatus = () => {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const type = useNetworkStore((state) => state.type);
  const isInternetReachable = useNetworkStore((state) => state.isInternetReachable);

  return {
    isOnline,
    isConnected,
    type,
    isInternetReachable,
  };
};

/**
 * Check if currently online (non-reactive, for services)
 */
export const isOnline = (): boolean => {
  return useNetworkStore.getState().isOnline;
};

/**
 * Wait for network to become available
 * Resolves when online, rejects after timeout
 */
export const waitForNetwork = (timeoutMs: number = 30000): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already online
    if (useNetworkStore.getState().isOnline) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Network timeout'));
    }, timeoutMs);

    const unsubscribe = useNetworkStore.subscribe((state) => {
      if (state.isOnline) {
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      }
    });
  });
};
