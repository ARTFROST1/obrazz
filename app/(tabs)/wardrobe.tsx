import { DismissKeyboardView } from '@components/common/DismissKeyboardView';
import { SyncStatusIndicator } from '@components/sync';
import { FAB } from '@components/ui';
import { FilterState, ItemFilter } from '@components/wardrobe/ItemFilter';
import { ItemGrid } from '@components/wardrobe/ItemGrid';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { useNetworkStatus } from '@services/sync/networkMonitor';
import { itemServiceOffline } from '@services/wardrobe/itemServiceOffline';
import { useAuthStore } from '@store/auth/authStore';
import { useWardrobeStore } from '@store/wardrobe/wardrobeStore';
import { debounce } from '@utils/debounce';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import type { WardrobeItem } from '../../types/models';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WardrobeScreen() {
  const { t } = useTranslation('wardrobe');
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();
  const {
    items,
    filter,
    setItems,
    setFilter,
    clearFilter,
    updateItem,
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

  const handleClearFilter = () => {
    clearFilter();
    setSearchQuery('');
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems(new Set());
  };

  const handleToggleGridColumns = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    });
    setGridColumns(gridColumns === 2 ? 3 : 2);
  };

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

  return (
    <DismissKeyboardView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{t('header.title')}</Text>
              <SyncStatusIndicator size="small" style={styles.syncIndicator} />
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleToggleSelectionMode}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.selectButtonText}>
                {isSelectionMode ? t('common:actions.cancel') : t('common:actions.select')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Bar / Selection Actions */}
      <View style={styles.filterBar}>
        {isSelectionMode ? (
          // Selection Mode Actions
          <>
            <TouchableOpacity
              style={[
                styles.selectionActionButton,
                { backgroundColor: '#FFF', borderColor: '#E5E5E5' },
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
                { backgroundColor: '#FFF', borderColor: '#E5E5E5' },
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
          </>
        ) : (
          // Normal Filter Mode
          <>
            <View style={styles.filterBarLeft}>
              <TouchableOpacity
                style={[styles.filterButton, hasActiveFilters ? styles.filterButtonActive : null]}
                onPress={() => setShowFilter(true)}
              >
                <Ionicons name="filter" size={20} color={hasActiveFilters ? '#FFF' : '#000'} />
                <Text
                  style={[
                    styles.filterButtonText,
                    hasActiveFilters ? styles.filterButtonTextActive : null,
                  ]}
                >
                  {t('filter.filterButton')}
                </Text>
                {hasActiveFilters && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>•</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.filterBarCenter}>
              <Text style={styles.itemCount}>
                {filteredItems.length}{' '}
                {filteredItems.length === 1
                  ? t('header.itemCount_one')
                  : t('header.itemCount_other')}
              </Text>
            </View>

            <View style={styles.filterBarRight}>
              {hasActiveFilters ? (
                <TouchableOpacity style={styles.clearFilterButton} onPress={handleClearFilter}>
                  <Text style={styles.clearFilterText}>{t('filter.clearAll')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.gridToggleButton}
                  onPress={handleToggleGridColumns}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={gridColumns === 2 ? 'grid-outline' : 'grid'}
                    size={20}
                    color="#000"
                  />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

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

      {/* FAB - Add New Item */}
      {!isSelectionMode && (
        <FAB
          icon="add"
          onPress={handleAddItem}
          backgroundColor="#000000"
          iconColor="#FFFFFF"
          accessibilityLabel="Add new item"
        />
      )}
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  clearFilterButton: {},
  clearFilterText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContent: {
    marginHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncIndicator: {
    marginLeft: 4,
  },
  filterBadge: {
    marginLeft: 4,
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: 20,
  },
  filterBar: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBarCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBarRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  gridToggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: '#000',
  },
  filterButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  itemCount: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    color: '#000',
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  selectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 16,
  },
  selectButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
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
