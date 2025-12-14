import type { BrowserHistoryItem, Store } from '@/types/models/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORES_KEY = '@shopping_browser_stores';
const HISTORY_KEY = '@shopping_browser_history';

export const DEFAULT_STORES: Store[] = [
  {
    id: '1',
    name: 'ZARA',
    url: 'https://www.zara.com',
    faviconUrl: 'https://www.zara.com/favicon.ico',
    isDefault: true,
    order: 1,
  },
  {
    id: '2',
    name: 'H&M',
    url: 'https://www2.hm.com',
    faviconUrl: 'https://www2.hm.com/favicon.ico',
    isDefault: true,
    order: 2,
  },
  {
    id: '3',
    name: 'ASOS',
    url: 'https://www.asos.com',
    faviconUrl: 'https://www.asos.com/favicon.ico',
    isDefault: true,
    order: 3,
  },
  {
    id: '4',
    name: 'Nike',
    url: 'https://www.nike.com',
    faviconUrl: 'https://www.nike.com/favicon.ico',
    isDefault: true,
    order: 4,
  },
  {
    id: '5',
    name: 'Adidas',
    url: 'https://www.adidas.com',
    faviconUrl: 'https://www.adidas.com/favicon.ico',
    isDefault: true,
    order: 5,
  },
  {
    id: '6',
    name: 'Reserved',
    url: 'https://www.reserved.com',
    faviconUrl: 'https://www.reserved.com/favicon.ico',
    isDefault: true,
    order: 6,
  },
  {
    id: '7',
    name: 'Mango',
    url: 'https://shop.mango.com',
    faviconUrl: 'https://shop.mango.com/favicon.ico',
    isDefault: true,
    order: 7,
  },
  {
    id: '8',
    name: 'Pull&Bear',
    url: 'https://www.pullandbear.com',
    faviconUrl: 'https://www.pullandbear.com/favicon.ico',
    isDefault: true,
    order: 8,
  },
  {
    id: '9',
    name: 'Bershka',
    url: 'https://www.bershka.com',
    faviconUrl: 'https://www.bershka.com/favicon.ico',
    isDefault: true,
    order: 9,
  },
];

class StoreService {
  /**
   * Get all stores (default + custom)
   */
  async getStores(): Promise<Store[]> {
    try {
      const stored = await AsyncStorage.getItem(STORES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Validate parsed data is an array
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
          console.warn('[StoreService] Invalid stored data, using defaults');
        } catch (parseError) {
          console.error('[StoreService] JSON parse error:', parseError);
        }
      }
      // First time or invalid data - return defaults
      await this.saveStores(DEFAULT_STORES);
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
   */
  async addStore(name: string, url: string, faviconUrl?: string): Promise<Store> {
    const stores = await this.getStores();
    const maxOrder = Math.max(...stores.map((s) => s.order), 0);

    const newStore: Store = {
      id: Date.now().toString(),
      name,
      url,
      faviconUrl,
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
   */
  async resetToDefaults(): Promise<void> {
    await this.saveStores(DEFAULT_STORES);
  }
}

export const storeService = new StoreService();
