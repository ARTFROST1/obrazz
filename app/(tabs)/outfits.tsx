import { DismissKeyboardView } from '@components/common/DismissKeyboardView';
import { OutfitFilter, OutfitFilterState } from '@components/outfit';
import { OutfitEmptyState } from '@components/outfit/OutfitEmptyState';
import { OutfitGrid } from '@components/outfit/OutfitGrid';
import { SyncStatusIndicator } from '@components/sync';
import { FAB } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { outfitServiceOffline } from '@services/outfit/outfitServiceOffline';
import { useNetworkStatus } from '@services/sync';
import { useAuthStore } from '@store/auth/authStore';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Outfit } from '../../types/models/outfit';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
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

  const { isOnline } = useNetworkStatus();

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

  // ✅ Load outfits when screen is focused (after creating/editing)
  // Uses offline-first approach: returns cached immediately, syncs in background
  useFocusEffect(
    useCallback(() => {
      // Only load after store is hydrated to avoid overwriting cache
      if (isHydrated) {
        loadOutfits();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHydrated]),
  );

  // Update StatusBar when screen is focused or theme changes
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent', true);
        StatusBar.setTranslucent(true);
      }
    }, [isDark]),
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

  return (
    <DismissKeyboardView
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />
      {/* Header */}
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.header}>
          <View
            style={[styles.headerContent, { borderBottomColor: isDark ? '#38383A' : '#E5E5E5' }]}
          >
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {t('header.title')}
              </Text>
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
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8' }]}>
        <Ionicons name="search" size={20} color={isDark ? '#8E8E93' : '#666666'} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
          placeholder={t('header.searchPlaceholder')}
          placeholderTextColor={isDark ? '#8E8E93' : '#C4C4C4'}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={isDark ? '#8E8E93' : '#666666'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips / Selection Actions */}
      <View style={styles.filterContainer}>
        {isSelectionMode ? (
          // Selection Mode Actions
          <>
            <TouchableOpacity
              style={[
                styles.selectionActionButton,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#FFF',
                  borderColor: isDark ? '#38383A' : '#E5E5E5',
                },
              ]}
              onPress={handleSelectAll}
            >
              <Ionicons name="checkmark-done" size={20} color={isDark ? '#FFFFFF' : '#000'} />
              <Text style={[styles.selectionActionText, { color: isDark ? '#FFFFFF' : '#000' }]}>
                {selectedOutfits.size === filteredOutfits.length
                  ? t('common:actions.deselectAll')
                  : t('common:actions.selectAll')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.selectionActionButton,
                styles.deleteActionButton,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#FFF',
                  borderColor: isDark ? '#38383A' : '#E5E5E5',
                },
                selectedOutfits.size === 0 && styles.disabledButton,
              ]}
              onPress={handleDeleteSelected}
              disabled={selectedOutfits.size === 0}
            >
              <Ionicons
                name="trash"
                size={20}
                color={selectedOutfits.size === 0 ? '#CCC' : '#FF3B30'}
              />
              <Text
                style={[styles.deleteActionText, selectedOutfits.size === 0 && styles.disabledText]}
              >
                {t('common:actions.delete')} ({selectedOutfits.size})
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Normal Filter Mode
          <>
            <View style={styles.filterBarLeft}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  hasActiveFilters
                    ? styles.filterButtonActive
                    : { backgroundColor: isDark ? '#2C2C2E' : '#F8F8F8' },
                  { borderWidth: 1, borderColor: isDark ? '#48484A' : '#D1D1D1' },
                ]}
                onPress={() => setShowFilterMenu(true)}
              >
                <Ionicons
                  name="filter"
                  size={20}
                  color={hasActiveFilters ? '#FFF' : isDark ? '#FFFFFF' : '#000'}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    hasActiveFilters ? styles.filterButtonTextActive : null,
                    { color: hasActiveFilters ? '#FFF' : isDark ? '#FFFFFF' : '#000' },
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

            {hasActiveFilters ? (
              <View style={styles.filterBarCenter}>
                <Text style={[styles.itemCount, { color: isDark ? '#FFFFFF' : '#000' }]}>
                  {filteredOutfits.length}{' '}
                  {filteredOutfits.length === 1
                    ? t('header.outfitCount_one')
                    : t('header.outfitCount_other')}
                </Text>
              </View>
            ) : null}

            <View style={styles.filterBarRight}>
              {hasActiveFilters ? (
                <TouchableOpacity
                  style={[
                    styles.clearFilterButton,
                    {
                      borderWidth: 1,
                      borderColor: isDark ? '#48484A' : '#D1D1D1',
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    },
                  ]}
                  onPress={() => {
                    setFilterBy('all');
                    setOutfitFilters({
                      occasions: [],
                      styles: [],
                      seasons: [],
                      isFavorite: undefined,
                      sortBy: 'newest',
                    });
                  }}
                >
                  <Text style={[styles.clearFilterText, { color: isDark ? '#FFFFFF' : '#000' }]}>
                    {t('filter.clearAll')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.itemCount, { color: isDark ? '#FFFFFF' : '#000' }]}>
                  {filteredOutfits.length}{' '}
                  {filteredOutfits.length === 1
                    ? t('header.outfitCount_one')
                    : t('header.outfitCount_other')}
                </Text>
              )}
            </View>
          </>
        )}
      </View>

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
      />

      {/* FAB - Create New Outfit (iOS 26 Liquid Glass on supported devices) */}
      {!isSelectionMode && (
        <FAB icon="add" onPress={handleCreateOutfit} accessibilityLabel="Create new outfit" />
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
    flex: 1,
  },
  safeArea: {
    // backgroundColor set dynamically
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContent: {
    marginHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderBottomColor set dynamically
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    // color set dynamically
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncIndicator: {
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  filterBarCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBarRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  filterBadge: {
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 16,
    color: '#FFF',
  },
  itemCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  filterChipActive: {
    // Active style applied via backgroundColor in component
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 4,
    marginLeft: 'auto',
  },
  filterButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterButtonRightText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 13,
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
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
