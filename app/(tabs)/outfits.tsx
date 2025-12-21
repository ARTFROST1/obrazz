import { DismissKeyboardView } from '@components/common/DismissKeyboardView';
import { OutfitFilter, OutfitFilterState } from '@components/outfit';
import { OutfitEmptyState } from '@components/outfit/OutfitEmptyState';
import { OutfitGrid } from '@components/outfit/OutfitGrid';
import { OutfitHeader, OutfitHeaderMenuItem } from '@components/outfit/OutfitHeader';
import { FAB } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { outfitServiceOffline } from '@services/outfit/outfitServiceOffline';
import { useNetworkStatus } from '@services/sync';
import { useAuthStore } from '@store/auth/authStore';
import { useOutfitStore } from '@store/outfit/outfitStore';
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
import { Outfit } from '../../types/models/outfit';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Outfits Screen
 *
 * Main screen for viewing and managing saved outfits collection.
 * Features:
 * - Grid display of outfits
 * - Search functionality
 * - Filter by visibility (all/private/shared)
 * - Sort options (newest, favorite, most used)
 * - FAB for creating new outfits
 * - Pull-to-refresh
 */
export default function OutfitsScreen() {
  const { t } = useTranslation('outfit');
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
    outfits,
    setOutfits,
    deleteOutfit: removeOutfitFromStore,
    isLoading,
    setLoading,
    setError,
    isHydrated,
    setSyncStatus,
  } = useOutfitStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'private' | 'shared' | 'public'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [outfitFilters, setOutfitFilters] = useState<OutfitFilterState>({
    occasions: [],
    styles: [],
    seasons: [],
    sortBy: 'newest',
    isFavorite: undefined,
  });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOutfits, setSelectedOutfits] = useState<Set<string>>(new Set());

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
      console.log('[OutfitsScreen] LiquidGlass enable check', {
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

  // ✅ Load outfits when screen is focused (after creating/editing)
  // Uses offline-first approach: returns cached immediately, syncs in background
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      // If hydrated and have cached outfits, show them immediately
      if (isHydrated && outfits.length > 0) {
        console.log('[OutfitsScreen] Using', outfits.length, 'cached outfits');
        // Still trigger background sync if online
        if (user?.id && isOnline) {
          loadOutfits();
        }
      } else if (user?.id) {
        // No cached outfits, need to load
        console.log('[OutfitsScreen] No cached outfits, loading...');
        loadOutfits();
      }

      // Update StatusBar
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#000000', true);
        StatusBar.setTranslucent(true);
      }

      return () => {
        setIsScreenFocused(false);
      };
    }, [loadOutfits, outfits.length, user?.id, isHydrated, isOnline]),
  );

  const loadOutfits = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Don't show loading spinner if we have cached data
      if (outfits.length === 0) {
        setLoading(true);
      }
      setSyncStatus('syncing');

      // Offline-first: returns cached immediately, syncs in background
      const userOutfits = await outfitServiceOffline.getUserOutfits(user.id);
      setOutfits(userOutfits);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error loading outfits:', error);
      setSyncStatus('error');
      // Only show error if we have no cached data
      if (outfits.length === 0) {
        setError('Failed to load outfits');
        if (isOnline) {
          Alert.alert('Error', 'Failed to load your outfits');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, outfits.length, isOnline]);

  const handleRefresh = useCallback(async () => {
    if (!user?.id) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    await loadOutfits();
    setRefreshing(false);
  }, [loadOutfits, user?.id]);

  const handleOutfitPress = (outfit: Outfit) => {
    if (isSelectionMode) {
      // Toggle selection
      setSelectedOutfits((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(outfit.id)) {
          newSet.delete(outfit.id);
        } else {
          newSet.add(outfit.id);
        }
        return newSet;
      });
    } else {
      router.push(`/outfit/${outfit.id}`);
    }
  };

  const handleCreateOutfit = () => {
    router.push('/outfit/create');
  };

  const handleEditOutfit = (outfit: Outfit) => {
    router.push(`/outfit/create?id=${outfit.id}`);
  };

  const handleDuplicateOutfit = async (outfit: Outfit) => {
    if (!user?.id) return;

    try {
      Alert.alert('Duplicate Outfit', 'Create a copy of this outfit?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            try {
              setLoading(true);
              await outfitServiceOffline.duplicateOutfit(outfit.id, user.id);
              // No need to reload - store is updated automatically
            } catch (error) {
              console.error('Error duplicating outfit:', error);
              if (isOnline) {
                Alert.alert('Error', 'Failed to duplicate outfit');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error in duplicate flow:', error);
    }
  };

  const handleDeleteOutfit = (outfit: Outfit) => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${outfit.title || 'Untitled'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Offline-first: deletes locally immediately, syncs in background
              await outfitServiceOffline.deleteOutfit(outfit.id);
              // No need to call removeOutfitFromStore - service handles it
            } catch (error) {
              console.error('Error deleting outfit:', error);
              if (isOnline) {
                Alert.alert('Error', 'Failed to delete outfit');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleShareOutfit = (outfit: Outfit) => {
    // TODO: Implement share functionality in future phase
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleFavoritePress = async (outfit: Outfit) => {
    try {
      const newFavoriteStatus = !outfit.isFavorite;
      // Offline-first: updates locally immediately, syncs in background
      await outfitServiceOffline.toggleFavorite(outfit.id, newFavoriteStatus);
      // Store is updated by the service, no need to manually update
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (isOnline) {
        Alert.alert('Error', 'Failed to update favorite status');
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (filters: OutfitFilterState) => {
    setOutfitFilters(filters);
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedOutfits(new Set());
  };

  const handleSelectAll = () => {
    if (selectedOutfits.size === filteredOutfits.length) {
      setSelectedOutfits(new Set());
    } else {
      setSelectedOutfits(new Set(filteredOutfits.map((outfit) => outfit.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOutfits.size === 0) return;

    Alert.alert(
      t('detail.deleteConfirmTitle'),
      `${t('common:messages.deleteConfirm')} ${selectedOutfits.size} ${selectedOutfits.size === 1 ? t('common:general.outfit') : t('common:general.outfits')}?`,
      [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('common:actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Delete all selected outfits (offline-first)
              await Promise.all(
                Array.from(selectedOutfits).map((outfitId) =>
                  outfitServiceOffline.deleteOutfit(outfitId),
                ),
              );
              // Exit selection mode - store is already updated by service
              setIsSelectionMode(false);
              setSelectedOutfits(new Set());
            } catch (error) {
              console.error('Error deleting outfits:', error);
              if (isOnline) {
                Alert.alert('Error', 'Failed to delete some outfits');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Filter and sort outfits
  const getFilteredAndSortedOutfits = (): Outfit[] => {
    let filtered = [...outfits];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (outfit) =>
          outfit.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          outfit.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply visibility filter
    if (filterBy !== 'all') {
      filtered = filtered.filter((outfit) => outfit.visibility === filterBy);
    }

    // Apply occasion filter
    if (outfitFilters.occasions.length > 0) {
      filtered = filtered.filter((outfit) =>
        outfit.occasions?.some((o) => outfitFilters.occasions.includes(o)),
      );
    }

    // Apply style filter
    if (outfitFilters.styles.length > 0) {
      filtered = filtered.filter((outfit) =>
        outfit.styles?.some((s) => outfitFilters.styles.includes(s)),
      );
    }

    // Apply season filter
    if (outfitFilters.seasons.length > 0) {
      filtered = filtered.filter((outfit) =>
        outfit.seasons?.some((s) => outfitFilters.seasons.includes(s)),
      );
    }

    // Apply favorites filter
    if (outfitFilters.isFavorite) {
      filtered = filtered.filter((outfit) => outfit.isFavorite);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (outfitFilters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'favorites':
          if (a.isFavorite === b.isFavorite) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isFavorite ? -1 : 1;
        case 'alphabetical':
          const titleA = (a.title || 'Untitled').toLowerCase();
          const titleB = (b.title || 'Untitled').toLowerCase();
          return titleA.localeCompare(titleB);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredOutfits = getFilteredAndSortedOutfits();
  const hasActiveFilters =
    filterBy !== 'all' ||
    searchQuery.length > 0 ||
    outfitFilters.occasions.length > 0 ||
    outfitFilters.styles.length > 0 ||
    outfitFilters.seasons.length > 0 ||
    outfitFilters.isFavorite;

  // Header menu items for OutfitHeader
  const headerMenuItems: OutfitHeaderMenuItem[] = useMemo(
    () => [
      {
        id: 'select',
        icon: isSelectionMode ? 'close' : 'checkmark-circle-outline',
        label: isSelectionMode ? t('common:actions.cancel') : t('common:actions.select'),
        onPress: handleToggleSelectionMode,
      },
      {
        id: 'filter',
        icon: 'filter',
        label: t('filter.filterButton'),
        onPress: () => setShowFilterMenu(true),
        isActive: !!hasActiveFilters,
      },
    ],
    [isSelectionMode, hasActiveFilters, t, handleToggleSelectionMode],
  );

  // Calculate header padding for content (extra gap for Android custom header overlay)
  const headerContentPadding = (isSelectionMode ? 140 : 110) + (Platform.OS === 'android' ? 12 : 0);

  return (
    <DismissKeyboardView
      style={[styles.container, supportsLiquidGlass && styles.containerTransparent]}
      onLayout={() => setRootLayoutReady(true)}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Outfit Grid */}
      <OutfitGrid
        outfits={filteredOutfits}
        isLoading={isLoading}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        onOutfitPress={handleOutfitPress}
        onOutfitEdit={handleEditOutfit}
        onOutfitDelete={handleDeleteOutfit}
        onOutfitDuplicate={handleDuplicateOutfit}
        onOutfitShare={handleShareOutfit}
        onFavoritePress={handleFavoritePress}
        EmptyComponent={() => (
          <OutfitEmptyState
            onCreatePress={handleCreateOutfit}
            title={t('empty.title')}
            message={t('empty.subtitle')}
            ctaText={t('empty.createFirst')}
          />
        )}
        isSelectable={isSelectionMode}
        selectedOutfits={selectedOutfits}
        contentContainerStyle={{ paddingTop: headerContentPadding }}
      />

      {/* FAB - Create New Outfit (iOS 26 Liquid Glass on supported devices) */}
      {!isSelectionMode && (
        <FAB
          icon="add"
          onPress={handleCreateOutfit}
          accessibilityLabel="Create new outfit"
          liquidGlassEnabled={supportsLiquidGlass}
        />
      )}

      {/* Unified Header - Automatically uses Glass on iOS 26+, custom components otherwise */}
      <OutfitHeader
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder={t('header.searchPlaceholder')}
        menuItems={headerMenuItems}
        liquidGlassEnabled={supportsLiquidGlass}
      />

      {/* Selection Mode Actions (shown below header) */}
      {isSelectionMode && (
        <View style={[styles.glassSelectionBar, { marginTop: insets.top + 68 }]}>
          <TouchableOpacity
            style={[
              styles.selectionActionButton,
              { backgroundColor: 'rgba(44,44,46,0.92)', borderColor: '#3A3A3C' },
            ]}
            onPress={handleSelectAll}
          >
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            <Text style={styles.selectionActionText}>
              {selectedOutfits.size === filteredOutfits.length
                ? t('common:actions.deselectAll')
                : t('common:actions.selectAll')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.selectionActionButton,
              styles.deleteActionButton,
              { backgroundColor: 'rgba(44,44,46,0.92)', borderColor: '#3A3A3C' },
              selectedOutfits.size === 0 && styles.disabledButton,
            ]}
            onPress={handleDeleteSelected}
            disabled={selectedOutfits.size === 0}
          >
            <Ionicons
              name="trash"
              size={20}
              color={selectedOutfits.size === 0 ? '#636366' : '#FF453A'}
            />
            <Text
              style={[styles.deleteActionText, selectedOutfits.size === 0 && styles.disabledText]}
            >
              {t('common:actions.delete')} ({selectedOutfits.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Outfit Filter Modal */}
      <OutfitFilter
        visible={showFilterMenu}
        onClose={() => setShowFilterMenu(false)}
        onApply={handleApplyFilters}
        initialFilters={outfitFilters}
      />
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  containerTransparent: {
    backgroundColor: '#000',
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
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  deleteActionButton: {
    // Specific styles for delete button
  },
  deleteActionText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#636366',
  },
});
