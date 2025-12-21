import { storeService } from '@/services/shopping/storeService';
import type { BrowserTab, CartItem, DetectedImage, Store } from '@/types/models/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const CART_STORAGE_KEY = '@shopping_browser_cart';

interface ShoppingBrowserState {
  // Stores
  stores: Store[];
  loadingStores: boolean;

  // Browser tabs
  tabs: BrowserTab[];
  activeTabId: string | null;

  // Detected images
  detectedImages: DetectedImage[];
  selectedImage: DetectedImage | null;
  showDetectedSheet: boolean;

  // Scan state
  isScanning: boolean;
  hasScanned: boolean;

  // NEW: Selection state
  selectedImageIds: Set<string>;

  // NEW: Cart state
  cartItems: CartItem[];

  // NEW: Gallery sheet state
  showGallerySheet: boolean;

  // Batch upload queue
  batchQueue: CartItem[];
  currentBatchIndex: number;
  isBatchMode: boolean;

  // Actions
  loadStores: () => Promise<void>;
  addStore: (name: string, url: string, faviconUrl?: string) => Promise<void>;
  removeStore: (storeId: string) => Promise<void>;
  reorderStores: (storeIds: string[]) => Promise<void>;

  // Tab actions
  openTab: (store: Store) => void;
  openAllTabs: (stores: Store[], activeIndex?: number) => void; // NEW: Open all stores at once
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabUrl: (tabId: string, url: string) => void;
  updateTabScroll: (tabId: string, position: number) => void;

  // Detection actions
  setDetectedImages: (images: DetectedImage[]) => void;
  selectImage: (image: DetectedImage) => void;
  clearDetectedImages: () => void;
  showDetectionSheet: (show: boolean) => void;

  // Scan actions
  setScanning: (scanning: boolean) => void;
  setHasScanned: (scanned: boolean) => void;
  resetScanState: () => void;

  // NEW: Selection actions
  toggleImageSelection: (imageId: string) => void;
  selectAllImages: () => void;
  clearSelection: () => void;

  // NEW: Cart actions
  addToCart: (images: DetectedImage[], sourceUrl: string, sourceName: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;

  // NEW: Gallery sheet actions
  showGallery: (show: boolean) => void;

  // Batch queue actions
  startBatchUpload: (items: CartItem[], fromCart?: boolean) => void;
  getNextBatchItem: () => CartItem | null;
  completeBatchItem: (itemId: string) => Promise<void>;
  cancelBatchUpload: () => void;
  isBatchInProgress: () => boolean;

  // Reset
  reset: () => void;
}

const MAX_TABS = 5;

export const useShoppingBrowserStore = create<ShoppingBrowserState>((set, get) => ({
  // Initial state
  stores: [],
  loadingStores: false,
  tabs: [],
  activeTabId: null,
  detectedImages: [],
  selectedImage: null,
  showDetectedSheet: false,

  // Scan state
  isScanning: false,
  hasScanned: false,

  // NEW: Selection state
  selectedImageIds: new Set<string>(),

  // NEW: Cart state
  cartItems: [],

  // NEW: Gallery sheet state
  showGallerySheet: false,

  // Batch upload queue
  batchQueue: [],
  currentBatchIndex: 0,
  isBatchMode: false,

  // Load stores from AsyncStorage
  loadStores: async () => {
    set({ loadingStores: true });
    try {
      const stores = await storeService.getStores();
      set({ stores, loadingStores: false });
    } catch (error) {
      console.error('Failed to load stores:', error);
      set({ loadingStores: false });
    }
  },

  // Add new store
  addStore: async (name, url, faviconUrl) => {
    try {
      const newStore = await storeService.addStore(name, url, faviconUrl);
      set((state) => ({
        stores: [...state.stores, newStore],
      }));
    } catch (error) {
      console.error('Failed to add store:', error);
      throw error;
    }
  },

  // Remove store
  removeStore: async (storeId) => {
    try {
      await storeService.removeStore(storeId);
      set((state) => ({
        stores: state.stores.filter((s) => s.id !== storeId),
      }));
    } catch (error) {
      console.error('Failed to remove store:', error);
      throw error;
    }
  },

  // Reorder stores
  reorderStores: async (storeIds) => {
    try {
      await storeService.reorderStores(storeIds);
      const { stores } = get();
      const reordered = storeIds.map((id) => stores.find((s) => s.id === id)!).filter(Boolean);
      set({ stores: reordered });
    } catch (error) {
      console.error('Failed to reorder stores:', error);
      throw error;
    }
  },

  // Open new tab
  openTab: (store) => {
    const { tabs } = get();

    // Check if tab already exists
    const existingTab = tabs.find((t) => t.shopUrl === store.url);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Check max tabs limit
    if (tabs.length >= MAX_TABS) {
      console.warn(`Maximum ${MAX_TABS} tabs allowed`);
      return;
    }

    const newTab: BrowserTab = {
      id: Date.now().toString(),
      shopName: store.name,
      shopUrl: store.url,
      favicon: store.logoUrl, // Use logoUrl for custom stores (logoLocal not serializable)
      currentUrl: store.url,
      scrollPosition: 0,
    };

    set({
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
    });
  },

  // NEW: Open all stores at once (no max limit for initial load)
  openAllTabs: (stores, activeIndex = 0) => {
    console.log(
      '[ShoppingBrowserStore] Opening all tabs:',
      stores.length,
      'Active index:',
      activeIndex,
    );

    const timestamp = Date.now();

    // Create tabs for all stores
    const newTabs: BrowserTab[] = stores.map((store, index) => ({
      id: `${timestamp}_${index}`,
      shopName: store.name,
      shopUrl: store.url,
      favicon: store.logoUrl, // Use logoUrl for custom stores (logoLocal not serializable)
      currentUrl: store.url,
      scrollPosition: 0,
    }));

    // Set active tab based on provided index
    const activeTabId =
      newTabs.length > 0 && activeIndex >= 0 && activeIndex < newTabs.length
        ? newTabs[activeIndex].id
        : newTabs.length > 0
          ? newTabs[0].id
          : null;

    set({
      tabs: newTabs,
      activeTabId,
    });
  },

  // Close tab
  closeTab: (tabId) => {
    set((state) => {
      const filtered = state.tabs.filter((t) => t.id !== tabId);
      const newActiveId =
        state.activeTabId === tabId
          ? filtered.length > 0
            ? filtered[filtered.length - 1].id
            : null
          : state.activeTabId;

      return {
        tabs: filtered,
        activeTabId: newActiveId,
      };
    });
  },

  // Switch active tab
  switchTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  // Update tab URL (when user navigates)
  updateTabUrl: (tabId, url) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === tabId);

    // Only update if URL actually changed
    if (tab && tab.currentUrl !== url) {
      set((state) => ({
        tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, currentUrl: url } : t)),
      }));
    }
  },

  // Update tab scroll position
  updateTabScroll: (tabId, position) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, scrollPosition: position } : t)),
    }));
  },

  // Set detected images (НЕ показываем sheet автоматически)
  setDetectedImages: (images) => {
    // Deduplicate by ID and URL
    const uniqueImages = images.reduce((acc, img) => {
      const existsById = acc.some((item) => item.id === img.id);
      const existsByUrl = acc.some((item) => item.url === img.url);
      if (!existsById && !existsByUrl) {
        acc.push(img);
      }
      return acc;
    }, [] as DetectedImage[]);

    set({ detectedImages: uniqueImages });
    // Removed auto-show: if (images.length > 0) { set({ showDetectedSheet: true }); }
  },

  // Select image for adding
  selectImage: (image) => {
    set({ selectedImage: image, showDetectedSheet: true });
  },

  // Clear detected images
  clearDetectedImages: () => {
    set({
      detectedImages: [],
      selectedImage: null,
      showDetectedSheet: false,
    });
  },

  // Show/hide detection sheet
  showDetectionSheet: (show) => {
    set({ showDetectedSheet: show });
  },

  // Scan actions
  setScanning: (scanning) => {
    const { isScanning } = get();
    if (isScanning !== scanning) {
      set({ isScanning: scanning });
    }
  },

  setHasScanned: (scanned) => {
    const { hasScanned } = get();
    if (hasScanned !== scanned) {
      set({ hasScanned: scanned });
    }
  },

  resetScanState: () => {
    const { isScanning, hasScanned, detectedImages, showGallerySheet } = get();
    // Only reset if there's something to reset (avoid unnecessary state updates)
    if (isScanning || hasScanned || detectedImages.length > 0 || showGallerySheet) {
      set({
        isScanning: false,
        hasScanned: false,
        detectedImages: [],
        showGallerySheet: false,
        selectedImageIds: new Set<string>(),
      });
    }
  },

  // NEW: Selection actions
  toggleImageSelection: (imageId) => {
    set((state) => {
      const newSet = new Set(state.selectedImageIds);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return { selectedImageIds: newSet };
    });
  },

  selectAllImages: () => {
    set((state) => ({
      selectedImageIds: new Set(state.detectedImages.map((img) => img.id)),
    }));
  },

  clearSelection: () => {
    const { selectedImageIds } = get();
    // Only clear if there's something to clear
    if (selectedImageIds.size > 0) {
      set({ selectedImageIds: new Set<string>() });
    }
  },

  // NEW: Cart actions
  addToCart: async (images, sourceUrl, sourceName) => {
    console.log('[Cart] 🛒 Adding to cart:', {
      imageCount: images.length,
      sourceUrl,
      sourceName,
      imagesWithProductUrl: images.filter((i) => i.productUrl).length,
    });
    images.forEach((img, idx) => {
      if (img.productUrl) {
        console.log(`[Cart] Image ${idx + 1} has productUrl:`, img.productUrl);
      }
    });
    const { cartItems } = get();
    const newItems: CartItem[] = images.map((image) => ({
      id: `${image.id}_${Date.now()}`,
      image,
      sourceUrl,
      sourceName,
      addedAt: Date.now(),
    }));

    const updatedCart = [...cartItems, ...newItems];
    set({ cartItems: updatedCart });

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  },

  removeFromCart: async (itemId) => {
    const { cartItems } = get();
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    set({ cartItems: updatedCart });

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  },

  clearCart: async () => {
    set({ cartItems: [] });

    // Clear AsyncStorage
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },

  loadCart: async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const cartItems = JSON.parse(stored) as CartItem[];
        set({ cartItems });
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  },

  // NEW: Gallery sheet actions
  showGallery: (show) => {
    const { showGallerySheet } = get();
    // Only update if value actually changed
    if (showGallerySheet !== show) {
      set({ showGallerySheet: show });
    }
  },

  // Batch queue actions
  startBatchUpload: (items, fromCart = false) => {
    // Mark items with fromCart flag
    const itemsWithFlag = items.map((item) => ({
      ...item,
      fromCart,
    }));

    set({
      batchQueue: itemsWithFlag,
      currentBatchIndex: 0,
      isBatchMode: items.length >= 1, // Batch mode for 1 or more items from web
    });
  },

  getNextBatchItem: () => {
    const { batchQueue, currentBatchIndex } = get();
    if (currentBatchIndex >= batchQueue.length) {
      return null;
    }
    return batchQueue[currentBatchIndex];
  },

  completeBatchItem: async (itemId) => {
    const { batchQueue, currentBatchIndex, removeFromCart } = get();

    // Remove from cart if it's a cart item
    await removeFromCart(itemId);

    // Move to next item
    const nextIndex = currentBatchIndex + 1;

    if (nextIndex >= batchQueue.length) {
      // Batch complete
      set({
        batchQueue: [],
        currentBatchIndex: 0,
        isBatchMode: false,
      });
    } else {
      // Move to next item
      set({ currentBatchIndex: nextIndex });
    }
  },

  cancelBatchUpload: () => {
    set({
      batchQueue: [],
      currentBatchIndex: 0,
      isBatchMode: false,
    });
  },

  isBatchInProgress: () => {
    const { batchQueue, currentBatchIndex } = get();
    return currentBatchIndex < batchQueue.length && batchQueue.length > 0;
  },

  // Reset all state
  reset: () => {
    set({
      tabs: [],
      activeTabId: null,
      detectedImages: [],
      selectedImage: null,
      showDetectedSheet: false,
      isScanning: false,
      hasScanned: false,
      selectedImageIds: new Set<string>(),
      showGallerySheet: false,
      // Note: не очищаем cartItems при reset, так как они должны сохраняться
    });
  },
}));
