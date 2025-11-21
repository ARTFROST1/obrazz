import { CATEGORIES } from '@constants/categories';
import { DEFAULT_CUSTOM_CATEGORIES } from '@constants/outfitTabs';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { OutfitTabType } from '../../types/components/OutfitCreator';
import { ItemCategory, WardrobeItem } from '../../types/models/item';
import { CanvasSettings, Outfit, OutfitBackground, OutfitItem } from '../../types/models/outfit';
import { zustandStorage } from '../storage';

interface HistoryState {
  items: OutfitItem[];
  background: OutfitBackground;
}

interface OutfitState {
  // Current outfit being created/edited
  currentOutfit: Partial<Outfit> | null;
  currentItems: OutfitItem[];
  currentBackground: OutfitBackground;
  canvasSettings: CanvasSettings;

  // Two-step creation process
  creationStep: 1 | 2;

  // ✅ NEW: Storage architecture for clean tab synchronization
  selectedItemsByCategory: Record<ItemCategory, WardrobeItem | null>; // Global storage (Basic, Dress, All)
  customTabSelectedItems: (WardrobeItem | null)[]; // Custom tab storage (independent)
  selectedItemsForCreation: (WardrobeItem | null)[]; // Derived/computed from above

  // Tab system
  activeTab: OutfitTabType;
  customTabCategories: ItemCategory[];
  customTabOrder: number[];
  isCustomTabEditing: boolean;

  // Saved outfits
  outfits: Outfit[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Undo/Redo
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;

  // Actions
  setCurrentOutfit: (outfit: Partial<Outfit> | null) => void;
  addItemToCanvas: (item: OutfitItem) => void;
  updateItemTransform: (itemId: string, transform: Partial<OutfitItem['transform']>) => void;
  removeItemFromCanvas: (itemId: string) => void;
  setItemVisibility: (itemId: string, isVisible: boolean) => void;
  setBackground: (background: OutfitBackground) => void;
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;

  // Two-step creation actions
  setCreationStep: (step: 1 | 2) => void;
  selectItemForCategory: (slotIndex: number, item: WardrobeItem | null) => void;
  getSelectedItemsCount: () => number;
  confirmItemSelection: () => void;
  clearItemSelection: () => void;
  goBackToSelection: () => void;

  // ✅ NEW: Update derived state
  updateSelectedItemsForCreation: () => void;

  // Tab management
  setActiveTab: (tab: OutfitTabType) => void;
  updateCustomTab: (categories: ItemCategory[], order: number[]) => void;
  toggleCustomTabEditing: () => void;
  addCategoryToCustom: (category: ItemCategory) => void;
  removeCategoryFromCustom: (category: ItemCategory) => void;
  reorderCustomCategories: (fromIndex: number, toIndex: number) => void;
  getActiveTabCategories: () => ItemCategory[];

  // Outfit management
  setOutfits: (outfits: Outfit[]) => void;
  addOutfit: (outfit: Outfit) => void;
  updateOutfit: (id: string, updates: Partial<Outfit>) => void;
  deleteOutfit: (id: string) => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Reset
  resetCurrentOutfit: () => void;
  clearCanvas: () => void;

  // Loading & Error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultBackground: OutfitBackground = {
  type: 'color',
  value: '#FFFFFF',
  opacity: 1,
};

const defaultCanvasSettings: CanvasSettings = {
  width: 300,
  height: 400,
  aspectRatio: '3:4',
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
};

// Helper to create empty selection array
const createEmptySelection = (size: number): (WardrobeItem | null)[] => {
  return new Array(size).fill(null);
};

// ✅ HELPER FUNCTIONS for tab detection and synchronization

// Check if categories match Basic tab
function isBasicTab(categories: ItemCategory[]): boolean {
  return (
    categories.length === 3 &&
    categories[0] === 'tops' &&
    categories[1] === 'bottoms' &&
    categories[2] === 'footwear'
  );
}

// Check if categories match Dress tab
function isDressTab(categories: ItemCategory[]): boolean {
  return (
    categories.length === 3 &&
    categories[0] === 'fullbody' &&
    categories[1] === 'footwear' &&
    categories[2] === 'accessories'
  );
}

// Check if categories match All tab
function isAllTab(categories: ItemCategory[]): boolean {
  if (categories.length !== CATEGORIES.length) return false;
  return categories.every((cat, index) => cat === CATEGORIES[index]);
}

// ✅ NEW: Compute selectedItemsForCreation based on active tab
function computeSelectedItemsForCreation(
  activeTab: OutfitTabType,
  categories: ItemCategory[],
  selectedByCategory: Record<ItemCategory, WardrobeItem | null>,
  customSelected: (WardrobeItem | null)[],
): (WardrobeItem | null)[] {
  if (activeTab === 'custom') {
    // Custom tab uses its own storage
    return [...customSelected];
  } else {
    // Basic, Dress, All: map from global storage
    return categories.map((cat) => selectedByCategory[cat] ?? null);
  }
}

export const useOutfitStore = create<OutfitState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentOutfit: null,
      currentItems: [],
      currentBackground: defaultBackground,
      canvasSettings: defaultCanvasSettings,
      creationStep: 1,

      // ✅ NEW: Initialize clean architecture storages
      selectedItemsByCategory: {
        headwear: null,
        outerwear: null,
        tops: null,
        bottoms: null,
        footwear: null,
        accessories: null,
        fullbody: null,
        other: null,
      },
      customTabSelectedItems: [],
      selectedItemsForCreation: createEmptySelection(DEFAULT_CUSTOM_CATEGORIES.length),

      activeTab: 'custom', // ✅ FIX #1: Open Custom tab by default (with Basic categories)
      customTabCategories: DEFAULT_CUSTOM_CATEGORIES, // ['tops', 'bottoms', 'footwear'] - same as Basic
      customTabOrder: DEFAULT_CUSTOM_CATEGORIES.map((_, i) => i),
      isCustomTabEditing: false,
      outfits: [],
      isLoading: false,
      error: null,
      history: [],
      historyIndex: -1,
      maxHistorySize: 20,

      // Current outfit actions
      setCurrentOutfit: (outfit) => {
        if (!outfit) {
          // Handle null case - resetting to initial state
          console.log('📝 [outfitStore] setCurrentOutfit: null outfit - resetting to defaults');
          set({
            currentOutfit: null,
            currentItems: [],
            currentBackground: defaultBackground,
            customTabCategories: DEFAULT_CUSTOM_CATEGORIES,
            customTabSelectedItems: [],
            selectedItemsByCategory: {
              headwear: null,
              outerwear: null,
              tops: null,
              bottoms: null,
              footwear: null,
              accessories: null,
              fullbody: null,
              other: null,
            },
            activeTab: 'custom',
            canvasSettings: defaultCanvasSettings,
            error: null,
          });
          get().updateSelectedItemsForCreation();
          console.log(
            '✅ [outfitStore] Reset complete - customTabCategories:',
            DEFAULT_CUSTOM_CATEGORIES,
          );
          return;
        }

        console.log('📝 [outfitStore] setCurrentOutfit - EDIT MODE:', {
          outfitId: outfit.id,
          totalItems: outfit.items?.length || 0,
          hasCanvasSettings: !!outfit.canvasSettings,
        });

        // ✅ NEW: Filter VISIBLE items for edit mode
        const allItems = outfit.items || [];
        const visibleItems = allItems
          .filter((item) => item.isVisible !== false) // include items without isVisible flag
          .sort((a, b) => a.slot - b.slot);

        // ✅ NEW: Extract categories from visible items IN ORDER
        const customCategories = visibleItems.map((item) => item.category);

        console.log('📍 [Edit Mode] Visible items analysis:', {
          totalItems: allItems.length,
          visibleItems: visibleItems.length,
          hiddenItems: allItems.length - visibleItems.length,
          categories: customCategories,
          slots: visibleItems.map((item) => item.slot),
        });

        // ✅ NEW: Restore to customTabSelectedItems (edit mode is always custom)
        const customTabSelectedItems = visibleItems.map((item) => item.item || null);

        console.log('📍 [Edit Mode] Restored items:', {
          items: customTabSelectedItems.map((item) => item?.title || 'null'),
        });

        // ✅ NEW: Clear global storage (not used in custom tab edit mode)
        const selectedItemsByCategory = {
          headwear: null,
          outerwear: null,
          tops: null,
          bottoms: null,
          footwear: null,
          accessories: null,
          fullbody: null,
          other: null,
        };

        set({
          currentOutfit: outfit,
          currentItems: allItems, // все items (включая скрытые для canvas)
          currentBackground: outfit.background || defaultBackground,
          customTabCategories: customCategories, // только видимые категории
          customTabSelectedItems: customTabSelectedItems, // только видимые items
          selectedItemsByCategory: selectedItemsByCategory, // очищен
          activeTab: 'custom', // ✅ ВСЕГДА custom для edit
          canvasSettings: outfit.canvasSettings || defaultCanvasSettings,
          error: null,
        });

        // ✅ Recompute derived state
        get().updateSelectedItemsForCreation();

        console.log('✅ [Edit Mode] Setup complete:', {
          activeTab: 'custom',
          carouselsCount: customCategories.length,
          categories: customCategories,
        });
      },

      addItemToCanvas: (item) => {
        const currentItems = get().currentItems;

        // Check if item already exists
        const existingIndex = currentItems.findIndex((i) => i.itemId === item.itemId);

        if (existingIndex >= 0) {
          // Update existing item
          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = item;
          set({ currentItems: updatedItems });
        } else {
          // Add new item
          set({ currentItems: [...currentItems, item] });
        }

        get().pushHistory();
      },

      updateItemTransform: (itemId, transform) => {
        const currentItems = get().currentItems;
        const updatedItems = currentItems.map((item) =>
          item.itemId === itemId
            ? { ...item, transform: { ...item.transform, ...transform } }
            : item,
        );
        set({ currentItems: updatedItems });
        get().pushHistory();
      },

      removeItemFromCanvas: (itemId) => {
        const currentItems = get().currentItems;
        set({ currentItems: currentItems.filter((item) => item.itemId !== itemId) });
        get().pushHistory();
      },

      setItemVisibility: (itemId, isVisible) => {
        const currentItems = get().currentItems;
        const updatedItems = currentItems.map((item) =>
          item.itemId === itemId ? { ...item, isVisible } : item,
        );
        set({ currentItems: updatedItems });
      },

      setBackground: (background) => {
        set({ currentBackground: background });
        get().pushHistory();
      },

      updateCanvasSettings: (settings) => {
        set({
          canvasSettings: {
            ...get().canvasSettings,
            ...settings,
          },
        });
      },

      // Two-step creation actions
      setCreationStep: (step) => {
        set({ creationStep: step });
      },

      // ✅ NEW: Update derived state based on active tab
      updateSelectedItemsForCreation: () => {
        const state = get();
        const categories = state.getActiveTabCategories();

        const computed = computeSelectedItemsForCreation(
          state.activeTab,
          categories,
          state.selectedItemsByCategory,
          state.customTabSelectedItems,
        );

        console.log('🔄 [outfitStore] Recomputing selectedItemsForCreation:', {
          activeTab: state.activeTab,
          categories,
          computed: computed.map((item) => item?.title || 'null'),
        });

        set({ selectedItemsForCreation: computed });
      },

      selectItemForCategory: (slotIndex, item) => {
        const state = get();
        const activeTab = state.activeTab;
        const categories = state.getActiveTabCategories();
        const category = categories[slotIndex];

        if (activeTab === 'custom') {
          // ✅ Custom tab: update custom storage
          const customItems = [...state.customTabSelectedItems];

          // Ensure array is big enough
          while (customItems.length <= slotIndex) {
            customItems.push(null);
          }

          customItems[slotIndex] = item;

          console.log(`✏️ [outfitStore] Custom tab: slot ${slotIndex} → ${item?.title || 'null'}`);

          set({ customTabSelectedItems: customItems });
        } else {
          // ✅ Basic/Dress/All: update global storage
          console.log(`✏️ [outfitStore] Global: ${category} → ${item?.title || 'null'}`);

          set({
            selectedItemsByCategory: {
              ...state.selectedItemsByCategory,
              [category]: item,
            },
          });
        }

        // ✅ Recompute derived state
        get().updateSelectedItemsForCreation();
      },

      getSelectedItemsCount: () => {
        return get().selectedItemsForCreation.filter((item) => item !== null).length;
      },

      confirmItemSelection: () => {
        const selected = get().selectedItemsForCreation;
        const categories = get().getActiveTabCategories(); // ✅ FIX #3: Use ACTIVE tab categories
        const activeTab = get().activeTab;
        const currentSettings = get().canvasSettings;

        console.log('✅ [outfitStore] Confirming selection from ACTIVE tab:', {
          activeTab,
          categories,
          categoriesCount: categories.length,
          selectedCount: selected.filter(Boolean).length,
        });

        const CANVAS_WIDTH = 300;
        const CANVAS_HEIGHT = 400;

        const outfitItems: OutfitItem[] = [];

        selected.forEach((item, slotIndex) => {
          if (item && categories[slotIndex]) {
            const category = categories[slotIndex];
            const centerX = CANVAS_WIDTH / 2 - 50;
            const spacing = CANVAS_HEIGHT / (categories.length + 1);
            const centerY = spacing * (slotIndex + 1) - 50;

            outfitItems.push({
              itemId: item.id,
              item,
              category,
              slot: slotIndex,
              transform: {
                x: centerX,
                y: centerY,
                scale: 1,
                rotation: 0,
                zIndex: slotIndex,
              },
              isVisible: true,
            });

            console.log(`  ✓ Item ${slotIndex}: ${item.title} (${category})`);
          }
        });

        console.log('💾 [outfitStore] Saving categories from active tab to canvasSettings:', {
          activeTab,
          categories,
          itemsCount: outfitItems.length,
        });

        set({
          currentItems: outfitItems,
          creationStep: 2,
          canvasSettings: {
            ...currentSettings,
            customTabCategories: categories, // ✅ Save ACTIVE tab categories
          },
        });

        get().pushHistory();
      },

      clearItemSelection: () => {
        console.log('🗑️ [outfitStore] Clearing all selections');

        // ✅ Clear both storages
        set({
          selectedItemsByCategory: {
            headwear: null,
            outerwear: null,
            tops: null,
            bottoms: null,
            footwear: null,
            accessories: null,
            fullbody: null,
            other: null,
          },
          customTabSelectedItems: [],
          creationStep: 1,
        });

        // ✅ Recompute derived state
        get().updateSelectedItemsForCreation();
      },

      goBackToSelection: () => {
        const currentItems = get().currentItems;
        const categories = get().customTabCategories;

        const selectedItems: (WardrobeItem | null)[] = createEmptySelection(categories.length);

        currentItems.forEach((outfitItem) => {
          if (outfitItem.item && outfitItem.slot < selectedItems.length) {
            selectedItems[outfitItem.slot] = outfitItem.item;
          }
        });

        set({
          selectedItemsForCreation: selectedItems,
          creationStep: 1,
        });
      },

      // Tab management
      setActiveTab: (tab) => {
        const currentTab = get().activeTab;

        console.log(`🔄 [outfitStore] Switching tab: ${currentTab} → ${tab}`);

        // ✅ CLEAN: Just set the tab
        set({ activeTab: tab });

        // ✅ Recompute derived state
        get().updateSelectedItemsForCreation();
      },

      updateCustomTab: (categories, order) => {
        const oldCategories = get().customTabCategories;
        const oldSelected = get().selectedItemsForCreation;

        let newSelected: (WardrobeItem | null)[];

        if (categories.length !== oldCategories.length) {
          // Resize array
          newSelected = createEmptySelection(categories.length);

          // Try to preserve selections where possible
          for (let i = 0; i < Math.min(oldSelected.length, newSelected.length); i++) {
            newSelected[i] = oldSelected[i];
          }
        } else {
          newSelected = oldSelected;
        }

        set({
          customTabCategories: categories,
          customTabOrder: order,
          selectedItemsForCreation: newSelected,
        });
      },

      toggleCustomTabEditing: () => {
        set({ isCustomTabEditing: !get().isCustomTabEditing });
      },

      addCategoryToCustom: (category) => {
        const { customTabCategories, customTabOrder } = get();

        if (
          !customTabCategories.includes(category) &&
          customTabCategories.length < CATEGORIES.length
        ) {
          const newCategories = [...customTabCategories, category];
          const newOrder = [...customTabOrder, customTabCategories.length];

          set({
            customTabCategories: newCategories,
            customTabOrder: newOrder,
          });
        }
      },

      removeCategoryFromCustom: (category) => {
        const { customTabCategories, customTabOrder } = get();

        if (customTabCategories.length > 1) {
          const index = customTabCategories.indexOf(category);
          if (index !== -1) {
            const newCategories = customTabCategories.filter((_, i) => i !== index);
            const newOrder = customTabOrder
              .filter((orderIndex) => orderIndex !== index)
              .map((orderIndex) => (orderIndex > index ? orderIndex - 1 : orderIndex));

            set({
              customTabCategories: newCategories,
              customTabOrder: newOrder,
            });
          }
        }
      },

      reorderCustomCategories: (fromIndex, toIndex) => {
        const { customTabCategories } = get();
        const newCategories = [...customTabCategories];
        const [movedItem] = newCategories.splice(fromIndex, 1);
        newCategories.splice(toIndex, 0, movedItem);

        set({
          customTabCategories: newCategories,
          customTabOrder: newCategories.map((_, i) => i),
        });
      },

      getActiveTabCategories: () => {
        const { activeTab, customTabCategories } = get();

        switch (activeTab) {
          case 'basic':
            return ['tops', 'bottoms', 'footwear'];
          case 'dress':
            return ['fullbody', 'footwear', 'accessories'];
          case 'all':
            return CATEGORIES;
          case 'custom':
            return customTabCategories;
          default:
            return CATEGORIES;
        }
      },

      // Outfit management
      setOutfits: (outfits) => {
        set({ outfits, error: null });
      },

      addOutfit: (outfit) => {
        set({ outfits: [outfit, ...get().outfits] });
      },

      updateOutfit: (id, updates) => {
        const outfits = get().outfits;
        set({
          outfits: outfits.map((outfit) =>
            outfit.id === id ? { ...outfit, ...updates, updatedAt: new Date() } : outfit,
          ),
        });
      },

      deleteOutfit: (id) => {
        set({ outfits: get().outfits.filter((outfit) => outfit.id !== id) });
      },

      // History management
      pushHistory: () => {
        const { currentItems, currentBackground, history, historyIndex, maxHistorySize } = get();

        const newHistoryState: HistoryState = {
          items: JSON.parse(JSON.stringify(currentItems)),
          background: JSON.parse(JSON.stringify(currentBackground)),
        };

        // Remove any history after current index (if we're not at the end)
        const newHistory = history.slice(0, historyIndex + 1);

        // Add new state
        newHistory.push(newHistoryState);

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();

        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const state = history[newIndex];

          set({
            currentItems: JSON.parse(JSON.stringify(state.items)),
            currentBackground: JSON.parse(JSON.stringify(state.background)),
            historyIndex: newIndex,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();

        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const state = history[newIndex];

          set({
            currentItems: JSON.parse(JSON.stringify(state.items)),
            currentBackground: JSON.parse(JSON.stringify(state.background)),
            historyIndex: newIndex,
          });
        }
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      clearHistory: () => {
        set({ history: [], historyIndex: -1 });
      },

      // Reset
      resetCurrentOutfit: () => {
        console.log(
          '🔄 [outfitStore] resetCurrentOutfit - CREATE MODE: Resetting to initial state',
        );
        console.log('  ↪️ customTabCategories will be set to:', DEFAULT_CUSTOM_CATEGORIES);
        console.log('  ↪️ activeTab will be set to: custom');
        console.log('  ↪️ This is the clean state for NEW outfit creation');

        set({
          currentOutfit: null,
          currentItems: [],
          currentBackground: defaultBackground,
          canvasSettings: defaultCanvasSettings,
          creationStep: 1,

          // ✅ Clear both storages
          selectedItemsByCategory: {
            headwear: null,
            outerwear: null,
            tops: null,
            bottoms: null,
            footwear: null,
            accessories: null,
            fullbody: null,
            other: null,
          },
          customTabSelectedItems: [],

          activeTab: 'custom',
          customTabCategories: DEFAULT_CUSTOM_CATEGORIES, // ['tops', 'bottoms', 'footwear']
          customTabOrder: DEFAULT_CUSTOM_CATEGORIES.map((_, i) => i),
          isCustomTabEditing: false,
          error: null,
        });

        // ✅ Recompute derived state
        get().updateSelectedItemsForCreation();
        get().clearHistory();

        console.log('✅ [outfitStore] Reset complete - ready for new outfit creation');
        console.log('  ℹ️ NOTE: ItemSelectionStepNew will load from AsyncStorage if available');
      },

      clearCanvas: () => {
        set({ currentItems: [] });
        get().pushHistory();
      },

      // Loading & Error
      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'outfit-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        outfits: state.outfits,
        canvasSettings: state.canvasSettings,
        activeTab: state.activeTab,
        customTabCategories: state.customTabCategories,
        customTabOrder: state.customTabOrder,
      }),
      skipHydration: true, // Skip hydration on server (SSR)
    },
  ),
);
