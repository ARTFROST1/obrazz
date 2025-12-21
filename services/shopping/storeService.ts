import { STORE_LOGOS } from '@/constants/storeLogos';
import type { BrowserHistoryItem, Store } from '@/types/models/store';
import { getStoreFavicon } from '@/utils/shopping/logoFetcher';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORES_KEY = '@shopping_browser_stores';
const HISTORY_KEY = '@shopping_browser_history';
const STORES_VERSION_KEY = '@shopping_browser_stores_version';
const CURRENT_STORES_VERSION = '2.0'; // Increment this when DEFAULT_STORES changes

export const DEFAULT_STORES: Store[] = [
  {
    id: '1',
    name: 'Wildberries',
    url: 'https://www.wildberries.ru/wbrands',
    logoLocal: STORE_LOGOS['1'],
    isDefault: true,
    order: 1,
  },
  {
    id: '2',
    name: 'Ozon',
    url: 'https://www.ozon.ru/category/odezhda-obuv-i-aksessuary-7500/',
    logoLocal: STORE_LOGOS['2'],
    isDefault: true,
    order: 2,
  },
  {
    id: '3',
    name: 'Lamoda',
    url: 'https://www.lamoda.ru/c/355/clothes-zhenskaya-odezhda/',
    logoLocal: STORE_LOGOS['3'],
    isDefault: true,
    order: 3,
  },
  {
    id: '4',
    name: 'Befree',
    url: 'https://befree.ru/zhenskaya',
    logoLocal: STORE_LOGOS['4'],
    isDefault: true,
    order: 4,
  },
  {
    id: '5',
    name: 'ТВОЕ',
    url: 'https://tvoe.ru/catalog/jenshchinam/odejda/',
    logoLocal: STORE_LOGOS['5'],
    isDefault: true,
    order: 5,
  },
  {
    id: '6',
    name: 'Zarina',
    url: 'https://zarina.ru/',
    logoLocal: STORE_LOGOS['6'],
    isDefault: true,
    order: 6,
  },
  {
    id: '7',
    name: 'Gloria Jeans',
    url: 'https://www.gloria-jeans.ru/catalog/girls',
    logoLocal: STORE_LOGOS['7'],
    isDefault: true,
    order: 7,
  },
  {
    id: '8',
    name: 'Henderson',
    url: 'https://henderson.ru/catalog/apparel/',
    logoLocal: STORE_LOGOS['8'],
    isDefault: true,
    order: 8,
  },
  {
    id: '9',
    name: 'MAAG',
    url: 'https://maag-fashion.com/collections/women-sale-t-shirts/',
    logoLocal: STORE_LOGOS['9'],
    isDefault: true,
    order: 9,
  },
  {
    id: '10',
    name: 'ECRU',
    url: 'https://www.ecrubrand.com/collections',
    logoLocal: STORE_LOGOS['10'],
    isDefault: true,
    order: 10,
  },
  {
    id: '11',
    name: 'DUB',
    url: 'https://www.dubapparels.com/bestsellers',
    logoLocal: STORE_LOGOS['11'],
    isDefault: true,
    order: 11,
  },
];

class StoreService {
  /**
   * Check if stores need update based on version
   */
  private async checkStoresVersion(): Promise<boolean> {
    try {
      const storedVersion = await AsyncStorage.getItem(STORES_VERSION_KEY);
      return storedVersion === CURRENT_STORES_VERSION;
    } catch (error) {
      console.error('[StoreService] Error checking version:', error);
      return false;
    }
  }

  /**
   * Update stores version
   */
  private async updateStoresVersion(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORES_VERSION_KEY, CURRENT_STORES_VERSION);
    } catch (error) {
      console.error('[StoreService] Error updating version:', error);
    }
  }

  /**
   * Get all stores (default + custom)
   * Automatically updates to new defaults if version changed
   */
  async getStores(): Promise<Store[]> {
    try {
      // Check if stores version is current
      const isCurrentVersion = await this.checkStoresVersion();

      if (!isCurrentVersion) {
        console.log('[StoreService] Stores version outdated, resetting to defaults');
        await this.saveStores(DEFAULT_STORES);
        await this.updateStoresVersion();
        return DEFAULT_STORES;
      }

      const stored = await AsyncStorage.getItem(STORES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Validate parsed data is an array
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Restore local logos for default stores
            const storesWithLogos = parsed.map((store) => {
              if (store.isDefault && STORE_LOGOS[store.id as keyof typeof STORE_LOGOS]) {
                return {
                  ...store,
                  logoLocal: STORE_LOGOS[store.id as keyof typeof STORE_LOGOS],
                };
              }
              return store;
            });
            return storesWithLogos;
          }
          console.warn('[StoreService] Invalid stored data, using defaults');
        } catch (parseError) {
          console.error('[StoreService] JSON parse error:', parseError);
        }
      }
      // First time or invalid data - return defaults
      await this.saveStores(DEFAULT_STORES);
      await this.updateStoresVersion();
      return DEFAULT_STORES;
    } catch (error) {
      console.error('[StoreService] Error loading stores:', error);
      return DEFAULT_STORES;
    }
  }

  /**
   * Save stores to AsyncStorage
   */
  async saveStores(stores: Store[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORES_KEY, JSON.stringify(stores));
    } catch (error) {
      console.error('Error saving stores:', error);
      throw error;
    }
  }

  /**
   * Add custom store
   * Automatically fetches favicon for the store
   */
  async addStore(name: string, url: string, faviconUrl?: string): Promise<Store> {
    const stores = await this.getStores();
    const maxOrder = Math.max(...stores.map((s) => s.order), 0);

    // Fetch favicon from Google's service
    const logoUrl = faviconUrl || getStoreFavicon(url);

    const newStore: Store = {
      id: Date.now().toString(),
      name,
      url,
      logoUrl,
      isDefault: false,
      order: maxOrder + 1,
    };

    stores.push(newStore);
    await this.saveStores(stores);
    return newStore;
  }

  /**
   * Remove store (only custom stores can be removed)
   */
  async removeStore(storeId: string): Promise<void> {
    const stores = await this.getStores();
    const store = stores.find((s) => s.id === storeId);

    if (store?.isDefault) {
      throw new Error('Cannot remove default store');
    }

    const filtered = stores.filter((s) => s.id !== storeId);
    await this.saveStores(filtered);
  }

  /**
   * Reorder stores
   */
  async reorderStores(storeIds: string[]): Promise<void> {
    if (!storeIds || storeIds.length === 0) {
      throw new Error('Store IDs array is empty');
    }

    const stores = await this.getStores();

    // Validate all IDs exist
    const missingIds = storeIds.filter((id) => !stores.find((s) => s.id === id));
    if (missingIds.length > 0) {
      throw new Error(`Stores not found: ${missingIds.join(', ')}`);
    }

    const reordered = storeIds.map((id, index) => {
      const store = stores.find((s) => s.id === id)!;
      return { ...store, order: index + 1 };
    });

    await this.saveStores(reordered);
  }

  /**
   * Get browser history
   */
  async getHistory(): Promise<BrowserHistoryItem[]> {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Add to history
   */
  async addToHistory(item: Omit<BrowserHistoryItem, 'timestamp'>): Promise<void> {
    try {
      const history = await this.getHistory();
      const newItem: BrowserHistoryItem = {
        ...item,
        timestamp: Date.now(),
      };

      // Keep only last 100 items
      const updated = [newItem, ...history.filter((h) => h.url !== item.url)].slice(0, 100);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  /**
   * Clear history
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

  /**
   * Reset to defaults
   * Also updates version to current
   */
  async resetToDefaults(): Promise<void> {
    await this.saveStores(DEFAULT_STORES);
    await this.updateStoresVersion();
  }
}

export const storeService = new StoreService();
