import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ItemCategory, ItemFilter, ItemSortOptions, WardrobeItem } from '../../types/models/item';
import { zustandStorage } from '../storage';

interface WardrobeState {
  items: WardrobeItem[];
  filter: ItemFilter;
  sortOptions: ItemSortOptions;
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: WardrobeItem[]) => void;
  addItem: (item: WardrobeItem) => void;
  updateItem: (id: string, updates: Partial<WardrobeItem>) => void;
  removeItemLocally: (id: string) => void;
  setFilter: (filter: Partial<ItemFilter>) => void;
  clearFilter: () => void;
  setSortOptions: (sortOptions: ItemSortOptions) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Getters
  getFilteredItems: () => WardrobeItem[];
  getItemsByCategory: (category: ItemCategory) => WardrobeItem[];
  getFavoriteItems: () => WardrobeItem[];
  getDefaultItems: () => WardrobeItem[];
  getUserOwnItems: () => WardrobeItem[];

  // Utility
  clearAll: () => void;
}

const defaultFilter: ItemFilter = {
  categories: undefined,
  colors: undefined,
  styles: undefined,
  seasons: undefined,
  isFavorite: undefined,
  isBuiltin: undefined,
  searchQuery: undefined,
};

const defaultSortOptions: ItemSortOptions = {
  field: 'createdAt',
  direction: 'desc',
};

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      filter: defaultFilter,
      sortOptions: defaultSortOptions,
      isLoading: false,
      error: null,

      setItems: (items) => set({ items }),

      addItem: (item) => set((state) => ({ items: [item, ...state.items] })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item,
          ),
        })),

      removeItemLocally: (id) =>
        set((state) => {
          console.log('[WardrobeStore.removeItemLocally] Removing item:', id);
          console.log(
            '[WardrobeStore.removeItemLocally] Before removal, items count:',
            state.items.length,
          );
          const newItems = state.items.filter((item) => item.id !== id);
          console.log(
            '[WardrobeStore.removeItemLocally] After removal, items count:',
            newItems.length,
          );
          return { items: newItems };
        }),

      setFilter: (filter) =>
        set((state) => ({
          filter: { ...state.filter, ...filter },
        })),

      clearFilter: () => set({ filter: defaultFilter }),

      setSortOptions: (sortOptions) => set({ sortOptions }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      getFilteredItems: () => {
        const { items, filter, sortOptions } = get();
        let filtered = [...items];

        // Apply filters
        if (filter.categories && filter.categories.length > 0) {
          filtered = filtered.filter((item) => filter.categories!.includes(item.category));
        }

        if (filter.colors && filter.colors.length > 0) {
          filtered = filtered.filter((item) =>
            item.colors.some((color) => filter.colors!.includes(color.hex)),
          );
        }

        if (filter.styles && filter.styles.length > 0) {
          filtered = filtered.filter((item) =>
            item.styles.some((style) => filter.styles!.includes(style)),
          );
        }

        if (filter.seasons && filter.seasons.length > 0) {
          filtered = filtered.filter((item) =>
            item.seasons.some((season) => filter.seasons!.includes(season)),
          );
        }

        if (filter.isFavorite !== undefined) {
          filtered = filtered.filter((item) => item.isFavorite === filter.isFavorite);
        }

        if (filter.isBuiltin !== undefined) {
          filtered = filtered.filter((item) => item.isBuiltin === filter.isBuiltin);
        }

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (item) =>
              item.title?.toLowerCase().includes(query) ||
              item.brand?.toLowerCase().includes(query) ||
              item.tags?.some((tag) => tag.toLowerCase().includes(query)),
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const aValue = a[sortOptions.field];
          const bValue = b[sortOptions.field];

          // Handle null/undefined values - put them at the end
          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return 1;
          if (bValue == null) return -1;

          if (aValue instanceof Date && bValue instanceof Date) {
            return sortOptions.direction === 'asc'
              ? aValue.getTime() - bValue.getTime()
              : bValue.getTime() - aValue.getTime();
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOptions.direction === 'asc' ? aValue - bValue : bValue - aValue;
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOptions.direction === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          return 0;
        });

        return filtered;
      },

      getItemsByCategory: (category) => {
        const { items } = get();
        return items.filter((item) => item.category === category);
      },

      getFavoriteItems: () => {
        const { items } = get();
        return items.filter((item) => item.isFavorite);
      },

      getDefaultItems: () => {
        const { items } = get();
        return items.filter((item) => item.isBuiltin === true);
      },

      getUserOwnItems: () => {
        const { items } = get();
        return items.filter((item) => item.isBuiltin !== true);
      },

      // Clear all data (useful for logout)
      clearAll: () => {
        console.log('[WardrobeStore] Clearing all data');
        set({
          items: [],
          filter: defaultFilter,
          sortOptions: defaultSortOptions,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'wardrobe-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        items: state.items,
        filter: state.filter,
        sortOptions: state.sortOptions,
      }),
      skipHydration: true, // Skip hydration on server (SSR)
    },
  ),
);
