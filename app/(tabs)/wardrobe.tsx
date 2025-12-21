import { DismissKeyboardView } from '@components/common/DismissKeyboardView';
import { FAB } from '@components/ui';
import { FilterState, ItemFilter } from '@components/wardrobe/ItemFilter';
import { ItemGrid } from '@components/wardrobe/ItemGrid';
import { WardrobeHeader, WardrobeHeaderMenuItem } from '@components/wardrobe/WardrobeHeader';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { useNetworkStatus } from '@services/sync/networkMonitor';
import { itemServiceOffline } from '@services/wardrobe/itemServiceOffline';
import { useAuthStore } from '@store/auth/authStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { debounce } from '@utils/debounce';
import { CAN_USE_LIQUID_GLASS, IS_IOS_26_OR_NEWER } from '@utils/platform';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  InteractionManager,
  LayoutAnimation,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WardrobeItem } from '../../types/models';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WardrobeScreen() {
  const { t } = useTranslation('wardrobe');
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  // Shared platform detection (computed once per JS bundle load)
  const isIOS26 = IS_IOS_26_OR_NEWER;
  const canUseLiquidGlass = CAN_USE_LIQUID_GLASS;
  const [rootLayoutReady, setRootLayoutReady] = useState(false);
  const [useLiquidGlassUI, setUseLiquidGlassUI] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const supportsLiquidGlass = canUseLiquidGlass && useLiquidGlassUI;

  const {
    items,
    filter,
    setItems,
    setFilter,
    getFilteredItems,
    isLoading,
    setLoading,
    setError,
    removeItemLocally,
    isHydrated,
    setSyncStatus,
  } = useWardrobeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [gridColumns, setGridColumns] = useState<2 | 3>(3);

  // Enable Liquid Glass only after the screen is focused AND navigation/animations are done.
  // This matches the observed behavior: glass effect becomes correct after leaving/returning.
  useEffect(() => {
    if (!canUseLiquidGlass) {
      setUseLiquidGlassUI(false);
      return;
    }

    // Once enabled, keep it enabled (do not re-run the init on every focus).
    if (useLiquidGlassUI) return;

    if (!isScreenFocused || !rootLayoutReady) return;

    if (__DEV__) {
      console.log('[WardrobeScreen] LiquidGlass enable check', {
        isIOS26,
        available: canUseLiquidGlass,
        rootLayoutReady,
        isScreenFocused,
      });
    }

    let cancelled = false;
    let raf1: number | null = null;
    let raf2: number | null = null;

    const interactionTask = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (cancelled) return;
          LayoutAnimation.configureNext({
            duration: 250,
            create: {
              type: LayoutAnimation.Types.easeInEaseOut,
              property: LayoutAnimation.Properties.opacity,
            },
            update: { type: LayoutAnimation.Types.easeInEaseOut },
          });
          setUseLiquidGlassUI(true);
        });
      });
    });

    return () => {
      cancelled = true;
      interactionTask.cancel();
      if (raf1 != null) cancelAnimationFrame(raf1);
      if (raf2 != null) cancelAnimationFrame(raf2);
    };
  }, [canUseLiquidGlass, isIOS26, isScreenFocused, rootLayoutReady, useLiquidGlassUI]);

  // Offline-first load: use cached items immediately, sync in background
  const loadItems = useCallback(async () => {
    if (!user?.id) {
      console.log('[WardrobeScreen] No user ID, skipping load');
      return;
    }

    try {
      console.log('[WardrobeScreen] Loading items (offline-first) for user:', user.id);
      setSyncStatus('syncing');

      // This returns cached items immediately and syncs in background
      const userItems = await itemServiceOffline.getUserItems(user.id);
      console.log('[WardrobeScreen] Got', userItems.length, 'items (from cache/server)');

      // Only update if we got items from server sync
      // The store already has cached items from hydration
      if (userItems.length > 0) {
        setItems(userItems);
      }

      setError(null);
      setSyncStatus(isOnline ? 'synced' : 'offline');
    } catch (error) {
      console.error('[WardrobeScreen] Error loading items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load items';
      setError(errorMessage);
      setSyncStatus('error');

      // Don't show alert if offline - user can still see cached items
      if (isOnline) {
        Alert.alert('Error', 'Failed to load your wardrobe items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, setLoading, setItems, setError, setSyncStatus, isOnline]);

  // Load items when screen is focused
  // Now uses offline-first approach: show cached immediately, sync in background
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      // If hydrated and have cached items, show them immediately
      if (isHydrated && items.length > 0) {
        console.log('[WardrobeScreen] Using', items.length, 'cached items');
        // Still trigger background sync if online
        if (user?.id && isOnline) {
          loadItems();
        }
      } else if (user?.id) {
        // No cached items, need to load
        console.log('[WardrobeScreen] No cached items, loading...');
        loadItems();
      }

      // Update StatusBar
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent', true);
        StatusBar.setTranslucent(true);
      }

      return () => {
        setIsScreenFocused(false);
      };
    }, [loadItems, items.length, user?.id, isHydrated, isOnline]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const handleItemPress = (item: WardrobeItem) => {
    if (isSelectionMode) {
      // Toggle selection
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      router.push(`/item/${item.id}`);
    }
  };

  const handleFavoritePress = async (item: WardrobeItem) => {
    try {
      const newFavoriteStatus = !item.isFavorite;
      // Use offline-first service - updates locally immediately, syncs in background
      await itemServiceOffline.toggleFavorite(item.id, newFavoriteStatus, user?.id || '');
      // Local update is already done by the service
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Don't show error if offline - change will sync later
      if (isOnline) {
        Alert.alert('Error', 'Failed to update favorite status');
      }
    }
  };

  const handleAddItem = () => {
    router.push('/add-item');
  };

  // Debounced filter update for search (300ms delay)
  const debouncedSetFilter = useMemo(
    () =>
      debounce((query: string) => {
        setFilter({ searchQuery: query || undefined });
      }, 300),
    [setFilter],
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSetFilter(query);
  };

  const handleApplyFilter = (filters: FilterState) => {
    setFilter({
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      colors: filters.colors.length > 0 ? filters.colors : undefined,
      styles: filters.styles.length > 0 ? filters.styles : undefined,
      seasons: filters.seasons.length > 0 ? filters.seasons : undefined,
      isFavorite: filters.isFavorite,
    });
  };

  // Clear filter helper (not currently used)
  // const handleClearFilter = () => {
  //   clearFilter();
  //   setSearchQuery('');
  // };

  const handleToggleSelectionMode = React.useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedItems(new Set());
  }, []);

  const handleToggleGridColumns = React.useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    });
    setGridColumns(gridColumns === 2 ? 3 : 2);
  }, [gridColumns]);

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0 || !user?.id) return;

    const selectedItemsList = items.filter((item) => selectedItems.has(item.id));
    const count = selectedItemsList.length;

    // Single confirmation alert
    console.log('[WardrobeScreen] Showing delete confirmation');
    Alert.alert(
      t('selection.deleteItems'),
      t('selection.deleteConfirmMessage', {
        count,
        plural: count === 1 ? t('selection.item') : t('selection.items'),
      }),
      [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('common:actions.delete'),
          style: 'destructive',
          onPress: async () => {
            console.log(
              '[WardrobeScreen] Deletion confirmed, starting deletion of',
              count,
              'items',
            );
            console.log('[WardrobeScreen] Items to delete:', Array.from(selectedItems));

            // Save selection state for error recovery
            const itemIdsToDelete = Array.from(selectedItems);

            try {
              setLoading(true);

              // STEP 1: Optimistically remove from UI (instant feedback)
              console.log('[WardrobeScreen] Optimistically removing items from store');
              selectedItemsList.forEach((item) => {
                removeItemLocally(item.id);
              });

              // STEP 2: Clear selection state immediately
              console.log('[WardrobeScreen] Clearing selection state');
              setSelectedItems(new Set());
              setIsSelectionMode(false);

              // STEP 3: Delete from database in background (using offline-first service)
              console.log('[WardrobeScreen] Deleting items (offline-first)...');
              const results = await Promise.allSettled(
                selectedItemsList.map((item) => itemServiceOffline.deleteItem(item.id, user.id)),
              );

              // Check for failures (only relevant if online)
              const failed = results.filter((r) => r.status === 'rejected');
              if (failed.length > 0 && isOnline) {
                console.error('[WardrobeScreen] Some deletions failed:', failed.length);
                throw new Error(`Failed to delete ${failed.length} items`);
              }

              console.log('[WardrobeScreen] Database deletion completed successfully');
              console.log('[WardrobeScreen] UI already updated optimistically, no reload needed');
            } catch (error) {
              console.error('[WardrobeScreen] Error deleting items:', error);
              Alert.alert('Error', `Failed to delete some items. Restoring...`, [
                {
                  text: 'OK',
                  onPress: async () => {
                    // Reload to restore correct state
                    await loadItems();
                    // Restore selection mode
                    setIsSelectionMode(true);
                    setSelectedItems(new Set(itemIdsToDelete));
                  },
                },
              ]);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Memoize filtered items to prevent expensive recalculation on every render
  // IMPORTANT: Must depend on items directly, not getFilteredItems function
  const filteredItems = useMemo(() => {
    console.log('[WardrobeScreen] Recalculating filteredItems, current items count:', items.length);
    return getFilteredItems();
  }, [items, getFilteredItems]); // ✅ Depend on items, getFilteredItems already includes filter

  const hasActiveFilters =
    filter.categories?.length ||
    filter.colors?.length ||
    filter.styles?.length ||
    filter.seasons?.length ||
    filter.isFavorite ||
    filter.searchQuery;

  // Dropdown menu items for header
  const headerMenuItems: WardrobeHeaderMenuItem[] = useMemo(
    () => [
      {
        id: 'select',
        icon: isSelectionMode ? 'close-circle-outline' : 'checkmark-circle-outline',
        label: isSelectionMode ? t('common:actions.cancel') : t('common:actions.select'),
        onPress: handleToggleSelectionMode,
      },
      {
        id: 'filter',
        icon: 'filter',
        label: t('filter.filterButton'),
        onPress: () => setShowFilter(true),
        isActive: !!hasActiveFilters,
      },
      {
        id: 'grid',
        icon: gridColumns === 2 ? 'grid-outline' : 'grid',
        label: gridColumns === 2 ? t('filter.threeColumns') : t('filter.twoColumns'),
        onPress: handleToggleGridColumns,
      },
    ],
    [
      isSelectionMode,
      hasActiveFilters,
      gridColumns,
      t,
      handleToggleSelectionMode,
      handleToggleGridColumns,
    ],
  );

  // Calculate header padding for content (extra gap for Android custom header overlay)
  const headerContentPadding = (isSelectionMode ? 140 : 110) + (Platform.OS === 'android' ? 12 : 0);

  return (
    <DismissKeyboardView
      style={[styles.container, supportsLiquidGlass && styles.containerTransparent]}
      onLayout={() => setRootLayoutReady(true)}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* Items Grid */}
      <ItemGrid
        items={filteredItems}
        onItemPress={handleItemPress}
        onFavoritePress={handleFavoritePress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        loading={isLoading}
        emptyMessage={
          hasActiveFilters ? 'No items match your filters' : 'Add your first item to get started!'
        }
        isSelectable={isSelectionMode}
        selectedItems={selectedItems}
        numColumns={gridColumns}
        contentContainerStyle={{ paddingTop: headerContentPadding }}
      />

      {/* Filter Modal */}
      <ItemFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilter}
        initialFilters={{
          categories: filter.categories || [],
          colors: filter.colors || [],
          styles: filter.styles || [],
          seasons: filter.seasons || [],
          isFavorite: filter.isFavorite,
        }}
      />

      {/* FAB - Add New Item (iOS 26 Liquid Glass on supported devices) */}
      {!isSelectionMode && (
        <FAB
          icon="add"
          onPress={handleAddItem}
          accessibilityLabel="Add new item"
          liquidGlassEnabled={supportsLiquidGlass}
        />
      )}

      {/* Unified Header - Automatically uses Glass on iOS 26+, custom components otherwise */}
      <WardrobeHeader
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder={t('search.placeholder')}
        menuItems={headerMenuItems}
        liquidGlassEnabled={supportsLiquidGlass}
      />

      {/* Selection Mode Actions (shown below header) */}
      {isSelectionMode && (
        <View style={[styles.glassSelectionBar, { marginTop: insets.top + 68 }]}>
          <TouchableOpacity
            style={[
              styles.selectionActionButton,
              { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#E5E5E5' },
            ]}
            onPress={handleSelectAll}
          >
            <Ionicons name="checkmark-done" size={20} color="#000" />
            <Text style={styles.selectionActionText}>
              {selectedItems.size === filteredItems.length
                ? t('selection.deselectAll')
                : t('selection.selectAll')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.selectionActionButton,
              styles.deleteActionButton,
              { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#E5E5E5' },
              selectedItems.size === 0 && styles.disabledButton,
            ]}
            onPress={handleDeleteSelected}
            disabled={selectedItems.size === 0}
          >
            <Ionicons
              name="trash"
              size={20}
              color={selectedItems.size === 0 ? '#CCC' : '#FF3B30'}
            />
            <Text
              style={[styles.deleteActionText, selectedItems.size === 0 && styles.disabledText]}
            >
              {t('common:actions.delete')} ({selectedItems.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  containerTransparent: {
    backgroundColor: 'transparent',
  },
  // Selection bar (shown below header when in selection mode)
  glassSelectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  selectionActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  selectionActionText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '500',
  },
  deleteActionButton: {
    // Specific styles for delete button
  },
  deleteActionText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#CCC',
  },
});
