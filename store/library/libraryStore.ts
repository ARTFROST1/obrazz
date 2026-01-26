import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type LibraryTab = 'wardrobe' | 'outfits';
export type NavigationTab = 'index' | 'library' | 'profile';

interface LibraryState {
  activeTab: LibraryTab;
  lastVisitedTab: NavigationTab;
  setActiveTab: (tab: LibraryTab) => void;
  setLastVisitedTab: (tab: NavigationTab) => void;
}

/**
 * Library Store - manages the active tab in the unified Library screen
 *
 * This store persists the user's last selected tab so they return
 * to the same view when reopening the app.
 *
 * Also tracks the last visited navigation tab for context-sensitive
 * actions (e.g., the + button behavior).
 */
export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      activeTab: 'wardrobe',
      lastVisitedTab: 'index',
      setActiveTab: (tab: LibraryTab) => set({ activeTab: tab }),
      setLastVisitedTab: (tab: NavigationTab) => set({ lastVisitedTab: tab }),
    }),
    {
      name: 'library-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
