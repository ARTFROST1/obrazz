import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useOutfitStore } from '@store/outfit/outfitStore';
import { useAuthStore } from '@store/auth/authStore';
import { outfitService } from '@services/outfit/outfitService';
import { OutfitGrid } from '@components/outfit/OutfitGrid';
import { OutfitEmptyState } from '@components/outfit/OutfitEmptyState';
import { OutfitFilter, OutfitFilterState } from '@components/outfit';
import { FAB } from '@components/ui';
import { Outfit } from '../../types/models/outfit';
import { OccasionTag } from '../../types/models/outfit';
import { Season, StyleTag } from '../../types/models/user';

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
  } = useOutfitStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'private' | 'shared' | 'public'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<Set<string>>(new Set());
  const [outfitFilters, setOutfitFilters] = useState<OutfitFilterState>({
    occasions: [],
    styles: [],
    seasons: [],
    sortBy: 'newest',
    isFavorite: undefined,
  });

  // ✅ Load outfits when screen is focused (after creating/editing)
  useFocusEffect(
    useCallback(() => {
      loadOutfits();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Update StatusBar when screen is focused or theme changes
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(isDark ? '#000000' : '#FFFFFF', true);
      }
    }, [isDark]),
  );

  const loadOutfits = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userOutfits = await outfitService.getUserOutfits(user.id);
      setOutfits(userOutfits);
    } catch (error) {
      console.error('Error loading outfits:', error);
      setError('Failed to load outfits');
      Alert.alert('Error', 'Failed to load your outfits');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOutfits();
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOutfitPress = (outfit: Outfit) => {
    if (isSelectionMode) {
      // Toggle selection
      setSelectedOutfitIds((prev) => {
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
              await outfitService.duplicateOutfit(outfit.id, user.id);
              await loadOutfits();
              Alert.alert('Success', 'Outfit duplicated successfully');
            } catch (error) {
              console.error('Error duplicating outfit:', error);
              Alert.alert('Error', 'Failed to duplicate outfit');
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
              await outfitService.deleteOutfit(outfit.id);
              removeOutfitFromStore(outfit.id);
              // No success alert - silent deletion
            } catch (error) {
              console.error('Error deleting outfit:', error);
              Alert.alert('Error', 'Failed to delete outfit');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedOutfitIds(new Set()); // Clear selection when toggling
  };

  const handleDeleteSelected = async () => {
    if (selectedOutfitIds.size === 0) return;

    Alert.alert(
      'Delete Outfits',
      `Are you sure you want to delete ${selectedOutfitIds.size} ${selectedOutfitIds.size === 1 ? 'outfit' : 'outfits'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Delete outfits one by one
              const deletePromises = Array.from(selectedOutfitIds).map((outfitId) =>
                outfitService.deleteOutfit(outfitId),
              );
              await Promise.all(deletePromises);
              // Reload outfits
              await loadOutfits();
              // Exit selection mode
              setIsSelectionMode(false);
              setSelectedOutfitIds(new Set());
              // No success alert - silent deletion
            } catch (error) {
              console.error('Error deleting outfits:', error);
              Alert.alert('Error', 'Failed to delete some outfits');
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
      await outfitService.toggleFavorite(outfit.id, newFavoriteStatus);
      // Update local state
      const updatedOutfits = outfits.map((o) =>
        o.id === outfit.id ? { ...o, isFavorite: newFavoriteStatus } : o,
      );
      setOutfits(updatedOutfits);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: typeof filterBy) => {
    setFilterBy(filter);
  };

  const handleApplyFilters = (filters: OutfitFilterState) => {
    setOutfitFilters(filters);
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
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#000000' : '#FFFFFF'}
        translucent={false}
        animated={true}
      />
      {/* Header */}
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.header}>
          <View
            style={[styles.headerContent, { borderBottomColor: isDark ? '#38383A' : '#E5E5E5' }]}
          >
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              My Outfits
            </Text>
            {!isSelectionMode ? (
              <TouchableOpacity onPress={handleToggleSelectionMode} style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Select</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleToggleSelectionMode} style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Selection Actions Bar */}
      {isSelectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8' }]}>
          <TouchableOpacity
            onPress={() => {
              // Select all
              const allIds = new Set(filteredOutfits.map((outfit) => outfit.id));
              setSelectedOutfitIds(allIds);
            }}
            style={styles.selectAllButton}
          >
            <Text style={[styles.selectAllButtonText, { color: '#007AFF' }]}>Select All</Text>
          </TouchableOpacity>
          <Text style={[styles.selectedCount, { color: isDark ? '#8E8E93' : '#666666' }]}>
            {selectedOutfitIds.size} {selectedOutfitIds.size === 1 ? 'outfit' : 'outfits'} selected
          </Text>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            disabled={selectedOutfitIds.size === 0}
            style={[
              styles.deleteButton,
              selectedOutfitIds.size === 0 && styles.deleteButtonDisabled,
            ]}
          >
            <Ionicons name="trash-outline" size={20} color="#FFF" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      {!isSelectionMode && (
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8' }]}>
          <Ionicons name="search" size={20} color={isDark ? '#8E8E93' : '#666666'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
            placeholder="Search outfits..."
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
      )}

      {/* Filter Chips */}
      {!isSelectionMode && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              filterBy === 'all' && styles.filterChipActive,
              {
                backgroundColor:
                  filterBy === 'all'
                    ? isDark
                      ? '#FFFFFF'
                      : '#000000'
                    : isDark
                      ? '#2C2C2E'
                      : '#F8F8F8',
              },
            ]}
            onPress={() => handleFilterChange('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    filterBy === 'all'
                      ? isDark
                        ? '#000000'
                        : '#FFFFFF'
                      : isDark
                        ? '#FFFFFF'
                        : '#000000',
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterBy === 'private' && styles.filterChipActive,
              {
                backgroundColor:
                  filterBy === 'private'
                    ? isDark
                      ? '#FFFFFF'
                      : '#000000'
                    : isDark
                      ? '#2C2C2E'
                      : '#F8F8F8',
              },
            ]}
            onPress={() => handleFilterChange('private')}
          >
            <Ionicons
              name="lock-closed"
              size={14}
              color={
                filterBy === 'private'
                  ? isDark
                    ? '#000000'
                    : '#FFFFFF'
                  : isDark
                    ? '#FFFFFF'
                    : '#000000'
              }
            />
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    filterBy === 'private'
                      ? isDark
                        ? '#000000'
                        : '#FFFFFF'
                      : isDark
                        ? '#FFFFFF'
                        : '#000000',
                },
              ]}
            >
              Private
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterBy === 'shared' && styles.filterChipActive,
              {
                backgroundColor:
                  filterBy === 'shared'
                    ? isDark
                      ? '#FFFFFF'
                      : '#000000'
                    : isDark
                      ? '#2C2C2E'
                      : '#F8F8F8',
              },
            ]}
            onPress={() => handleFilterChange('shared')}
          >
            <Ionicons
              name="people"
              size={14}
              color={
                filterBy === 'shared'
                  ? isDark
                    ? '#000000'
                    : '#FFFFFF'
                  : isDark
                    ? '#FFFFFF'
                    : '#000000'
              }
            />
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    filterBy === 'shared'
                      ? isDark
                        ? '#000000'
                        : '#FFFFFF'
                      : isDark
                        ? '#FFFFFF'
                        : '#000000',
                },
              ]}
            >
              Shared
            </Text>
          </TouchableOpacity>

          {/* Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterButtonRight,
              { backgroundColor: isDark ? '#2C2C2E' : '#F8F8F8' },
              hasActiveFilters && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilterMenu(true)}
          >
            <Ionicons
              name="filter"
              size={16}
              color={hasActiveFilters ? '#FFF' : isDark ? '#FFFFFF' : '#000000'}
            />
            <Text
              style={[
                styles.filterButtonRightText,
                { color: hasActiveFilters ? '#FFF' : isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              Filter
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsText, { color: isDark ? '#8E8E93' : '#666666' }]}>
            {filteredOutfits.length} {filteredOutfits.length === 1 ? 'outfit' : 'outfits'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setFilterBy('all');
              setOutfitFilters({
                occasions: [],
                styles: [],
                seasons: [],
                sortBy: 'newest',
                isFavorite: undefined,
              });
            }}
          >
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Outfit Grid */}
      <OutfitGrid
        outfits={filteredOutfits}
        isLoading={isLoading}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        onOutfitPress={handleOutfitPress}
        onOutfitEdit={!isSelectionMode ? handleEditOutfit : undefined}
        onOutfitDelete={!isSelectionMode ? handleDeleteOutfit : undefined}
        onOutfitDuplicate={!isSelectionMode ? handleDuplicateOutfit : undefined}
        onOutfitShare={!isSelectionMode ? handleShareOutfit : undefined}
        onFavoritePress={!isSelectionMode ? handleFavoritePress : undefined}
        EmptyComponent={() => <OutfitEmptyState onCreatePress={handleCreateOutfit} />}
        isSelectable={isSelectionMode}
        selectedOutfitIds={selectedOutfitIds}
      />

      {/* FAB - Create New Outfit */}
      {!isSelectionMode && (
        <FAB
          icon="add"
          onPress={handleCreateOutfit}
          backgroundColor={isDark ? '#FFFFFF' : '#000000'}
          iconColor={isDark ? '#000000' : '#FFFFFF'}
          accessibilityLabel="Create new outfit"
        />
      )}

      {/* Outfit Filter Modal */}
      <OutfitFilter
        visible={showFilterMenu}
        onClose={() => setShowFilterMenu(false)}
        onApply={handleApplyFilters}
        initialFilters={outfitFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    // backgroundColor set dynamically
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
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  deleteButtonDisabled: {
    backgroundColor: '#CCC',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
