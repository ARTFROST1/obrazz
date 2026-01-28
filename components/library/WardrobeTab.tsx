import type { WardrobeItem } from '@/types/models';
import { DismissKeyboardView } from '@components/common/DismissKeyboardView';
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
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WardrobeTabProps {
  isActive: boolean;
  liquidGlassEnabled?: boolean;
  headerOffset?: number; // Extra offset for segment control
  style?: ViewStyle;
}

/**
 * WardrobeTab - Content component for the wardrobe section of Library screen
 *
 * This is extracted from the original wardrobe.tsx to be used within
 * the unified Library screen with tab switching.
 */
export const WardrobeTab: React.FC<WardrobeTabProps> = ({
  isActive,
  liquidGlassEnabled = true,
  headerOffset = 0,
  style,
}) => {
  const { t } = useTranslation('wardrobe');
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  const isIOS26 = IS_IOS_26_OR_NEWER;
  const canUseLiquidGlass = CAN_USE_LIQUID_GLASS;
  const [rootLayoutReady, setRootLayoutReady] = useState(false);
  const [useLiquidGlassUI, setUseLiquidGlassUI] = useState(false);
  const supportsLiquidGlass = canUseLiquidGlass && useLiquidGlassUI && liquidGlassEnabled;

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

  // Enable Liquid Glass only after ready
  useEffect(() => {
    if (!canUseLiquidGlass) {
      setUseLiquidGlassUI(false);
      return;
    }

    if (useLiquidGlassUI) return;

    if (!isActive || !rootLayoutReady) return;

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
  }, [canUseLiquidGlass, isIOS26, isActive, rootLayoutReady, useLiquidGlassUI]);

  // Offline-first load
  const loadItems = useCallback(async () => {
    if (!user?.id) return;

    try {
      setSyncStatus('syncing');
      const userItems = await itemServiceOffline.getUserItems(user.id);

      if (userItems.length > 0) {
        setItems(userItems);
      }

      setError(null);
      setSyncStatus(isOnline ? 'synced' : 'offline');
    } catch (error) {
      console.error('[WardrobeTab] Error loading items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load items';
      setError(errorMessage);
      setSyncStatus('error');

      if (isOnline) {
        Alert.alert('Error', 'Failed to load your wardrobe items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, setLoading, setItems, setError, setSyncStatus, isOnline]);

  // Load items when tab becomes active
  useFocusEffect(
    useCallback(() => {
      if (!isActive) return;

      if (isHydrated && items.length > 0) {
        if (user?.id && isOnline) {
          loadItems();
        }
      } else if (user?.id) {
        loadItems();
      }
    }, [loadItems, items.length, user?.id, isHydrated, isOnline, isActive]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const handleItemPress = (item: WardrobeItem) => {
    if (isSelectionMode) {
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
      await itemServiceOffline.toggleFavorite(item.id, newFavoriteStatus, user?.id || '');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (isOnline) {
        Alert.alert('Error', 'Failed to update favorite status');
      }
    }
  };

  const handleItemEdit = useCallback((item: WardrobeItem) => {
    router.push(`/item/${item.id}`);
  }, []);

  const handleItemDelete = useCallback(
    async (item: WardrobeItem) => {
      if (!user?.id) return;

      Alert.alert(t('common:actions.delete'), t('common:messages.deleteConfirm'), [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('common:actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              removeItemLocally(item.id);
              await itemServiceOffline.deleteItem(item.id, user.id);
            } catch (error) {
              console.error('Error deleting item:', error);
              if (isOnline) {
                Alert.alert('Error', 'Failed to delete item');
              }
              loadItems();
            }
          },
        },
      ]);
    },
    [user?.id, t, removeItemLocally, isOnline, loadItems],
  );

  const handleItemHide = useCallback((_item: WardrobeItem) => {
    Alert.alert('Hide', 'Hide functionality coming soon!');
  }, []);

  // Debounced filter update for search
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

  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedItems(new Set());
  }, []);

  const handleToggleGridColumns = useCallback(() => {
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
            const itemIdsToDelete = Array.from(selectedItems);

            try {
              setLoading(true);

              selectedItemsList.forEach((item) => {
                removeItemLocally(item.id);
              });

              setSelectedItems(new Set());
              setIsSelectionMode(false);

              const results = await Promise.allSettled(
                selectedItemsList.map((item) => itemServiceOffline.deleteItem(item.id, user.id)),
              );

              const failed = results.filter((r) => r.status === 'rejected');
              if (failed.length > 0 && isOnline) {
                throw new Error(`Failed to delete ${failed.length} items`);
              }
            } catch (error) {
              console.error('[WardrobeTab] Error deleting items:', error);
              Alert.alert('Error', `Failed to delete some items. Restoring...`, [
                {
                  text: 'OK',
                  onPress: async () => {
                    await loadItems();
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

  const filteredItems = useMemo(() => {
    return getFilteredItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFilteredItems]);

  const hasActiveFilters =
    filter.categories?.length ||
    filter.colors?.length ||
    filter.styles?.length ||
    filter.seasons?.length ||
    filter.isFavorite ||
    filter.searchQuery;

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

  // Calculate header padding (includes segment control offset)
  const headerContentPadding =
    (isSelectionMode ? 140 : 110) + headerOffset + (Platform.OS === 'android' ? 12 : 0);

  return (
    <DismissKeyboardView
      style={[styles.container, supportsLiquidGlass && styles.containerTransparent, style]}
      onLayout={() => setRootLayoutReady(true)}
    >
      {/* Items Grid */}
      <ItemGrid
        items={filteredItems}
        onItemPress={handleItemPress}
        onFavoritePress={handleFavoritePress}
        onItemEdit={handleItemEdit}
        onItemDelete={handleItemDelete}
        onItemHide={handleItemHide}
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

      {/* Header - absolute positioned */}
      <WardrobeHeader
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder={t('search.placeholder')}
        menuItems={headerMenuItems}
        liquidGlassEnabled={supportsLiquidGlass}
      />

      {/* Selection Mode Actions */}
      {isSelectionMode && (
        <View style={[styles.glassSelectionBar, { marginTop: insets.top + 68 + headerOffset }]}>
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
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  containerTransparent: {
    backgroundColor: 'transparent',
  },
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
  deleteActionButton: {},
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
