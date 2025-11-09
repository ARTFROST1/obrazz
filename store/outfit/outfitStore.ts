import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage';
import { Outfit, OutfitItem, OutfitBackground, CanvasSettings } from '../../types/models/outfit';
import { WardrobeItem, ItemCategory } from '../../types/models/item';
import { CATEGORIES } from '@constants/categories';

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
  selectedItemsForCreation: Record<ItemCategory, WardrobeItem | null>;

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
  selectItemForCategory: (category: ItemCategory, item: WardrobeItem | null) => void;
  getSelectedItemsCount: () => number;
  confirmItemSelection: () => void;
  clearItemSelection: () => void;
  goBackToSelection: () => void;

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

const emptySelectedItems: Record<ItemCategory, WardrobeItem | null> = {
  headwear: null,
  outerwear: null,
  tops: null,
  bottoms: null,
  footwear: null,
  accessories: null,
  fullbody: null,
  other: null,
};

export const useOutfitStore = create<OutfitState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentOutfit: null,
      currentItems: [],
      currentBackground: defaultBackground,
      canvasSettings: defaultCanvasSettings,
      creationStep: 1,
      selectedItemsForCreation: { ...emptySelectedItems },
      outfits: [],
      isLoading: false,
      error: null,
      history: [],
      historyIndex: -1,
      maxHistorySize: 20,

      // Current outfit actions
      setCurrentOutfit: (outfit) => {
        // Initialize selectedItemsForCreation from outfit items for edit mode
        const selectedItems: Record<ItemCategory, WardrobeItem | null> = { ...emptySelectedItems };

        if (outfit?.items) {
          outfit.items.forEach((outfitItem) => {
            if (outfitItem.item) {
              selectedItems[outfitItem.category] = outfitItem.item;
            }
          });
        }

        // Debug: Log what we're setting
        console.log('🔍 [outfitStore] setCurrentOutfit:', {
          outfitId: outfit?.id,
          itemsCount: outfit?.items?.length || 0,
          selectedCategories: Object.entries(selectedItems)
            .filter(([_, item]) => item !== null)
            .map(([cat, item]) => ({ category: cat, itemId: item?.id })),
        });

        set({
          currentOutfit: outfit,
          currentItems: outfit?.items || [],
          currentBackground: outfit?.background || defaultBackground,
          selectedItemsForCreation: selectedItems,
          error: null,
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

      selectItemForCategory: (category, item) => {
        set({
          selectedItemsForCreation: {
            ...get().selectedItemsForCreation,
            [category]: item,
          },
        });
      },

      getSelectedItemsCount: () => {
        const selected = get().selectedItemsForCreation;
        return Object.values(selected).filter((item) => item !== null).length;
      },

      confirmItemSelection: () => {
        // Convert selected items to OutfitItems with initial transforms
        const selected = get().selectedItemsForCreation;

        const CANVAS_WIDTH = 300;
        const CANVAS_HEIGHT = 400;

        const outfitItems: OutfitItem[] = [];
        let slotIndex = 0;

        CATEGORIES.forEach((category) => {
          const item = selected[category];
          if (item) {
            const categoryIndex = CATEGORIES.indexOf(category);
            const centerX = CANVAS_WIDTH / 2 - 50;
            const spacing = CANVAS_HEIGHT / (CATEGORIES.length + 1);
            const centerY = spacing * (categoryIndex + 1) - 50;

            outfitItems.push({
              itemId: item.id,
              item,
              category,
              slot: slotIndex++,
              transform: {
                x: centerX,
                y: centerY,
                scale: 1,
                rotation: 0,
                zIndex: categoryIndex,
              },
              isVisible: true,
            });
          }
        });

        set({
          currentItems: outfitItems,
          creationStep: 2,
        });

        get().pushHistory();
      },

      clearItemSelection: () => {
        set({
          selectedItemsForCreation: { ...emptySelectedItems },
          creationStep: 1,
        });
      },

      goBackToSelection: () => {
        // Save current canvas items back to selected items
        const currentItems = get().currentItems;
        const selectedItems: Record<ItemCategory, WardrobeItem | null> = { ...emptySelectedItems };

        currentItems.forEach((outfitItem) => {
          if (outfitItem.item) {
            selectedItems[outfitItem.category] = outfitItem.item;
          }
        });

        set({
          selectedItemsForCreation: selectedItems,
          creationStep: 1,
        });
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
        set({
          currentOutfit: null,
          currentItems: [],
          currentBackground: defaultBackground,
          creationStep: 1,
          selectedItemsForCreation: { ...emptySelectedItems },
          error: null,
        });
        get().clearHistory();
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
      }),
      skipHydration: true, // Skip hydration on server (SSR)
    },
  ),
);
